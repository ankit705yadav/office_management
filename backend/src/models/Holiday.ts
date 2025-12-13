import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface HolidayAttributes {
  id: number;
  date: Date;
  name: string;
  description?: string;
  isOptional: boolean;
  year: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HolidayCreationAttributes extends Optional<HolidayAttributes, 'id' | 'isOptional'> {}

class Holiday extends Model<HolidayAttributes, HolidayCreationAttributes> implements HolidayAttributes {
  public id!: number;
  public date!: Date;
  public name!: string;
  public description?: string;
  public isOptional!: boolean;
  public year!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Holiday.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isOptional: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_optional',
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'holidays',
    timestamps: true,
    underscored: true,
  }
);

export default Holiday;
