import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AssetRequestAttributes {
  id: number;
  assetId: number;
  requestedBy: number;
  purpose: string;
  requestedDueDate?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: number;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AssetRequestCreationAttributes extends Optional<AssetRequestAttributes, 'id' | 'requestedDueDate' | 'status' | 'reviewedBy' | 'reviewedAt' | 'reviewNotes' | 'createdAt' | 'updatedAt'> {}

class AssetRequest extends Model<AssetRequestAttributes, AssetRequestCreationAttributes> implements AssetRequestAttributes {
  public id!: number;
  public assetId!: number;
  public requestedBy!: number;
  public purpose!: string;
  public requestedDueDate?: Date;
  public status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
  public reviewedBy?: number;
  public reviewedAt?: Date;
  public reviewNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public asset?: any;
  public requester?: any;
  public reviewer?: any;
}

AssetRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'asset_id',
      references: {
        model: 'assets',
        key: 'id',
      },
    },
    requestedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'requested_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requestedDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'requested_due_date',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'rejected', 'cancelled']],
      },
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewed_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_notes',
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
    tableName: 'asset_requests',
    timestamps: true,
    underscored: true,
  }
);

export default AssetRequest;
