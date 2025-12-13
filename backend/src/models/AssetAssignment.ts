import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AssetAssignmentAttributes {
  id: number;
  assetId: number;
  assignedTo: number;
  assignedBy: number;
  purpose?: string;
  assignedDate: Date;
  dueDate?: Date;
  returnedDate?: Date;
  status: 'assigned' | 'overdue' | 'returned' | 'lost' | 'damaged';
  returnCondition?: 'good' | 'damaged' | 'lost';
  conditionNotes?: string;
  reminderSentBefore: boolean;
  reminderSentDue: boolean;
  lastOverdueReminder?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AssetAssignmentCreationAttributes extends Optional<AssetAssignmentAttributes, 'id' | 'purpose' | 'dueDate' | 'returnedDate' | 'status' | 'returnCondition' | 'conditionNotes' | 'reminderSentBefore' | 'reminderSentDue' | 'lastOverdueReminder' | 'createdAt' | 'updatedAt'> {}

class AssetAssignment extends Model<AssetAssignmentAttributes, AssetAssignmentCreationAttributes> implements AssetAssignmentAttributes {
  public id!: number;
  public assetId!: number;
  public assignedTo!: number;
  public assignedBy!: number;
  public purpose?: string;
  public assignedDate!: Date;
  public dueDate?: Date;
  public returnedDate?: Date;
  public status!: 'assigned' | 'overdue' | 'returned' | 'lost' | 'damaged';
  public returnCondition?: 'good' | 'damaged' | 'lost';
  public conditionNotes?: string;
  public reminderSentBefore!: boolean;
  public reminderSentDue!: boolean;
  public lastOverdueReminder?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public asset?: any;
  public assignee?: any;
  public assigner?: any;
}

AssetAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'asset_id',
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'assigned_to',
    },
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'assigned_by',
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assignedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'assigned_date',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date',
    },
    returnedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'returned_date',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'assigned',
      validate: {
        isIn: [['assigned', 'overdue', 'returned', 'lost', 'damaged']],
      },
    },
    returnCondition: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'return_condition',
      validate: {
        isIn: [['good', 'damaged', 'lost']],
      },
    },
    conditionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'condition_notes',
    },
    reminderSentBefore: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'reminder_sent_before',
    },
    reminderSentDue: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'reminder_sent_due',
    },
    lastOverdueReminder: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_overdue_reminder',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'asset_assignments',
    timestamps: true,
    underscored: true,
  }
);

export default AssetAssignment;
