import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { RegularizationStatus } from '../types/enums';
import User from './User';
import Attendance from './Attendance';

export interface AttendanceRegularizationAttributes {
  id: number;
  userId: number;
  attendanceId?: number;
  date: Date;
  requestedCheckIn?: Date;
  requestedCheckOut?: Date;
  requestedLocation?: string;
  reason: string;
  status: RegularizationStatus;
  approverId?: number;
  approvedRejectedAt?: Date;
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceRegularizationCreationAttributes
  extends Optional<
    AttendanceRegularizationAttributes,
    | 'id'
    | 'attendanceId'
    | 'requestedCheckIn'
    | 'requestedCheckOut'
    | 'requestedLocation'
    | 'approverId'
    | 'approvedRejectedAt'
    | 'comments'
    | 'createdAt'
    | 'updatedAt'
  > {}

class AttendanceRegularization
  extends Model<AttendanceRegularizationAttributes, AttendanceRegularizationCreationAttributes>
  implements AttendanceRegularizationAttributes {
  public id!: number;
  public userId!: number;
  public attendanceId?: number;
  public date!: Date;
  public requestedCheckIn?: Date;
  public requestedCheckOut?: Date;
  public requestedLocation?: string;
  public reason!: string;
  public status!: RegularizationStatus;
  public approverId?: number;
  public approvedRejectedAt?: Date;
  public comments?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly user?: User;
  public readonly approver?: User;
  public readonly attendance?: Attendance;
}

AttendanceRegularization.init(
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
      references: {
        model: 'users',
        key: 'id',
      },
    },
    attendanceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'attendance_id',
      references: {
        model: 'attendance',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    requestedCheckIn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'requested_check_in',
    },
    requestedCheckOut: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'requested_check_out',
    },
    requestedLocation: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'requested_location',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RegularizationStatus)),
      allowNull: false,
      defaultValue: RegularizationStatus.PENDING,
    },
    approverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approver_id',
      references: {
        model: 'users',
        key: 'id',
      },
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
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'attendance_regularizations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['approver_id'],
      },
      {
        fields: ['date'],
      },
    ],
  }
);

// Define associations
AttendanceRegularization.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

AttendanceRegularization.belongsTo(User, {
  foreignKey: 'approverId',
  as: 'approver',
});

AttendanceRegularization.belongsTo(Attendance, {
  foreignKey: 'attendanceId',
  as: 'attendance',
});

export default AttendanceRegularization;
