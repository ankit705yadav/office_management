import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PayrollAttributes {
  id: number;
  userId: number;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  payslipUrl?: string;
  processedBy?: number;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PayrollCreationAttributes extends Optional<PayrollAttributes, 'id' | 'payslipUrl' | 'processedBy' | 'processedAt'> {}

class Payroll extends Model<PayrollAttributes, PayrollCreationAttributes> implements PayrollAttributes {
  public id!: number;
  public userId!: number;
  public month!: number;
  public year!: number;
  public basicSalary!: number;
  public hra!: number;
  public transportAllowance!: number;
  public otherAllowances!: number;
  public grossSalary!: number;
  public pfDeduction!: number;
  public esiDeduction!: number;
  public taxDeduction!: number;
  public otherDeductions!: number;
  public totalDeductions!: number;
  public netSalary!: number;
  public payslipUrl?: string;
  public processedBy?: number;
  public processedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payroll.init(
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
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12,
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    basicSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'basic_salary',
    },
    hra: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
    },
    transportAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'transport_allowance',
    },
    otherAllowances: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'other_allowances',
    },
    grossSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'gross_salary',
    },
    pfDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'pf_deduction',
    },
    esiDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'esi_deduction',
    },
    taxDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'tax_deduction',
    },
    otherDeductions: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'other_deductions',
    },
    totalDeductions: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_deductions',
    },
    netSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'net_salary',
    },
    payslipUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'payslip_url',
    },
    processedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'processed_by',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at',
    },
  },
  {
    sequelize,
    tableName: 'payroll',
    timestamps: true,
    underscored: true,
  }
);

export default Payroll;
