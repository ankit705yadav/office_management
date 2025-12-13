import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectAttachmentAttributes {
  id: number;
  projectId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  uploadedBy?: number;
  createdAt?: Date;
}

interface ProjectAttachmentCreationAttributes extends Optional<ProjectAttachmentAttributes, 'id'> {}

class ProjectAttachment extends Model<ProjectAttachmentAttributes, ProjectAttachmentCreationAttributes> implements ProjectAttachmentAttributes {
  public id!: number;
  public projectId!: number;
  public fileName!: string;
  public filePath!: string;
  public fileSize?: number;
  public fileType?: string;
  public uploadedBy?: number;
  public readonly createdAt!: Date;

  // Associations
  public readonly project?: any;
  public readonly uploader?: any;
}

ProjectAttachment.init(
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
    tableName: 'project_attachments',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

export default ProjectAttachment;
