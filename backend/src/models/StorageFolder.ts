import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StorageFolderAttributes {
  id: number;
  name: string;
  parentId?: number;
  ownerId: number;
  path: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StorageFolderCreationAttributes
  extends Optional<StorageFolderAttributes, 'id' | 'parentId'> {}

class StorageFolder
  extends Model<StorageFolderAttributes, StorageFolderCreationAttributes>
  implements StorageFolderAttributes
{
  public id!: number;
  public name!: string;
  public parentId?: number;
  public ownerId!: number;
  public path!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public owner?: any;
  public parent?: StorageFolder;
  public children?: StorageFolder[];
  public files?: any[];
}

StorageFolder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
      references: {
        model: 'storage_folders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'owner_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    path: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'storage_folders',
    underscored: true,
    timestamps: true,
  }
);

export default StorageFolder;
