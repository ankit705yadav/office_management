import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ChatAttachmentAttributes {
  id: number;
  messageId: number;
  fileId?: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  s3Key: string;
  thumbnailKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatAttachmentCreationAttributes
  extends Optional<ChatAttachmentAttributes, 'id' | 'fileId' | 'thumbnailKey'> {}

class ChatAttachment
  extends Model<ChatAttachmentAttributes, ChatAttachmentCreationAttributes>
  implements ChatAttachmentAttributes
{
  public id!: number;
  public messageId!: number;
  public fileId?: number;
  public fileName!: string;
  public fileSize!: number;
  public fileType!: string;
  public mimeType!: string;
  public s3Key!: string;
  public thumbnailKey?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatAttachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'message_id',
    },
    fileId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_id',
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'file_size',
    },
    fileType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'file_type',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type',
    },
    s3Key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 's3_key',
    },
    thumbnailKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'thumbnail_key',
    },
  },
  {
    sequelize,
    tableName: 'chat_attachments',
    timestamps: true,
    underscored: true,
  }
);

export default ChatAttachment;
