import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum AdvanceSalaryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  CANCELLED = 'cancelled',
}

interface AdvanceSalaryRequestAttributes {
  id: number;
  userId: number;
  amount: number;
  reason: string;
  requestedForMonth: number;
  requestedForYear: number;
  status: AdvanceSalaryStatus;
  approverId?: number;
  approvedRejectedAt?: Date;
  comments?: string;
  disbursedBy?: number;
  disbursedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdvanceSalaryRequestCreationAttributes
  extends Optional<AdvanceSalaryRequestAttributes, 'id' | 'status'> {}

class AdvanceSalaryRequest
  extends Model<AdvanceSalaryRequestAttributes, AdvanceSalaryRequestCreationAttributes>
  implements AdvanceSalaryRequestAttributes
{
  public id!: number;
  public userId!: number;
  public amount!: number;
  public reason!: string;
  public requestedForMonth!: number;
  public requestedForYear!: number;
  public status!: AdvanceSalaryStatus;
  public approverId?: number;
  public approvedRejectedAt?: Date;
  public comments?: string;
  public disbursedBy?: number;
  public disbursedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdvanceSalaryRequest.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requestedForMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'requested_for_month',
      validate: {
        min: 1,
        max: 12,
      },
    },
    requestedForYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'requested_for_year',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AdvanceSalaryStatus)),
      defaultValue: AdvanceSalaryStatus.PENDING,
      allowNull: false,
    },
    approverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approver_id',
    },
    approvedRejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_rejected_at',
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    disbursedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'disbursed_by',
    },
    disbursedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'disbursed_at',
    },
  },
  {
    sequelize,
    tableName: 'advance_salary_requests',
    timestamps: true,
    underscored: true,
  }
);

export default AdvanceSalaryRequest;
