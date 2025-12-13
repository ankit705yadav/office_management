import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface InventoryMovementAttributes {
  id: number;
  productId: number;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceNumber?: string;
  images?: string[];
  // Vendor for stock in
  vendorId?: number;
  // Customer for stock out
  customerId?: number;
  // Sender details (for stock in - manual entry)
  senderName?: string;
  senderPhone?: string;
  senderCompany?: string;
  senderAddress?: string;
  // Receiver details (for stock out - manual entry)
  receiverName?: string;
  receiverPhone?: string;
  receiverCompany?: string;
  receiverAddress?: string;
  // Delivery person details
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  createdBy?: number;
  createdAt?: Date;
}

interface InventoryMovementCreationAttributes extends Optional<InventoryMovementAttributes, 'id'> {}

class InventoryMovement
  extends Model<InventoryMovementAttributes, InventoryMovementCreationAttributes>
  implements InventoryMovementAttributes
{
  public id!: number;
  public productId!: number;
  public movementType!: 'in' | 'out' | 'adjustment';
  public quantity!: number;
  public previousQuantity!: number;
  public newQuantity!: number;
  public reason?: string;
  public referenceNumber?: string;
  public images?: string[];
  // Vendor for stock in
  public vendorId?: number;
  // Customer for stock out
  public customerId?: number;
  // Sender details (for stock in - manual entry)
  public senderName?: string;
  public senderPhone?: string;
  public senderCompany?: string;
  public senderAddress?: string;
  // Receiver details (for stock out)
  public receiverName?: string;
  public receiverPhone?: string;
  public receiverCompany?: string;
  public receiverAddress?: string;
  // Delivery person details
  public deliveryPersonName?: string;
  public deliveryPersonPhone?: string;
  public createdBy?: number;
  public readonly createdAt!: Date;
}

InventoryMovement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
    },
    movementType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'movement_type',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previousQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'previous_quantity',
    },
    newQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'new_quantity',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'reference_number',
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    // Vendor for stock in
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'vendor_id',
    },
    // Customer for stock out
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'customer_id',
    },
    // Sender details (for stock in - manual entry)
    senderName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'sender_name',
    },
    senderPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'sender_phone',
    },
    senderCompany: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'sender_company',
    },
    senderAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'sender_address',
    },
    // Receiver details (for stock out)
    receiverName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'receiver_name',
    },
    receiverPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'receiver_phone',
    },
    receiverCompany: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'receiver_company',
    },
    receiverAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'receiver_address',
    },
    // Delivery person details
    deliveryPersonName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'delivery_person_name',
    },
    deliveryPersonPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'delivery_person_phone',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
  },
  {
    sequelize,
    tableName: 'inventory_movements',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

export default InventoryMovement;
