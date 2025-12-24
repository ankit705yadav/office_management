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
  title: string;
  description?: string;
  status: DailyReportStatus;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DailyReportCreationAttributes extends Optional<DailyReportAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class DailyReport extends Model<DailyReportAttributes, DailyReportCreationAttributes> implements DailyReportAttributes {
  public id!: number;
  public userId!: number;
  public reportDate!: Date;
  public title!: string;
  public description?: string;
  public status!: DailyReportStatus;
  public submittedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
