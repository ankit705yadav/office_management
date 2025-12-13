import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ExpenseCategory } from '../types/enums';

interface ExpenseCategoryCapAttributes {
  id: number;
  category: ExpenseCategory;
  capAmount: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExpenseCategoryCapCreationAttributes extends Optional<ExpenseCategoryCapAttributes, 'id' | 'isActive'> {}

class ExpenseCategoryCap extends Model<ExpenseCategoryCapAttributes, ExpenseCategoryCapCreationAttributes> implements ExpenseCategoryCapAttributes {
  public id!: number;
  public category!: ExpenseCategory;
  public capAmount!: number;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExpenseCategoryCap.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(ExpenseCategory)),
      allowNull: false,
      unique: true,
    },
    capAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'cap_amount',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'expense_category_caps',
    timestamps: true,
    underscored: true,
  }
);

export default ExpenseCategoryCap;
