import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Department from './Department';

export interface AttendanceSettingAttributes {
  id: number;
  departmentId?: number;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  halfDayHours: number;
  fullDayHours: number;
  workingDays: number[];
  autoCheckoutEnabled: boolean;
  autoCheckoutTime: string;
  locationTrackingEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceSettingCreationAttributes
  extends Optional<
    AttendanceSettingAttributes,
    | 'id'
    | 'departmentId'
    | 'workStartTime'
    | 'workEndTime'
    | 'gracePeriodMinutes'
    | 'halfDayHours'
    | 'fullDayHours'
    | 'workingDays'
    | 'autoCheckoutEnabled'
    | 'autoCheckoutTime'
    | 'locationTrackingEnabled'
    | 'createdAt'
    | 'updatedAt'
  > {}

class AttendanceSetting
  extends Model<AttendanceSettingAttributes, AttendanceSettingCreationAttributes>
  implements AttendanceSettingAttributes {
  public id!: number;
  public departmentId?: number;
  public workStartTime!: string;
  public workEndTime!: string;
  public gracePeriodMinutes!: number;
  public halfDayHours!: number;
  public fullDayHours!: number;
  public workingDays!: number[];
  public autoCheckoutEnabled!: boolean;
  public autoCheckoutTime!: string;
  public locationTrackingEnabled!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly department?: Department;
}

AttendanceSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id',
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    workStartTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '09:00:00',
      field: 'work_start_time',
    },
    workEndTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '18:00:00',
      field: 'work_end_time',
    },
    gracePeriodMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: 'grace_period_minutes',
    },
    halfDayHours: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      defaultValue: 4.0,
      field: 'half_day_hours',
    },
    fullDayHours: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      defaultValue: 8.0,
      field: 'full_day_hours',
    },
    workingDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [1, 2, 3, 4, 5], // Monday to Friday
      field: 'working_days',
    },
    autoCheckoutEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'auto_checkout_enabled',
    },
    autoCheckoutTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '18:00:00',
      field: 'auto_checkout_time',
    },
    locationTrackingEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'location_tracking_enabled',
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
    tableName: 'attendance_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['department_id'],
        name: 'attendance_settings_department_id_unique',
      },
    ],
  }
);

// Define associations
AttendanceSetting.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'department',
});

export default AttendanceSetting;
