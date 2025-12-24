import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TaskDependencyAttributes {
  id: number;
  taskId: number;
  dependsOnTaskId: number;
  createdBy?: number;
  createdAt?: Date;
}

interface TaskDependencyCreationAttributes extends Optional<TaskDependencyAttributes, 'id'> {}

class TaskDependency extends Model<TaskDependencyAttributes, TaskDependencyCreationAttributes> implements TaskDependencyAttributes {
  public id!: number;
  public taskId!: number;
  public dependsOnTaskId!: number;
  public createdBy?: number;
  public readonly createdAt!: Date;

  // Associations
  public readonly task?: any;
  public readonly dependsOnTask?: any;
  public readonly creator?: any;
}

TaskDependency.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'task_id',
    },
    dependsOnTaskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'depends_on_task_id',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
  },
  {
    sequelize,
    tableName: 'task_dependencies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
  }
);

export default TaskDependency;
