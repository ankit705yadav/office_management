import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { LeaveType, RequestStatus, HalfDaySession } from '../types/enums';
import type User from './User';

interface LeaveRequestAttributes {
  id: number;
  userId: number;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  daysCount: number;
  reason: string;
  status: RequestStatus;
  approverId?: number;
  approvedRejectedAt?: Date;
  comments?: string;
  isHalfDay?: boolean;
  halfDaySession?: HalfDaySession;
  documentUrl?: string;
  currentApprovalLevel?: number;
  totalApprovalLevels?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeaveRequestCreationAttributes extends Optional<LeaveRequestAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes> implements LeaveRequestAttributes {
  public id!: number;
  public userId!: number;
  public leaveType!: LeaveType;
  public startDate!: Date;
  public endDate!: Date;
  public daysCount!: number;
  public reason!: string;
  public status!: RequestStatus;
  public approverId?: number;
  public approvedRejectedAt?: Date;
  public comments?: string;
  public isHalfDay?: boolean;
  public halfDaySession?: HalfDaySession;
  public documentUrl?: string;
  public currentApprovalLevel?: number;
  public totalApprovalLevels?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
  public readonly approver?: User;
  public readonly approvals?: any[];
}

LeaveRequest.init(
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
    leaveType: {
      type: DataTypes.ENUM(...Object.values(LeaveType)),
      allowNull: false,
      field: 'leave_type',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date',
    },
    daysCount: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      field: 'days_count',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RequestStatus)),
      defaultValue: RequestStatus.PENDING,
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
    isHalfDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_half_day',
    },
    halfDaySession: {
      type: DataTypes.ENUM(...Object.values(HalfDaySession)),
      allowNull: true,
      field: 'half_day_session',
    },
    documentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'document_url',
    },
    currentApprovalLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'current_approval_level',
    },
    totalApprovalLevels: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'total_approval_levels',
    },
  },
  {
    sequelize,
    tableName: 'leave_requests',
    timestamps: true,
    underscored: true,
  }
);

export default LeaveRequest;
