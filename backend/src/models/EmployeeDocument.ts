import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmployeeDocumentAttributes {
  id: number;
  userId: number;
  documentName: string;
  documentUrl: string;
  documentType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeeDocumentCreationAttributes extends Optional<EmployeeDocumentAttributes, 'id'> {}

class EmployeeDocument extends Model<EmployeeDocumentAttributes, EmployeeDocumentCreationAttributes> implements EmployeeDocumentAttributes {
  public id!: number;
  public userId!: number;
  public documentName!: string;
  public documentUrl!: string;
  public documentType?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    documentName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'document_name',
    },
    documentUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'document_url',
    },
    documentType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'document_type',
    },
  },
  {
    sequelize,
    tableName: 'employee_documents',
    timestamps: true,
    underscored: true,
  }
);

export default EmployeeDocument;
