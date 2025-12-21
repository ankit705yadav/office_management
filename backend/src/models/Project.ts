import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ProjectStatus, ProjectPriority } from '../types/enums';

export interface ProjectAttributes {
  id: number;
  name: string;
  description?: string;
  departmentId?: number;
  ownerId?: number;
  clientId?: number;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  attachmentUrl?: string;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'status' | 'priority'> {}

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public departmentId?: number;
  public ownerId?: number;
  public clientId?: number;
  public status!: ProjectStatus;
  public priority!: ProjectPriority;
  public startDate?: Date;
  public endDate?: Date;
  public budget?: number;
  public attachmentUrl?: string;
  public createdBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly department?: any;
  public readonly owner?: any;
  public readonly creator?: any;
  public readonly client?: any;
  public readonly tasks?: any[];
  public readonly attachments?: any[];
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id',
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'owner_id',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: ProjectStatus.ACTIVE,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: ProjectPriority.MEDIUM,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date',
    },
    budget: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'client_id',
    },
    attachmentUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'attachment_url',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    underscored: true,
  }
);

export default Project;
