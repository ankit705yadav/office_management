import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ProjectStatus, ProjectPriority } from '../types/enums';

export interface ProjectAttributes {
  id: number;
  name: string;
  description?: string;
  departmentId?: number;
  ownerId?: number;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  // Hierarchical support
  parentId?: number;
  projectCode?: string;
  isFolder: boolean;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'status' | 'priority' | 'isFolder'> {}

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public departmentId?: number;
  public ownerId?: number;
  public status!: ProjectStatus;
  public priority!: ProjectPriority;
  public startDate?: Date;
  public endDate?: Date;
  public budget?: number;
  // Hierarchical support
  public parentId?: number;
  public projectCode?: string;
  public isFolder!: boolean;
  public createdBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly department?: any;
  public readonly owner?: any;
  public readonly creator?: any;
  public readonly tasks?: any[];
  public readonly attachments?: any[];
  public readonly parent?: Project;
  public readonly children?: Project[];
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
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
    // Hierarchical support
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
    },
    projectCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'project_code',
    },
    isFolder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_folder',
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
