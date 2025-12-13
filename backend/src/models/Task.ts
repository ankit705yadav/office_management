import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { TaskStatus, TaskPriority } from '../types/enums';

export interface TaskAttributes {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: number;
  dueDate?: Date;
  estimatedHours?: number;
  tags?: string[];
  // New fields
  taskCode?: string;
  actionRequired: boolean;
  actualHours: number;
  dependsOnTaskId?: number;
  sortOrder: number;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'status' | 'priority' | 'actionRequired' | 'actualHours' | 'sortOrder'> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public projectId!: number;
  public title!: string;
  public description?: string;
  public status!: TaskStatus;
  public priority!: TaskPriority;
  public assigneeId?: number;
  public dueDate?: Date;
  public estimatedHours?: number;
  public tags?: string[];
  // New fields
  public taskCode?: string;
  public actionRequired!: boolean;
  public actualHours!: number;
  public dependsOnTaskId?: number;
  public sortOrder!: number;
  public createdBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly project?: any;
  public readonly assignee?: any;
  public readonly creator?: any;
  public readonly attachments?: any[];
  public readonly dependsOn?: Task;
  public readonly dependentTasks?: Task[];
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id',
    },
    title: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: TaskStatus.TODO,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: TaskPriority.MEDIUM,
      allowNull: false,
    },
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assignee_id',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date',
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      field: 'estimated_hours',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: [],
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
    // New fields
    taskCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'task_code',
    },
    actionRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'action_required',
    },
    actualHours: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0,
      field: 'actual_hours',
    },
    dependsOnTaskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'depends_on_task_id',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order',
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
  }
);

export default Task;
