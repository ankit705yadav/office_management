import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DepartmentAttributes {
  id: number;
  name: string;
  description?: string;
  headId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'description' | 'headId'> {}

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public headId?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    headId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'head_id',
    },
  },
  {
    sequelize,
    tableName: 'departments',
    timestamps: true,
    underscored: true,
  }
);

export default Department;
