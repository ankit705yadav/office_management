import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ChatParticipantAttributes {
  id: number;
  conversationId: number;
  userId: number;
  isAdmin: boolean;
  joinedAt?: Date;
  lastReadAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatParticipantCreationAttributes
  extends Optional<ChatParticipantAttributes, 'id' | 'isAdmin' | 'joinedAt' | 'lastReadAt'> {}

class ChatParticipant
  extends Model<ChatParticipantAttributes, ChatParticipantCreationAttributes>
  implements ChatParticipantAttributes
{
  public id!: number;
  public conversationId!: number;
  public userId!: number;
  public isAdmin!: boolean;
  public joinedAt?: Date;
  public lastReadAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatParticipant.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_admin',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      field: 'joined_at',
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_read_at',
    },
  },
  {
    sequelize,
    tableName: 'chat_participants',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['conversation_id', 'user_id'],
      },
    ],
  }
);

export default ChatParticipant;
