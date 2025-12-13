import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmployeeCustomFieldAttributes {
  id: number;
  userId: number;
  fieldName: string;
  fieldValue: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeeCustomFieldCreationAttributes extends Optional<EmployeeCustomFieldAttributes, 'id'> {}

class EmployeeCustomField extends Model<EmployeeCustomFieldAttributes, EmployeeCustomFieldCreationAttributes> implements EmployeeCustomFieldAttributes {
  public id!: number;
  public userId!: number;
  public fieldName!: string;
  public fieldValue!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeCustomField.init(
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
    fieldName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'field_name',
    },
    fieldValue: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'field_value',
    },
  },
  {
    sequelize,
    tableName: 'employee_custom_fields',
    timestamps: true,
    underscored: true,
  }
);

export default EmployeeCustomField;
