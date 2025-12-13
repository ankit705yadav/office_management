import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmployeeSalaryDetailAttributes {
  id: number;
  userId: number;
  employeeCode?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfscCode?: string;
  bankBranch?: string;
  pfAccountNumber?: string;
  uanNumber?: string;
  esiNumber?: string;
  basicSalary: number;
  hraPercentage: number;
  transportAllowance: number;
  otherAllowances: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  professionalTax: number;
  taxRegime: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeeSalaryDetailCreationAttributes extends Optional<EmployeeSalaryDetailAttributes, 'id' | 'employeeCode' | 'panNumber' | 'bankAccountNumber' | 'bankName' | 'bankIfscCode' | 'bankBranch' | 'pfAccountNumber' | 'uanNumber' | 'esiNumber'> {}

class EmployeeSalaryDetail extends Model<EmployeeSalaryDetailAttributes, EmployeeSalaryDetailCreationAttributes> implements EmployeeSalaryDetailAttributes {
  public id!: number;
  public userId!: number;
  public employeeCode?: string;
  public panNumber?: string;
  public bankAccountNumber?: string;
  public bankName?: string;
  public bankIfscCode?: string;
  public bankBranch?: string;
  public pfAccountNumber?: string;
  public uanNumber?: string;
  public esiNumber?: string;
  public basicSalary!: number;
  public hraPercentage!: number;
  public transportAllowance!: number;
  public otherAllowances!: number;
  public pfApplicable!: boolean;
  public esiApplicable!: boolean;
  public professionalTax!: number;
  public taxRegime!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeSalaryDetail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'employee_code',
    },
    panNumber: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'pan_number',
    },
    bankAccountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'bank_account_number',
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'bank_name',
    },
    bankIfscCode: {
      type: DataTypes.STRING(11),
      allowNull: true,
      field: 'bank_ifsc_code',
    },
    bankBranch: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'bank_branch',
    },
    pfAccountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'pf_account_number',
    },
    uanNumber: {
      type: DataTypes.STRING(12),
      allowNull: true,
      field: 'uan_number',
    },
    esiNumber: {
      type: DataTypes.STRING(17),
      allowNull: true,
      field: 'esi_number',
    },
    basicSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'basic_salary',
    },
    hraPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 40.0,
      allowNull: false,
      field: 'hra_percentage',
    },
    transportAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 1600,
      allowNull: false,
      field: 'transport_allowance',
    },
    otherAllowances: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'other_allowances',
    },
    pfApplicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'pf_applicable',
    },
    esiApplicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'esi_applicable',
    },
    professionalTax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 200,
      allowNull: false,
      field: 'professional_tax',
    },
    taxRegime: {
      type: DataTypes.STRING(10),
      defaultValue: 'old',
      allowNull: false,
      field: 'tax_regime',
    },
  },
  {
    sequelize,
    tableName: 'employee_salary_details',
    timestamps: true,
    underscored: true,
  }
);

export default EmployeeSalaryDetail;
