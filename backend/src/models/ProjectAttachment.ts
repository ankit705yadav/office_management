import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectAttachmentAttributes {
  id: number;
  projectId: number;
  linkTitle: string;
  linkUrl: string;
  uploadedBy?: number;
  createdAt?: Date;
}

interface ProjectAttachmentCreationAttributes extends Optional<ProjectAttachmentAttributes, 'id'> {}

class ProjectAttachment extends Model<ProjectAttachmentAttributes, ProjectAttachmentCreationAttributes> implements ProjectAttachmentAttributes {
  public id!: number;
  public projectId!: number;
  public linkTitle!: string;
  public linkUrl!: string;
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
    tableName: 'project_attachments',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

export default ProjectAttachment;
