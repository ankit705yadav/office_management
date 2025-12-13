import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import type User from './User';
import type LeaveRequest from './LeaveRequest';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

interface LeaveApprovalAttributes {
  id: number;
  leaveRequestId: number;
  approverId: number;
  approvalOrder: number;
  status: ApprovalStatus;
  comments?: string;
  actedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeaveApprovalCreationAttributes extends Optional<LeaveApprovalAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class LeaveApproval extends Model<LeaveApprovalAttributes, LeaveApprovalCreationAttributes> implements LeaveApprovalAttributes {
  public id!: number;
  public leaveRequestId!: number;
  public approverId!: number;
  public approvalOrder!: number;
  public status!: ApprovalStatus;
  public comments?: string;
  public actedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly leaveRequest?: LeaveRequest;
  public readonly approver?: User;
}

LeaveApproval.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    leaveRequestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'leave_request_id',
      references: {
        model: 'leave_requests',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    approverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'approver_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvalOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'approval_order',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ApprovalStatus)),
      defaultValue: ApprovalStatus.PENDING,
      allowNull: false,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'acted_at',
    },
  },
  {
    sequelize,
    tableName: 'leave_approvals',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['leave_request_id', 'approver_id'],
      },
    ],
  }
);

export default LeaveApproval;
