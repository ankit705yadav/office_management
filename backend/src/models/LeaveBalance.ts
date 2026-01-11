import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LeaveBalanceAttributes {
  id: number;
  userId: number;
  year: number;
  sickLeave: number;
  casualLeave: number;
  earnedLeave: number;
  compOff: number;
  paternityMaternity: number;
  birthdayLeave: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeaveBalanceCreationAttributes extends Optional<LeaveBalanceAttributes, 'id'> {}

class LeaveBalance extends Model<LeaveBalanceAttributes, LeaveBalanceCreationAttributes> implements LeaveBalanceAttributes {
  public id!: number;
  public userId!: number;
  public year!: number;
  public sickLeave!: number;
  public casualLeave!: number;
  public earnedLeave!: number;
  public compOff!: number;
  public paternityMaternity!: number;
  public birthdayLeave!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveBalance.init(
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
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sickLeave: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 12.0,
      field: 'sick_leave',
    },
    casualLeave: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 12.0,
      field: 'casual_leave',
    },
    earnedLeave: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 0.0,
      field: 'earned_leave',
    },
    compOff: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 0.0,
      field: 'comp_off',
    },
    paternityMaternity: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 0.0,
      field: 'paternity_maternity',
    },
    birthdayLeave: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 1.0,
      field: 'birthday_leave',
    },
  },
  {
    sequelize,
    tableName: 'leave_balances',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'year'],
      },
    ],
  }
);

export default LeaveBalance;
