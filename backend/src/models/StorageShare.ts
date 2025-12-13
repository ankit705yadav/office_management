import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StorageShareAttributes {
  id: number;
  fileId?: number;
  folderId?: number;
  sharedWith: number;
  sharedBy: number;
  permission: 'view' | 'edit';
  createdAt?: Date;
}

interface StorageShareCreationAttributes
  extends Optional<StorageShareAttributes, 'id' | 'fileId' | 'folderId' | 'permission'> {}

class StorageShare
  extends Model<StorageShareAttributes, StorageShareCreationAttributes>
  implements StorageShareAttributes
{
  public id!: number;
  public fileId?: number;
  public folderId?: number;
  public sharedWith!: number;
  public sharedBy!: number;
  public permission!: 'view' | 'edit';
  public readonly createdAt!: Date;

  // Associations
  public file?: any;
  public folder?: any;
  public sharedWithUser?: any;
  public sharedByUser?: any;
}

StorageShare.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fileId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_id',
      references: {
        model: 'storage_files',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    folderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'folder_id',
      references: {
        model: 'storage_folders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sharedWith: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'shared_with',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    sharedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'shared_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    permission: {
      type: DataTypes.ENUM('view', 'edit'),
      allowNull: false,
      defaultValue: 'view',
    },
  },
  {
    sequelize,
    tableName: 'storage_shares',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

export default StorageShare;
