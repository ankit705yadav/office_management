import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TaskAttachmentAttributes {
  id: number;
  taskId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  uploadedBy?: number;
  createdAt?: Date;
}

interface TaskAttachmentCreationAttributes extends Optional<TaskAttachmentAttributes, 'id'> {}

class TaskAttachment extends Model<TaskAttachmentAttributes, TaskAttachmentCreationAttributes> implements TaskAttachmentAttributes {
  public id!: number;
  public taskId!: number;
  public fileName!: string;
  public filePath!: string;
  public fileSize?: number;
  public fileType?: string;
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
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
    },
    filePath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_path',
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_size',
    },
    fileType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'file_type',
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
