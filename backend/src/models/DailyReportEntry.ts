import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import type DailyReport from './DailyReport';
import type Project from './Project';
import type Task from './Task';

interface DailyReportEntryAttributes {
  id: number;
  dailyReportId: number;
  projectId?: number;
  taskId?: number;
  description: string;
  hours: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DailyReportEntryCreationAttributes extends Optional<DailyReportEntryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class DailyReportEntry extends Model<DailyReportEntryAttributes, DailyReportEntryCreationAttributes> implements DailyReportEntryAttributes {
  public id!: number;
  public dailyReportId!: number;
  public projectId?: number;
  public taskId?: number;
  public description!: string;
  public hours!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly dailyReport?: DailyReport;
  public readonly project?: Project;
  public readonly task?: Task;
}

DailyReportEntry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dailyReportId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'daily_report_id',
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'project_id',
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'task_id',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    hours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'daily_report_entries',
    timestamps: true,
    underscored: true,
  }
);

export default DailyReportEntry;
