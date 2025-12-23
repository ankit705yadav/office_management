import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TaskAttachmentAttributes {
  id: number;
  taskId: number;
  linkTitle: string;
  linkUrl: string;
  uploadedBy?: number;
  createdAt?: Date;
}

interface TaskAttachmentCreationAttributes extends Optional<TaskAttachmentAttributes, 'id'> {}

class TaskAttachment extends Model<TaskAttachmentAttributes, TaskAttachmentCreationAttributes> implements TaskAttachmentAttributes {
  public id!: number;
  public taskId!: number;
  public linkTitle!: string;
  public linkUrl!: string;
  public uploadedBy?: number;
  public readonly createdAt!: Date;

  // Associations
  public readonly task?: any;
  public readonly uploader?: any;
}

TaskAttachment.init(
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
    linkTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'link_title',
    },
    linkUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'link_url',
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'uploaded_by',
    },
  },
  {
    sequelize,
    tableName: 'task_attachments',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

export default TaskAttachment;
