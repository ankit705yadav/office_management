import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { MessageType } from '../types/enums';

interface ChatMessageAttributes {
  id: number;
  conversationId: number;
  senderId: number;
  content?: string;
  messageType: MessageType;
  replyToId?: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatMessageCreationAttributes
  extends Optional<ChatMessageAttributes, 'id' | 'content' | 'replyToId' | 'isEdited' | 'isDeleted'> {}

class ChatMessage
  extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>
  implements ChatMessageAttributes
{
  public id!: number;
  public conversationId!: number;
  public senderId!: number;
  public content?: string;
  public messageType!: MessageType;
  public replyToId?: number;
  public isEdited!: boolean;
  public isDeleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'conversation_id',
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sender_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    messageType: {
      type: DataTypes.ENUM(...Object.values(MessageType)),
      defaultValue: MessageType.TEXT,
      allowNull: false,
      field: 'message_type',
    },
    replyToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reply_to_id',
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_edited',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_deleted',
    },
  },
  {
    sequelize,
    tableName: 'chat_messages',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['conversation_id', 'created_at'],
      },
    ],
  }
);

export default ChatMessage;
