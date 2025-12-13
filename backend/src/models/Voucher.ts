import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface VoucherAttributes {
  id: number;
  voucherNumber: string;
  name: string;
  amount: number;
  region: string;
  qrCodeData: string;
  description?: string;
  createdBy: number;
  expenseId?: number;
  isUsed: boolean;
  usedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VoucherCreationAttributes extends Optional<VoucherAttributes, 'id' | 'isUsed' | 'qrCodeData'> {}

class Voucher extends Model<VoucherAttributes, VoucherCreationAttributes> implements VoucherAttributes {
  public id!: number;
  public voucherNumber!: string;
  public name!: string;
  public amount!: number;
  public region!: string;
  public qrCodeData!: string;
  public description?: string;
  public createdBy!: number;
  public expenseId?: number;
  public isUsed!: boolean;
  public usedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Voucher.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    voucherNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'voucher_number',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    qrCodeData: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'qr_code_data',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
    },
    expenseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'expense_id',
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_used',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'used_at',
    },
  },
  {
    sequelize,
    tableName: 'vouchers',
    timestamps: true,
    underscored: true,
  }
);

export default Voucher;
