import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmployeeDocumentAttributes {
  id: number;
  userId: number;
  linkTitle: string;
  linkUrl: string;
  createdAt?: Date;
}

interface EmployeeDocumentCreationAttributes extends Optional<EmployeeDocumentAttributes, 'id'> {}

class EmployeeDocument extends Model<EmployeeDocumentAttributes, EmployeeDocumentCreationAttributes> implements EmployeeDocumentAttributes {
  public id!: number;
  public userId!: number;
  public linkTitle!: string;
  public linkUrl!: string;

  public readonly createdAt!: Date;
}

EmployeeDocument.init(
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
    linkTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'link_title',
    },
    linkUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'link_url',
    },
  },
  {
    sequelize,
    tableName: 'employee_documents',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default EmployeeDocument;
