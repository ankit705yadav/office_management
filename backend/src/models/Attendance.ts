import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { AttendanceStatus } from '../types/enums';
import User from './User';

export interface AttendanceAttributes {
  id: number;
  userId: number;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInLocation?: string;
  checkOutLocation?: string;
  status: AttendanceStatus;
  workHours: number;
  isLate: boolean;
  isEarlyDeparture: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceCreationAttributes
  extends Optional<AttendanceAttributes, 'id' | 'checkInTime' | 'checkOutTime' | 'checkInLocation' | 'checkOutLocation' | 'workHours' | 'isLate' | 'isEarlyDeparture' | 'notes' | 'createdAt' | 'updatedAt'> {}

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes {
  public id!: number;
  public userId!: number;
  public date!: Date;
  public checkInTime?: Date;
  public checkOutTime?: Date;
  public checkInLocation?: string;
  public checkOutLocation?: string;
  public status!: AttendanceStatus;
  public workHours!: number;
  public isLate!: boolean;
  public isEarlyDeparture!: boolean;
  public notes?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly user?: User;
}

Attendance.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'check_in_time',
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'check_out_time',
    },
    checkInLocation: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'check_in_location',
    },
    checkOutLocation: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'check_out_location',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AttendanceStatus)),
      allowNull: false,
      defaultValue: AttendanceStatus.ABSENT,
    },
    workHours: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 0.0,
      allowNull: false,
      field: 'work_hours',
    },
    isLate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_late',
    },
    isEarlyDeparture: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_early_departure',
    },
    notes: {
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
    tableName: 'attendance',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'date'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['date'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

// Define associations
Attendance.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default Attendance;
