import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

interface ClientAttributes {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  emails?: string[];
  phones?: string[];
  address?: string;
  website?: string;
  contactPerson?: string;
  notes?: string;
  status: ClientStatus;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'status'> {}

class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  public id!: number;
  public name!: string;
  public email?: string;
  public phone?: string;
  public address?: string;
  public website?: string;
  public contactPerson?: string;
  public notes?: string;
  public status!: ClientStatus;
  public createdBy?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Client.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contactPerson: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'contact_person',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ClientStatus)),
      defaultValue: ClientStatus.ACTIVE,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
  },
  {
    sequelize,
    tableName: 'clients',
    timestamps: true,
    underscored: true,
  }
);

export default Client;
