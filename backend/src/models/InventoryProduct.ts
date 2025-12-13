import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface InventoryProductAttributes {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  qrCode?: string;
  barcode?: string;
  barcodeType?: string;
  isManualEntry: boolean;
  images?: string[];
  isActive: boolean;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InventoryProductCreationAttributes
  extends Optional<InventoryProductAttributes, 'id' | 'quantity' | 'unit' | 'isActive' | 'isManualEntry'> {}

class InventoryProduct
  extends Model<InventoryProductAttributes, InventoryProductCreationAttributes>
  implements InventoryProductAttributes
{
  public id!: number;
  public sku!: string;
  public name!: string;
  public description?: string;
  public category?: string;
  public brand?: string;
  public quantity!: number;
  public unit!: string;
  public unitPrice?: number;
  public qrCode?: string;
  public barcode?: string;
  public barcodeType?: string;
  public isManualEntry!: boolean;
  public images?: string[];
  public isActive!: boolean;
  public createdBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InventoryProduct.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
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
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pcs',
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'unit_price',
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'qr_code',
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    barcodeType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'CODE128',
      field: 'barcode_type',
    },
    isManualEntry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_manual_entry',
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
  },
  {
    sequelize,
    tableName: 'inventory_products',
    underscored: true,
    timestamps: true,
  }
);

export default InventoryProduct;
