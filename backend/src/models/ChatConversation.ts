import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ConversationType } from '../types/enums';

interface ChatConversationAttributes {
  id: number;
  name?: string;
  type: ConversationType;
  avatarUrl?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatConversationCreationAttributes
  extends Optional<ChatConversationAttributes, 'id' | 'name' | 'avatarUrl'> {}

class ChatConversation
  extends Model<ChatConversationAttributes, ChatConversationCreationAttributes>
  implements ChatConversationAttributes
{
  public id!: number;
  public name?: string;
  public type!: ConversationType;
  public avatarUrl?: string;
  public createdBy!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatConversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ConversationType)),
      defaultValue: ConversationType.DIRECT,
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
    },
  },
  {
    sequelize,
    tableName: 'chat_conversations',
    timestamps: true,
    underscored: true,
  }
);

export default ChatConversation;
