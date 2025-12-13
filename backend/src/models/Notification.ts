import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface NotificationAttributes {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: number;
  relatedType?: string;
  isRead: boolean;
  createdAt?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead' | 'relatedId' | 'relatedType'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public userId!: number;
  public type!: string;
  public title!: string;
  public message!: string;
  public actionUrl?: string;
  public relatedId?: number;
  public relatedType?: string;
  public isRead!: boolean;

  public readonly createdAt!: Date;
}

Notification.init(
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    actionUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'action_url',
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_id',
    },
    relatedType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'related_type',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: false,
    underscored: true,
  }
);

export default Notification;
