import { Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { Task, Project, User, TaskAttachment, LeaveRequest, TaskDependency, TaskComment } from '../models';
import { TaskStatus, TaskPriority } from '../types/enums';
import logger from '../utils/logger';
import { createNotification } from '../services/notification.service';
import { emitToUser, emitToUsers } from '../services/socket.service';

// Get all tasks with pagination and filters
export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, search, status, priority, projectId, assigneeId, overdue, myTasks } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userDepartmentId = req.user?.departmentId;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    const projectWhere: any = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by priority
    if (priority) {
      where.priority = priority;
    }

    // Filter by project
    if (projectId) {
      where.projectId = projectId;
    }

    // Filter by assignee
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Filter my tasks
    if (myTasks === 'true') {
      where.assigneeId = userId;
    }

    // Filter overdue tasks
    if (overdue === 'true') {
      where.status = { [Op.ne]: TaskStatus.DONE };
      where.dueDate = { [Op.lt]: new Date() };
    }

    // Search by title or description
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Regular employees can only see tasks in their department's projects or assigned to them
    if (userRole === 'employee') {
      where[Op.or] = [
        { assigneeId: userId },
        { '$project.department_id$': userDepartmentId },
      ];
    }

    const { count, rows } = await Task.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [
        ['due_date', 'ASC NULLS LAST'],
        ['priority', 'ASC'],
        ['created_at', 'DESC'],
      ],
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'departmentId', 'status'],
          where: projectWhere,
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: TaskAttachment,
          as: 'attachments',
          attributes: ['id', 'linkTitle', 'linkUrl'],
        },
      ],
    });

    // Check if assignees are on leave
    const assigneeIds = [...new Set(rows.map((t: any) => t.assigneeId).filter(Boolean))];
    const today = new Date();

    const usersOnLeave = await LeaveRequest.findAll({
      where: {
        userId: { [Op.in]: assigneeIds },
        status: 'approved',
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
      },
      attributes: ['userId'],
      raw: true,
    });

    const usersOnLeaveIds = new Set(usersOnLeave.map((l: any) => l.userId));

    // Add leave status to tasks
    const tasksWithLeaveStatus = rows.map((task: any) => ({
      ...task.toJSON(),
      assigneeOnLeave: task.assigneeId ? usersOnLeaveIds.has(task.assigneeId) : false,
      isOverdue: task.dueDate && new Date(task.dueDate) < today && task.status !== TaskStatus.DONE,
    }));

    res.json({
      items: tasksWithLeaveStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

// Get task by ID
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'departmentId', 'status'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: TaskAttachment,
          as: 'attachments',
          include: [
            {
              model: User,
              as: 'uploader',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check if assignee is on leave
    const today = new Date();
    let assigneeOnLeave = false;

    if (task.assigneeId) {
      const leave = await LeaveRequest.findOne({
        where: {
          userId: task.assigneeId,
          status: 'approved',
          startDate: { [Op.lte]: today },
          endDate: { [Op.gte]: today },
        },
      });
      assigneeOnLeave = !!leave;
    }

    // Fetch dependencies for blocked status info
    const dependencies = await TaskDependency.findAll({
      where: { taskId: id },
      include: [{
        model: Task,
        as: 'dependsOnTask',
        attributes: ['id', 'title', 'taskCode', 'status', 'priority', 'assigneeId', 'dueDate'],
        include: [{
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName'],
        }],
      }],
    });

    const dependencyTasks = dependencies.map((d: any) => d.dependsOnTask);

    // Get comment count
    const commentCount = await TaskComment.count({ where: { taskId: id } });

    res.json({
      ...task.toJSON(),
      assigneeOnLeave,
      isOverdue: task.dueDate && new Date(task.dueDate) < today && task.status !== TaskStatus.DONE,
      dependencies: dependencyTasks,
      commentCount,
    });
  } catch (error) {
    logger.error('Error fetching task:', error);
    res.status(500).json({ message: 'Failed to fetch task' });
  }
};

// Create task
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, title, description, status, priority, assigneeId, dueDate, estimatedHours, tags, attachmentUrl } = req.body;

    if (!projectId || !title) {
      res.status(400).json({ message: 'Project ID and title are required' });
      return;
    }

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const task = await Task.create({
      projectId,
      title,
      description,
      status: status || TaskStatus.TODO,
      priority: priority || TaskPriority.MEDIUM,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      estimatedHours: estimatedHours || null,
      tags: tags || [],
      attachmentUrl: attachmentUrl || null,
      createdBy: req.user?.id,
    });

    // Send notification to assignee
    if (assigneeId && assigneeId !== req.user?.id) {
      await createNotification({
        userId: assigneeId,
        type: 'task',
        title: 'New Task Assigned',
        message: `You have been assigned to task "${title}" in project "${project.name}"`,
        actionUrl: `/projects?task=${task.id}`,
        relatedId: task.id,
        relatedType: 'task',
      });
    }

    // Fetch the created task with associations
    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    logger.info(`Task created: ${task.id} - ${task.title}`);
    res.status(201).json(createdTask);
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

// Update task
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigneeId, dueDate, estimatedHours, tags, attachmentUrl, blockReason } = req.body;

    const task = await Task.findByPk(id, {
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const previousAssigneeId = task.assigneeId;
    const previousStatus = task.status;

    // Determine blockReason value
    let newBlockReason: string | undefined = task.blockReason;
    if (status === TaskStatus.BLOCKED || task.status === TaskStatus.BLOCKED) {
      // If moving to blocked or already blocked, update blockReason if provided
      if (blockReason !== undefined) {
        newBlockReason = blockReason || undefined;
      }
    }
    if (status && status !== TaskStatus.BLOCKED && task.status === TaskStatus.BLOCKED) {
      // If moving out of blocked status, clear blockReason
      newBlockReason = undefined;
    }

    await task.update({
      title: title ?? task.title,
      description: description ?? task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      estimatedHours: estimatedHours !== undefined ? estimatedHours : task.estimatedHours,
      tags: tags ?? task.tags,
      attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : task.attachmentUrl,
      blockReason: newBlockReason,
    });

    // Send notification if assignee changed
    if (assigneeId && assigneeId !== previousAssigneeId && assigneeId !== req.user?.id) {
      await createNotification({
        userId: assigneeId,
        type: 'task',
        title: 'Task Assigned',
        message: `You have been assigned to task "${task.title}" in project "${(task as any).project.name}"`,
        actionUrl: `/projects?task=${task.id}`,
        relatedId: task.id,
        relatedType: 'task',
      });
    }

    // Send notification if status changed to done
    if (status === TaskStatus.DONE && previousStatus !== TaskStatus.DONE && task.createdBy && task.createdBy !== req.user?.id) {
      await createNotification({
        userId: task.createdBy,
        type: 'task',
        title: 'Task Completed',
        message: `Task "${task.title}" has been marked as done`,
        actionUrl: `/projects?task=${task.id}`,
        relatedId: task.id,
        relatedType: 'task',
      });
    }

    // Fetch updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    logger.info(`Task updated: ${id}`);
    res.json(updatedTask);
  } catch (error) {
    logger.error('Error updating task:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    await task.destroy();

    logger.info(`Task deleted: ${id}`);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

// Update task status (quick update)
export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, blockReason, dependencyIds } = req.body;

    if (!status || !Object.values(TaskStatus).includes(status)) {
      res.status(400).json({ message: 'Valid status is required' });
      return;
    }

    const task = await Task.findByPk(id, {
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check if task is blocked and trying to move to in_progress
    if (status === TaskStatus.IN_PROGRESS && task.status === TaskStatus.BLOCKED) {
      const { isBlocked, blockingTasks } = await computeBlockedStatus(parseInt(id));
      if (isBlocked) {
        res.status(400).json({
          message: 'Cannot move blocked task to In Progress. Complete blocking dependencies first.',
          blockingTasks,
        });
        return;
      }
    }

    // If setting to blocked, must provide either dependencies or blockReason
    if (status === TaskStatus.BLOCKED && task.status !== TaskStatus.BLOCKED) {
      const hasDependencies = dependencyIds && dependencyIds.length > 0;
      const hasBlockReason = blockReason && blockReason.trim().length > 0;

      // Check existing dependencies
      const existingDeps = await TaskDependency.count({ where: { taskId: parseInt(id) } });

      if (!hasDependencies && existingDeps === 0 && !hasBlockReason) {
        res.status(400).json({
          message: 'To block a task, you must either add blocking dependencies or provide a block reason',
        });
        return;
      }

      // Add new dependencies if provided
      if (hasDependencies) {
        for (const depId of dependencyIds) {
          // Check for circular dependency
          const wouldBeCircular = await checkCircularDependency(parseInt(id), depId);
          if (!wouldBeCircular) {
            await TaskDependency.findOrCreate({
              where: { taskId: parseInt(id), dependsOnTaskId: depId },
              defaults: { taskId: parseInt(id), dependsOnTaskId: depId, createdBy: req.user?.id },
            });
          }
        }
      }
    }

    const previousStatus = task.status;

    // Update task with status and blockReason
    const updateData: any = { status };
    if (status === TaskStatus.BLOCKED) {
      updateData.blockReason = blockReason || task.blockReason;
    } else {
      // Clear blockReason when moving out of blocked status
      updateData.blockReason = null;
    }

    await task.update(updateData);

    // Send notification if completed
    if (status === TaskStatus.DONE && previousStatus !== TaskStatus.DONE && task.createdBy && task.createdBy !== req.user?.id) {
      await createNotification({
        userId: task.createdBy,
        type: 'task',
        title: 'Task Completed',
        message: `Task "${task.title}" has been marked as done`,
        actionUrl: `/projects?task=${task.id}`,
        relatedId: task.id,
        relatedType: 'task',
      });
    }

    // Update dependent tasks when completed
    if ((status === TaskStatus.DONE || status === TaskStatus.APPROVED) &&
        previousStatus !== TaskStatus.DONE && previousStatus !== TaskStatus.APPROVED) {
      await updateDependentTasksOnCompletion(parseInt(id));
    }

    logger.info(`Task status updated: ${id} -> ${status}`);
    res.json(task);
  } catch (error) {
    logger.error('Error updating task status:', error);
    res.status(500).json({ message: 'Failed to update task status' });
  }
};

// Add link attachment to task
export const addTaskAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { links } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (!links || !Array.isArray(links) || links.length === 0) {
      res.status(400).json({ message: 'No links provided' });
      return;
    }

    // Validate each link has required fields
    for (const link of links) {
      if (!link.linkUrl || !link.linkTitle) {
        res.status(400).json({ message: 'Each link must have linkUrl and linkTitle' });
        return;
      }
    }

    const attachments = await Promise.all(
      links.map((link: { linkUrl: string; linkTitle: string }) =>
        TaskAttachment.create({
          taskId: task.id,
          linkTitle: link.linkTitle,
          linkUrl: link.linkUrl,
          uploadedBy: req.user?.id,
        })
      )
    );

    res.status(201).json(attachments);
  } catch (error) {
    logger.error('Error adding task attachment:', error);
    res.status(500).json({ message: 'Failed to add attachment' });
  }
};

// Delete task attachment
export const deleteTaskAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, attachmentId } = req.params;

    const attachment = await TaskAttachment.findOne({
      where: { id: attachmentId, taskId: id },
    });

    if (!attachment) {
      res.status(404).json({ message: 'Attachment not found' });
      return;
    }

    await attachment.destroy();

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    logger.error('Error deleting task attachment:', error);
    res.status(500).json({ message: 'Failed to delete attachment' });
  }
};

// Get tasks by user (for reports)
export const getTasksByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasksByUser = await Task.findAll({
      attributes: [
        'assigneeId',
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('Task.id')), 'count'],
      ],
      where: {
        assigneeId: { [Op.ne]: null as any },
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      group: ['assigneeId', 'status', 'assignee.id', 'assignee.first_name', 'assignee.last_name'],
      raw: false,
    });

    // Reorganize data by user
    const userTaskMap: any = {};
    tasksByUser.forEach((item: any) => {
      const userId = item.assigneeId;
      if (!userTaskMap[userId]) {
        userTaskMap[userId] = {
          user: item.assignee,
          tasks: { total: 0, todo: 0, in_progress: 0, done: 0, approved: 0 },
        };
      }
      const count = parseInt(item.get('count'));
      userTaskMap[userId].tasks[item.status] = count;
      userTaskMap[userId].tasks.total += count;
    });

    res.json(Object.values(userTaskMap));
  } catch (error) {
    logger.error('Error fetching tasks by user:', error);
    res.status(500).json({ message: 'Failed to fetch tasks by user' });
  }
};

// ============================================
// TASK DEPENDENCIES
// ============================================

// Helper function to compute blocked status for a task
export const computeBlockedStatus = async (taskId: number): Promise<{
  isBlocked: boolean;
  blockingTasks: any[];
}> => {
  const dependencies = await TaskDependency.findAll({
    where: { taskId },
    include: [{
      model: Task,
      as: 'dependsOnTask',
      attributes: ['id', 'title', 'taskCode', 'status'],
    }],
  });

  const blockingTasks = dependencies
    .filter((dep: any) => {
      const status = dep.dependsOnTask?.status;
      return status !== TaskStatus.DONE && status !== TaskStatus.APPROVED;
    })
    .map((dep: any) => dep.dependsOnTask);

  return {
    isBlocked: blockingTasks.length > 0,
    blockingTasks,
  };
};

// Get task dependencies
export const getTaskDependencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const dependencies = await TaskDependency.findAll({
      where: { taskId: id },
      include: [{
        model: Task,
        as: 'dependsOnTask',
        attributes: ['id', 'title', 'taskCode', 'status', 'priority', 'assigneeId', 'dueDate'],
        include: [{
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName'],
        }],
      }],
    });

    const { isBlocked, blockingTasks } = await computeBlockedStatus(parseInt(id));

    res.json({
      dependencies: dependencies.map((d: any) => d.dependsOnTask),
      isBlocked,
      blockingTasks,
    });
  } catch (error) {
    logger.error('Error fetching task dependencies:', error);
    res.status(500).json({ message: 'Failed to fetch dependencies' });
  }
};

// Add dependencies to a task
export const addTaskDependencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { dependencyIds } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!dependencyIds || !Array.isArray(dependencyIds) || dependencyIds.length === 0) {
      res.status(400).json({ message: 'dependencyIds array is required' });
      return;
    }

    const task = await Task.findByPk(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Permission check: admin/manager or task assignee
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
    const isAssignee = task.assigneeId === userId;
    if (!isAdminOrManager && !isAssignee) {
      res.status(403).json({ message: 'You do not have permission to modify dependencies for this task' });
      return;
    }

    // Validate all dependency tasks exist and are in the same project
    const dependencyTasks = await Task.findAll({
      where: { id: { [Op.in]: dependencyIds } },
    });

    if (dependencyTasks.length !== dependencyIds.length) {
      res.status(400).json({ message: 'Some dependency tasks not found' });
      return;
    }

    // Check for same project constraint
    const invalidDeps = dependencyTasks.filter((t: any) => t.projectId !== task.projectId);
    if (invalidDeps.length > 0) {
      res.status(400).json({ message: 'Dependencies must be from the same project' });
      return;
    }

    // Check for circular dependencies
    for (const depId of dependencyIds) {
      if (depId === parseInt(id)) {
        res.status(400).json({ message: 'Task cannot depend on itself' });
        return;
      }

      // Check if adding this would create a cycle
      const wouldCreateCycle = await checkCircularDependency(parseInt(id), depId);
      if (wouldCreateCycle) {
        res.status(400).json({ message: `Adding dependency ${depId} would create a circular dependency` });
        return;
      }
    }

    // Create dependencies (ignore duplicates)
    const created = [];
    for (const depId of dependencyIds) {
      const existing = await TaskDependency.findOne({
        where: { taskId: id, dependsOnTaskId: depId },
      });

      if (!existing) {
        const dep = await TaskDependency.create({
          taskId: parseInt(id),
          dependsOnTaskId: depId,
          createdBy: req.user?.id,
        });
        created.push(dep);
      }
    }

    // Update task blocked status
    const { isBlocked } = await computeBlockedStatus(parseInt(id));
    if (isBlocked && task.status !== TaskStatus.BLOCKED) {
      await task.update({ status: TaskStatus.BLOCKED });
    }

    logger.info(`Dependencies added to task ${id}: ${dependencyIds.join(', ')}`);
    res.status(201).json({ message: 'Dependencies added', count: created.length });
  } catch (error) {
    logger.error('Error adding task dependencies:', error);
    res.status(500).json({ message: 'Failed to add dependencies' });
  }
};

// Helper to check for circular dependencies
const checkCircularDependency = async (taskId: number, newDepId: number, visited: Set<number> = new Set()): Promise<boolean> => {
  if (visited.has(newDepId)) {
    return newDepId === taskId;
  }

  visited.add(newDepId);

  // Get dependencies of the new dependency
  const deps = await TaskDependency.findAll({
    where: { taskId: newDepId },
    attributes: ['dependsOnTaskId'],
  });

  for (const dep of deps) {
    if ((dep as any).dependsOnTaskId === taskId) {
      return true;
    }
    const hasCycle = await checkCircularDependency(taskId, (dep as any).dependsOnTaskId, visited);
    if (hasCycle) return true;
  }

  return false;
};

// Remove a dependency from a task
export const removeTaskDependency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, dependencyId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const task = await Task.findByPk(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Permission check: admin/manager or task assignee
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
    const isAssignee = task.assigneeId === userId;
    if (!isAdminOrManager && !isAssignee) {
      res.status(403).json({ message: 'You do not have permission to modify dependencies for this task' });
      return;
    }

    const dependency = await TaskDependency.findOne({
      where: { taskId: id, dependsOnTaskId: dependencyId },
    });

    if (!dependency) {
      res.status(404).json({ message: 'Dependency not found' });
      return;
    }

    await dependency.destroy();

    // Re-check blocked status
    if (task.status === TaskStatus.BLOCKED) {
      const { isBlocked } = await computeBlockedStatus(parseInt(id));
      if (!isBlocked) {
        await task.update({ status: TaskStatus.TODO });
      }
    }

    logger.info(`Dependency removed from task ${id}: ${dependencyId}`);
    res.json({ message: 'Dependency removed' });
  } catch (error) {
    logger.error('Error removing task dependency:', error);
    res.status(500).json({ message: 'Failed to remove dependency' });
  }
};

// Update dependent tasks when a task is completed
export const updateDependentTasksOnCompletion = async (completedTaskId: number): Promise<void> => {
  try {
    // Find all tasks that depend on this completed task
    const dependentRelations = await TaskDependency.findAll({
      where: { dependsOnTaskId: completedTaskId },
    });

    for (const relation of dependentRelations) {
      const taskId = (relation as any).taskId;
      const task = await Task.findByPk(taskId);

      if (task && task.status === TaskStatus.BLOCKED) {
        const { isBlocked } = await computeBlockedStatus(taskId);
        if (!isBlocked) {
          await task.update({ status: TaskStatus.TODO });
          logger.info(`Task ${taskId} unblocked after completion of ${completedTaskId}`);
        }
      }
    }
  } catch (error) {
    logger.error('Error updating dependent tasks:', error);
  }
};

// ============================================
// TASK COMMENTS
// ============================================

// Helper to parse @mentions from content
// Matches both @[5] and @[5:John Doe] formats
const parseMentions = (content: string): number[] => {
  const mentionPattern = /@\[(\d+)(?::[^\]]+)?\]/g;
  const mentions: number[] = [];
  let match;
  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(parseInt(match[1], 10));
  }
  return [...new Set(mentions)];
};

// Check if user can comment on a task
const canComment = async (userId: number, userRole: string, task: any): Promise<boolean> => {
  if (userRole === 'admin' || userRole === 'manager') {
    return true;
  }
  // Assignee or creator can comment
  return task.assigneeId === userId || task.createdBy === userId;
};

// Get task comments
export const getTaskComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Get top-level comments (no parent)
    const topLevelComments = await TaskComment.findAll({
      where: { taskId, parentId: { [Op.is]: null as any } },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'profileImageUrl'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Get all replies for these comments
    const commentIds = topLevelComments.map((c) => c.id);
    const replies = commentIds.length > 0 ? await TaskComment.findAll({
      where: { parentId: { [Op.in]: commentIds } },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'profileImageUrl'],
        },
      ],
      order: [['created_at', 'ASC']],
    }) : [];

    // Attach replies to their parent comments
    const commentsWithReplies = topLevelComments.map((comment) => {
      const commentReplies = replies.filter((r) => r.parentId === comment.id);
      return {
        ...comment.toJSON(),
        replies: commentReplies.map((r) => r.toJSON()),
      };
    });

    res.json(commentsWithReplies);
  } catch (error) {
    logger.error('Error fetching task comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

// Create a comment
export const createTaskComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role || '';

    if (!content || content.trim().length === 0) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check permission
    const hasPermission = await canComment(userId!, userRole, task);
    if (!hasPermission) {
      res.status(403).json({ message: 'You do not have permission to comment on this task' });
      return;
    }

    // Validate parent comment if provided
    let parentCommentAuthorId: number | null = null;
    if (parentId) {
      const parentComment = await TaskComment.findOne({
        where: { id: parentId, taskId },
      });
      if (!parentComment) {
        res.status(400).json({ message: 'Parent comment not found' });
        return;
      }
      parentCommentAuthorId = parentComment.userId;
    }

    // Parse mentions
    const mentions = parseMentions(content);

    // Create comment
    const comment = await TaskComment.create({
      taskId: parseInt(taskId),
      userId: userId!,
      parentId: parentId || null,
      content: content.trim(),
      mentions,
    });

    // Send notifications to mentioned users
    for (const mentionedUserId of mentions) {
      if (mentionedUserId !== userId) {
        await createNotification({
          userId: mentionedUserId,
          type: 'task',
          title: 'You were mentioned in a comment',
          message: `You were mentioned in a comment on task "${task.title}"`,
          actionUrl: `/projects?task=${taskId}`,
          relatedId: parseInt(taskId),
          relatedType: 'task_comment',
        });
      }
    }

    // Notify task assignee if not the commenter and not already mentioned
    if (task.assigneeId && task.assigneeId !== userId && !mentions.includes(task.assigneeId)) {
      await createNotification({
        userId: task.assigneeId,
        type: 'task',
        title: 'New comment on your task',
        message: `New comment on task "${task.title}"`,
        actionUrl: `/projects?task=${taskId}`,
        relatedId: parseInt(taskId),
        relatedType: 'task_comment',
      });
    }

    // Notify parent comment author if this is a reply
    if (
      parentCommentAuthorId &&
      parentCommentAuthorId !== userId &&
      !mentions.includes(parentCommentAuthorId) &&
      parentCommentAuthorId !== task.assigneeId
    ) {
      await createNotification({
        userId: parentCommentAuthorId,
        type: 'task',
        title: 'Someone replied to your comment',
        message: `Someone replied to your comment on task "${task.title}"`,
        actionUrl: `/projects?task=${taskId}`,
        relatedId: parseInt(taskId),
        relatedType: 'task_comment',
      });
    }

    // Fetch comment with author
    const createdComment = await TaskComment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName', 'profileImageUrl'],
      }],
    });

    logger.info(`Comment created on task ${taskId} by user ${userId}`);

    // Emit real-time event to task viewers
    const viewers = new Set<number>();
    if (task.assigneeId) viewers.add(task.assigneeId);
    if (task.createdBy) viewers.add(task.createdBy);
    if (parentCommentAuthorId) viewers.add(parentCommentAuthorId);
    mentions.forEach((id) => viewers.add(id));
    viewers.delete(userId!); // Don't notify the commenter

    if (viewers.size > 0) {
      emitToUsers([...viewers], 'taskCommentAdded', {
        taskId: parseInt(taskId),
        comment: createdComment,
      });
    }

    res.status(201).json(createdComment);
  } catch (error) {
    logger.error('Error creating task comment:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
};

// Update a comment
export const updateTaskComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role || '';

    if (!content || content.trim().length === 0) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const comment = await TaskComment.findOne({
      where: { id: commentId, taskId },
    });

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Only author or admin can edit
    if (comment.userId !== userId && userRole !== 'admin') {
      res.status(403).json({ message: 'You can only edit your own comments' });
      return;
    }

    // Parse new mentions
    const mentions = parseMentions(content);

    await comment.update({
      content: content.trim(),
      mentions,
      isEdited: true,
      editedAt: new Date(),
    });

    // Fetch updated comment with author
    const updatedComment = await TaskComment.findByPk(commentId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName', 'profileImageUrl'],
      }],
    });

    // Emit real-time event
    const task = await Task.findByPk(taskId);
    if (task) {
      const viewers = new Set<number>();
      if (task.assigneeId) viewers.add(task.assigneeId);
      if (task.createdBy) viewers.add(task.createdBy);
      viewers.delete(userId!);

      if (viewers.size > 0) {
        emitToUsers([...viewers], 'taskCommentUpdated', {
          taskId: parseInt(taskId),
          comment: updatedComment,
        });
      }
    }

    logger.info(`Comment ${commentId} updated on task ${taskId}`);
    res.json(updatedComment);
  } catch (error) {
    logger.error('Error updating task comment:', error);
    res.status(500).json({ message: 'Failed to update comment' });
  }
};

// Delete a comment
export const deleteTaskComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, commentId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role || '';

    const comment = await TaskComment.findOne({
      where: { id: commentId, taskId },
    });

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Only author, admin, or manager can delete
    if (comment.userId !== userId && userRole !== 'admin' && userRole !== 'manager') {
      res.status(403).json({ message: 'You do not have permission to delete this comment' });
      return;
    }

    await comment.destroy();

    // Emit real-time event
    const task = await Task.findByPk(taskId);
    if (task) {
      const viewers = new Set<number>();
      if (task.assigneeId) viewers.add(task.assigneeId);
      if (task.createdBy) viewers.add(task.createdBy);
      viewers.delete(userId!);

      if (viewers.size > 0) {
        emitToUsers([...viewers], 'taskCommentDeleted', {
          taskId: parseInt(taskId),
          commentId: parseInt(commentId),
        });
      }
    }

    logger.info(`Comment ${commentId} deleted from task ${taskId}`);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    logger.error('Error deleting task comment:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};
