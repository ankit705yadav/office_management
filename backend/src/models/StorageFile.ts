import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StorageFileAttributes {
  id: number;
  name: string;
  folderId?: number;
  ownerId: number;
  s3Key: string;
  s3Url?: string;
  fileSize: number;
  fileType?: string;
  mimeType?: string;
  isPublic: boolean;
  publicToken?: string;
  publicExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StorageFileCreationAttributes
  extends Optional<
    StorageFileAttributes,
    'id' | 'folderId' | 's3Url' | 'fileType' | 'mimeType' | 'isPublic' | 'publicToken' | 'publicExpiresAt'
  > {}

class StorageFile
  extends Model<StorageFileAttributes, StorageFileCreationAttributes>
  implements StorageFileAttributes
{
  public id!: number;
  public name!: string;
  public folderId?: number;
  public ownerId!: number;
  public s3Key!: string;
  public s3Url?: string;
  public fileSize!: number;
  public fileType?: string;
  public mimeType?: string;
  public isPublic!: boolean;
  public publicToken?: string;
  public publicExpiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public owner?: any;
  public folder?: any;
}

StorageFile.init(
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
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'owner_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    s3Key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
      field: 's3_key',
    },
    s3Url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 's3_url',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'file_size',
    },
    fileType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'file_type',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mime_type',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_public',
    },
    publicToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      field: 'public_token',
    },
    publicExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'public_expires_at',
    },
  },
  {
    sequelize,
    tableName: 'storage_files',
    underscored: true,
    timestamps: true,
  }
);

export default StorageFile;
