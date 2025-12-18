import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { PaymentStatus } from '../types/enums';

interface PaymentAttributes {
  id: number;
  userId: number;
  salaryId: number;
  paymentMonth: number;
  paymentYear: number;
  amount: number;
  status: PaymentStatus;
  paidAt?: Date;
  paidBy?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes {
  public id!: number;
  public userId!: number;
  public salaryId!: number;
  public paymentMonth!: number;
  public paymentYear!: number;
  public amount!: number;
  public status!: PaymentStatus;
  public paidAt?: Date;
  public paidBy?: number;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
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
    salaryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'salary_id',
    },
    paymentMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'payment_month',
    },
    paymentYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'payment_year',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      defaultValue: PaymentStatus.PENDING,
      allowNull: false,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at',
    },
    paidBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'paid_by',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    underscored: true,
  }
);

export default Payment;
