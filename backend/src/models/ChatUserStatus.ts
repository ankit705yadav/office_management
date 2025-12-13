import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { DevicePlatform } from '../types/enums';

interface ChatUserStatusAttributes {
  userId: number;
  isOnline: boolean;
  lastSeenAt?: Date;
  deviceToken?: string;
  platform?: DevicePlatform;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatUserStatusCreationAttributes
  extends Optional<ChatUserStatusAttributes, 'isOnline' | 'lastSeenAt' | 'deviceToken' | 'platform'> {}

class ChatUserStatus
  extends Model<ChatUserStatusAttributes, ChatUserStatusCreationAttributes>
  implements ChatUserStatusAttributes
{
  public userId!: number;
  public isOnline!: boolean;
  public lastSeenAt?: Date;
  public deviceToken?: string;
  public platform?: DevicePlatform;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatUserStatus.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'user_id',
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_online',
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      field: 'last_seen_at',
    },
    deviceToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'device_token',
    },
    platform: {
      type: DataTypes.ENUM(...Object.values(DevicePlatform)),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'chat_user_status',
    timestamps: true,
    underscored: true,
  }
);

export default ChatUserStatus;
