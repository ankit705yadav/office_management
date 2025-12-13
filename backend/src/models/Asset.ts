import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AssetAttributes {
  id: number;
  assetTag: string;
  name: string;
  description?: string;
  category: string;
  images: string[];
  status: 'available' | 'assigned' | 'under_maintenance' | 'retired';
  notes?: string;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AssetCreationAttributes extends Optional<AssetAttributes, 'id' | 'description' | 'images' | 'status' | 'notes' | 'createdBy' | 'createdAt' | 'updatedAt'> {}

class Asset extends Model<AssetAttributes, AssetCreationAttributes> implements AssetAttributes {
  public id!: number;
  public assetTag!: string;
  public name!: string;
  public description?: string;
  public category!: string;
  public images!: string[];
  public status!: 'available' | 'assigned' | 'under_maintenance' | 'retired';
  public notes?: string;
  public createdBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public creator?: any;
  public assignments?: any[];
}

Asset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assetTag: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'asset_tag',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'available',
      validate: {
        isIn: [['available', 'assigned', 'under_maintenance', 'retired']],
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'assets',
    timestamps: true,
    underscored: true,
  }
);

export default Asset;
