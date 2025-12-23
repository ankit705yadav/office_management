import { Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { Task, Project, User, TaskAttachment, LeaveRequest } from '../models';
import { TaskStatus, TaskPriority } from '../types/enums';
import logger from '../utils/logger';
import { createNotification } from '../services/notification.service';

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

    res.json({
      ...task.toJSON(),
      assigneeOnLeave,
      isOverdue: task.dueDate && new Date(task.dueDate) < today && task.status !== TaskStatus.DONE,
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
    const { title, description, status, priority, assigneeId, dueDate, estimatedHours, tags, attachmentUrl } = req.body;

    const task = await Task.findByPk(id, {
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const previousAssigneeId = task.assigneeId;
    const previousStatus = task.status;

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
    const { status } = req.body;

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

    const previousStatus = task.status;
    await task.update({ status });

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
