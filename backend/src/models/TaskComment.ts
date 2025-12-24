import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TaskCommentAttributes {
  id: number;
  taskId: number;
  userId: number;
  parentId?: number;
  content: string;
  mentions: number[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCommentCreationAttributes extends Optional<TaskCommentAttributes, 'id' | 'mentions' | 'isEdited'> {}

class TaskComment extends Model<TaskCommentAttributes, TaskCommentCreationAttributes> implements TaskCommentAttributes {
  public id!: number;
  public taskId!: number;
  public userId!: number;
  public parentId?: number;
  public content!: string;
  public mentions!: number[];
  public isEdited!: boolean;
  public editedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly task?: any;
  public readonly author?: any;
  public readonly parent?: TaskComment;
  public readonly replies?: TaskComment[];
}

TaskComment.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mentions: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_edited',
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edited_at',
    },
  },
  {
    sequelize,
    tableName: 'task_comments',
    timestamps: true,
    underscored: true,
  }
);

export default TaskComment;
