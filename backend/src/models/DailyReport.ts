import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import type User from './User';

export enum DailyReportStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

interface DailyReportAttributes {
  id: number;
  userId: number;
  reportDate: Date;
  summary?: string;
  totalHours: number;
  status: DailyReportStatus;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DailyReportCreationAttributes extends Optional<DailyReportAttributes, 'id' | 'status' | 'totalHours' | 'createdAt' | 'updatedAt'> {}

class DailyReport extends Model<DailyReportAttributes, DailyReportCreationAttributes> implements DailyReportAttributes {
  public id!: number;
  public userId!: number;
  public reportDate!: Date;
  public summary?: string;
  public totalHours!: number;
  public status!: DailyReportStatus;
  public submittedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
  public readonly entries?: any[];
}

DailyReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    reportDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'report_date',
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalHours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_hours',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: DailyReportStatus.DRAFT,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at',
    },
  },
  {
    sequelize,
    tableName: 'daily_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'report_date'],
      },
    ],
  }
);

export default DailyReport;
