import { Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { Project, Task, User, Department, TaskAttachment, ProjectAttachment, LeaveRequest, Client } from '../models';
import { ProjectStatus, TaskStatus, TaskPriority } from '../types/enums';
import logger from '../utils/logger';
import { createNotification } from '../services/notification.service';

// Get all projects with pagination and filters
export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, search, status, departmentId, priority } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userDepartmentId = req.user?.departmentId;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by department
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Filter by priority
    if (priority) {
      where.priority = priority;
    }

    // Search by name or description
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // For employees: show projects in their department OR projects with their assigned tasks
    if (userRole === 'employee') {
      // Get project IDs where user has assigned tasks
      const tasksAssignedToMe = await Task.findAll({
        where: { assigneeId: userId },
        attributes: ['projectId'],
        raw: true,
      });
      const projectIdsWithMyTasks = [...new Set(tasksAssignedToMe.map((t: any) => t.projectId))];

      where[Op.or] = [
        { departmentId: userDepartmentId },
        ...(projectIdsWithMyTasks.length > 0 ? [{ id: { [Op.in]: projectIdsWithMyTasks } }] : []),
      ];
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'status'],
        },
      ],
    });

    // Add task counts to each project
    const projectsWithCounts = rows.map((project: any) => {
      const tasks = project.tasks || [];
      const taskCounts = {
        total: tasks.length,
        todo: tasks.filter((t: any) => t.status === TaskStatus.TODO).length,
        inProgress: tasks.filter((t: any) => t.status === TaskStatus.IN_PROGRESS).length,
        done: tasks.filter((t: any) => t.status === TaskStatus.DONE).length,
        approved: tasks.filter((t: any) => t.status === TaskStatus.APPROVED).length,
      };
      const { tasks: _, ...projectData } = project.toJSON();
      return {
        ...projectData,
        taskCounts,
        progress: taskCounts.total > 0 ? Math.round((taskCounts.done / taskCounts.total) * 100) : 0,
      };
    });

    res.json({
      items: projectsWithCounts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

// Get project by ID
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone', 'contactPerson'],
        },
        {
          model: ProjectAttachment,
          as: 'attachments',
          include: [
            {
              model: User,
              as: 'uploader',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'status'],
        },
      ],
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Add task counts
    const tasks = (project as any).tasks || [];
    const taskCounts = {
      total: tasks.length,
      todo: tasks.filter((t: any) => t.status === TaskStatus.TODO).length,
      inProgress: tasks.filter((t: any) => t.status === TaskStatus.IN_PROGRESS).length,
      done: tasks.filter((t: any) => t.status === TaskStatus.DONE).length,
      approved: tasks.filter((t: any) => t.status === TaskStatus.APPROVED).length,
    };

    const { tasks: _, ...projectData } = project.toJSON() as any;

    res.json({
      ...projectData,
      taskCounts,
      progress: taskCounts.total > 0 ? Math.round((taskCounts.done / taskCounts.total) * 100) : 0,
    });
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({ message: 'Failed to fetch project' });
  }
};

// Create project
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, departmentId, ownerId, clientId, priority, startDate, endDate, budget, attachmentUrl } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Project name is required' });
      return;
    }

    const project = await Project.create({
      name,
      description,
      departmentId: departmentId || null,
      ownerId: ownerId || req.user?.id,
      clientId: clientId || null,
      status: ProjectStatus.ACTIVE,
      priority: priority || 'medium',
      startDate,
      endDate,
      budget,
      attachmentUrl: attachmentUrl || null,
      createdBy: req.user?.id,
    });

    // Fetch the created project with associations
    const createdProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    logger.info(`Project created: ${project.id} - ${project.name}`);
    res.status(201).json(createdProject);
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
};

// Update project
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, departmentId, ownerId, clientId, status, priority, startDate, endDate, budget, attachmentUrl } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    await project.update({
      name: name ?? project.name,
      description: description ?? project.description,
      departmentId: departmentId !== undefined ? departmentId : project.departmentId,
      ownerId: ownerId !== undefined ? ownerId : project.ownerId,
      clientId: clientId !== undefined ? clientId : project.clientId,
      status: status ?? project.status,
      priority: priority ?? project.priority,
      startDate: startDate !== undefined ? startDate : project.startDate,
      endDate: endDate !== undefined ? endDate : project.endDate,
      budget: budget !== undefined ? budget : project.budget,
      attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : project.attachmentUrl,
    });

    // Fetch updated project with associations
    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    logger.info(`Project updated: ${id}`);
    res.json(updatedProject);
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({ message: 'Failed to update project' });
  }
};

// Delete project
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Check if project has tasks
    const taskCount = await Task.count({ where: { projectId: id } });
    if (taskCount > 0) {
      res.status(400).json({ message: 'Cannot delete project with existing tasks. Delete tasks first or mark project as cancelled.' });
      return;
    }

    await project.destroy();

    logger.info(`Project deleted: ${id}`);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
};

// Get project statistics/dashboard
export const getProjectStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userDepartmentId = req.user?.departmentId;

    const where: any = {};

    // Regular employees can only see stats for their department
    if (userRole === 'employee') {
      where.departmentId = userDepartmentId;
    }

    // Total projects by status
    const projectsByStatus = await Project.findAll({
      where,
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('Project.id')), 'count'],
      ],
      group: ['Project.status'],
      raw: true,
    });

    // Total tasks by status
    const taskWhere: any = {};
    if (userRole === 'employee') {
      taskWhere['$project.department_id$'] = userDepartmentId;
    }

    const tasksByStatus = await Task.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('Task.id')), 'count'],
      ],
      include: [
        {
          model: Project,
          as: 'project',
          attributes: [],
          where: userRole === 'employee' ? { departmentId: userDepartmentId } : {},
        },
      ],
      group: ['Task.status'],
      raw: true,
    });

    // Overdue tasks
    const overdueTasks = await Task.count({
      where: {
        status: { [Op.ne]: TaskStatus.DONE },
        dueDate: { [Op.lt]: new Date() },
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: [],
          where: userRole === 'employee' ? { departmentId: userDepartmentId } : {},
        },
      ],
    });

    // My assigned tasks (for all users)
    const myTasks = await Task.count({
      where: { assigneeId: userId },
    });

    const myOverdueTasks = await Task.count({
      where: {
        assigneeId: userId,
        status: { [Op.ne]: TaskStatus.DONE },
        dueDate: { [Op.lt]: new Date() },
      },
    });

    // Tasks due this week
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    const tasksDueThisWeek = await Task.count({
      where: {
        status: { [Op.ne]: TaskStatus.DONE },
        dueDate: { [Op.between]: [today, weekEnd] },
        ...(userRole === 'employee' ? { assigneeId: userId } : {}),
      },
    });

    res.json({
      projectsByStatus: projectsByStatus.reduce((acc: any, item: any) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      tasksByStatus: tasksByStatus.reduce((acc: any, item: any) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      overdueTasks,
      myTasks,
      myOverdueTasks,
      tasksDueThisWeek,
    });
  } catch (error) {
    logger.error('Error fetching project stats:', error);
    res.status(500).json({ message: 'Failed to fetch project statistics' });
  }
};

// Get tasks at risk due to leave
export const getTasksAtRiskDueToLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14);

    // Get approved leaves in the next 2 weeks
    const upcomingLeaves = await LeaveRequest.findAll({
      where: {
        status: 'approved',
        startDate: { [Op.lte]: nextWeek },
        endDate: { [Op.gte]: today },
      },
      attributes: ['userId', 'startDate', 'endDate'],
      raw: true,
    });

    if (upcomingLeaves.length === 0) {
      res.json({ tasksAtRisk: [], usersOnLeave: [] });
      return;
    }

    const userIdsOnLeave = [...new Set(upcomingLeaves.map((l: any) => l.userId))];

    // Get tasks assigned to users who are on leave
    const tasksAtRisk = await Task.findAll({
      where: {
        assigneeId: { [Op.in]: userIdsOnLeave },
        status: { [Op.ne]: TaskStatus.DONE },
        dueDate: { [Op.lte]: nextWeek },
      },
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

    // Get user details with their leave dates
    const usersOnLeave = await User.findAll({
      where: { id: { [Op.in]: userIdsOnLeave } },
      attributes: ['id', 'firstName', 'lastName', 'email'],
      raw: true,
    });

    const usersWithLeaves = usersOnLeave.map((user: any) => ({
      ...user,
      leaves: upcomingLeaves.filter((l: any) => l.userId === user.id),
    }));

    res.json({
      tasksAtRisk,
      usersOnLeave: usersWithLeaves,
    });
  } catch (error) {
    logger.error('Error fetching tasks at risk:', error);
    res.status(500).json({ message: 'Failed to fetch tasks at risk' });
  }
};

// Generate unique task code within a project
const generateTaskCode = async (projectId: number): Promise<string> => {
  const prefix = `T${projectId}-`;

  const lastTask = await Task.findOne({
    where: {
      projectId,
      taskCode: { [Op.like]: `${prefix}%` },
    },
    order: [['taskCode', 'DESC']],
  });

  let nextNum = 1;
  if (lastTask?.taskCode) {
    const parts = lastTask.taskCode.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

// Get tasks for Kanban board (grouped by status)
export const getTasksForBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const tasks = await Task.findAll({
      where: { projectId: id },
      order: [['sortOrder', 'ASC'], ['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
        },
        {
          model: TaskAttachment,
          as: 'attachments',
          attributes: ['id'],
        },
        {
          model: Task,
          as: 'dependsOn',
          attributes: ['id', 'title', 'status'],
        },
      ],
    });

    // Check leave status for assignees
    const today = new Date();
    const assigneeIds = [...new Set(tasks.filter(t => t.assigneeId).map(t => t.assigneeId as number))];

    const leavesMap: { [key: number]: any } = {};
    if (assigneeIds.length > 0) {
      const leaves = await LeaveRequest.findAll({
        where: {
          userId: { [Op.in]: assigneeIds },
          status: 'approved',
          startDate: { [Op.lte]: today },
          endDate: { [Op.gte]: today },
        },
        attributes: ['userId', 'startDate', 'endDate', 'leaveType'],
      });
      leaves.forEach((leave: any) => {
        leavesMap[leave.userId] = leave;
      });
    }

    // Group tasks by status with leave info
    const board = {
      todo: [] as any[],
      in_progress: [] as any[],
      blocked: [] as any[],
      done: [] as any[],
      approved: [] as any[],
    };

    tasks.forEach((task: any) => {
      const taskData = task.toJSON();
      taskData.assigneeOnLeave = task.assigneeId ? !!leavesMap[task.assigneeId] : false;
      if (taskData.assigneeOnLeave) {
        taskData.leaveInfo = leavesMap[task.assigneeId];
      }

      const status = task.status as string;
      if (status === 'todo') board.todo.push(taskData);
      else if (status === 'in_progress') board.in_progress.push(taskData);
      else if (status === 'blocked') board.blocked.push(taskData);
      else if (status === 'done') board.done.push(taskData);
      else if (status === 'approved') board.approved.push(taskData);
    });

    res.json(board);
  } catch (error) {
    logger.error('Error fetching tasks for board:', error);
    res.status(500).json({ message: 'Failed to fetch board data' });
  }
};

// Reorder tasks (for drag and drop in Kanban)
export const reorderTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tasks } = req.body;
    const userRole = req.user?.role;

    if (!Array.isArray(tasks)) {
      res.status(400).json({ message: 'Tasks array is required' });
      return;
    }

    // Check if any task is being moved to 'approved' - only manager/admin can do this
    const hasApprovedStatus = tasks.some((t: any) => t.status === 'approved');
    if (hasApprovedStatus && userRole !== 'admin' && userRole !== 'manager') {
      res.status(403).json({ message: 'Task approval can only be done by Manager/Admin' });
      return;
    }

    // Update each task's status and order
    for (const taskUpdate of tasks) {
      const { id, status, sortOrder } = taskUpdate;
      await Task.update(
        { status, sortOrder },
        { where: { id } }
      );
    }

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    logger.error('Error reordering tasks:', error);
    res.status(500).json({ message: 'Failed to reorder tasks' });
  }
};

// Check if user is on leave
export const checkAssigneeLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { dueDate } = req.query;

    const today = new Date();
    const checkEnd = dueDate ? new Date(dueDate as string) : new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const leave = await LeaveRequest.findOne({
      where: {
        userId: parseInt(userId, 10),
        status: 'approved',
        startDate: { [Op.lte]: checkEnd },
        endDate: { [Op.gte]: today },
      },
      attributes: ['id', 'startDate', 'endDate', 'leaveType'],
    });

    res.json({
      isOnLeave: !!leave,
      leave: leave || null,
    });
  } catch (error) {
    logger.error('Error checking assignee leave:', error);
    res.status(500).json({ message: 'Failed to check leave status' });
  }
};

// Create task with auto-generated code
export const createTaskWithCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, title, description, priority, assigneeId, dueDate, estimatedHours, tags, taskCode, actionRequired, dependsOnTaskId, attachmentUrl } = req.body;

    if (!projectId || !title) {
      res.status(400).json({ message: 'Project ID and title are required' });
      return;
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Generate or use provided task code
    const finalCode = taskCode || await generateTaskCode(projectId);

    // Get the next sort order
    const maxOrder = await Task.max('sortOrder', { where: { projectId } }) as number || 0;

    const task = await Task.create({
      projectId,
      title,
      description,
      status: TaskStatus.TODO,
      priority: priority || TaskPriority.MEDIUM,
      assigneeId: assigneeId || null,
      dueDate,
      estimatedHours,
      tags: tags || [],
      attachmentUrl: attachmentUrl || null,
      taskCode: finalCode,
      actionRequired: actionRequired || false,
      actualHours: 0,
      dependsOnTaskId: dependsOnTaskId || null,
      sortOrder: maxOrder + 1,
      createdBy: req.user?.id,
    });

    // If assigned, create notification
    if (assigneeId) {
      await createNotification({
        userId: assigneeId,
        type: 'task',
        title: 'New Task Assigned',
        message: `You have been assigned to task: ${title}`,
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

    logger.info(`Task created with code: ${task.id} - ${task.title} (${finalCode})`);
    res.status(201).json(createdTask);
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
};
