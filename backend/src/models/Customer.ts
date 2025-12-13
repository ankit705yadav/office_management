import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CustomerAttributes {
  id: number;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfscCode?: string;
  contactPerson?: string;
  contactPersonPhone?: string;
  category?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'isActive'> {}

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public name!: string;
  public companyName?: string;
  public email?: string;
  public phone?: string;
  public address?: string;
  public city?: string;
  public state?: string;
  public pincode?: string;
  public gstNumber?: string;
  public panNumber?: string;
  public bankAccountNumber?: string;
  public bankName?: string;
  public bankIfscCode?: string;
  public contactPerson?: string;
  public contactPersonPhone?: string;
  public category?: string;
  public notes?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Customer.init(
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
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'company_name',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    gstNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'gst_number',
    },
    panNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'pan_number',
    },
    bankAccountNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'bank_account_number',
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'bank_name',
    },
    bankIfscCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'bank_ifsc_code',
    },
    contactPerson: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'contact_person',
    },
    contactPersonPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'contact_person_phone',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'customers',
    underscored: true,
    timestamps: true,
  }
);

export default Customer;
