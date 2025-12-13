import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ExpenseCategory, RequestStatus } from '../types/enums';

interface ExpenseAttributes {
  id: number;
  userId: number;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: Date;
  receiptUrl?: string;
  status: RequestStatus;
  approverId?: number;
  approvedRejectedAt?: Date;
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id' | 'status'> {}

class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  public id!: number;
  public userId!: number;
  public amount!: number;
  public category!: ExpenseCategory;
  public description!: string;
  public expenseDate!: Date;
  public receiptUrl?: string;
  public status!: RequestStatus;
  public approverId?: number;
  public approvedRejectedAt?: Date;
  public comments?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Expense.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(ExpenseCategory)),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'expense_date',
    },
    receiptUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'receipt_url',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RequestStatus)),
      defaultValue: RequestStatus.PENDING,
      allowNull: false,
    },
    approverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approver_id',
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
  },
  {
    sequelize,
    tableName: 'expenses',
    timestamps: true,
    underscored: true,
  }
);

export default Expense;
