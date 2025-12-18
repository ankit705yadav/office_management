import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmployeeSalaryAttributes {
  id: number;
  userId: number;
  basicSalary: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeeSalaryCreationAttributes extends Optional<EmployeeSalaryAttributes, 'id'> {}

class EmployeeSalary extends Model<EmployeeSalaryAttributes, EmployeeSalaryCreationAttributes>
  implements EmployeeSalaryAttributes {
  public id!: number;
  public userId!: number;
  public basicSalary!: number;
  public effectiveFrom!: Date;
  public effectiveTo?: Date;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeSalary.init(
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
    basicSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'basic_salary',
    },
    effectiveFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'effective_from',
    },
    effectiveTo: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'effective_to',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
    },
  },
  {
    sequelize,
    tableName: 'employee_salaries',
    timestamps: true,
    underscored: true,
  }
);

export default EmployeeSalary;
