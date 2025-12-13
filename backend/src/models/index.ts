// Import all models
import User from './User';
import Department from './Department';
import LeaveBalance from './LeaveBalance';
import LeaveRequest from './LeaveRequest';
import LeaveApproval from './LeaveApproval';
import Holiday from './Holiday';
import Expense from './Expense';
import Project from './Project';
import Task from './Task';
import Notification from './Notification';
import Payroll from './Payroll';
import EmployeeSalaryDetail from './EmployeeSalaryDetail';
import Voucher from './Voucher';
import AdvanceSalaryRequest from './AdvanceSalaryRequest';
import EmployeeCustomField from './EmployeeCustomField';
import EmployeeDocument from './EmployeeDocument';
import ExpenseCategoryCap from './ExpenseCategoryCap';
import Vendor from './Vendor';
import Customer from './Customer';
import InventoryProduct from './InventoryProduct';
import InventoryMovement from './InventoryMovement';
import Asset from './Asset';
import AssetAssignment from './AssetAssignment';
import AssetRequest from './AssetRequest';
import TaskAttachment from './TaskAttachment';
import ProjectAttachment from './ProjectAttachment';
import StorageFolder from './StorageFolder';
import StorageFile from './StorageFile';
import StorageShare from './StorageShare';

// Chat models
import ChatConversation from './ChatConversation';
import ChatParticipant from './ChatParticipant';
import ChatMessage from './ChatMessage';
import ChatAttachment from './ChatAttachment';
import ChatUserStatus from './ChatUserStatus';

// ============================================
// Define Associations/Relationships
// ============================================

// User - Department relationship
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(User, { foreignKey: 'departmentId', as: 'employees' });

// User - User (Manager) relationship
User.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
User.hasMany(User, { foreignKey: 'managerId', as: 'subordinates' });

// Department - User (Head) relationship
Department.belongsTo(User, { foreignKey: 'headId', as: 'head' });

// Leave Balance - User relationship
LeaveBalance.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(LeaveBalance, { foreignKey: 'userId', as: 'leaveBalances' });

// Leave Request - User relationship
LeaveRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(LeaveRequest, { foreignKey: 'userId', as: 'leaveRequests' });

LeaveRequest.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
User.hasMany(LeaveRequest, { foreignKey: 'approverId', as: 'approvedLeaves' });

// Leave Approval - Leave Request relationship
LeaveApproval.belongsTo(LeaveRequest, { foreignKey: 'leaveRequestId', as: 'leaveRequest' });
LeaveRequest.hasMany(LeaveApproval, { foreignKey: 'leaveRequestId', as: 'approvals' });

// Leave Approval - User (Approver) relationship
LeaveApproval.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
User.hasMany(LeaveApproval, { foreignKey: 'approverId', as: 'leaveApprovals' });

// Expense - User relationship
Expense.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses' });

Expense.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
User.hasMany(Expense, { foreignKey: 'approverId', as: 'approvedExpenses' });

// Project - User relationship
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });

Project.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Project, { foreignKey: 'createdBy', as: 'createdProjects' });

// Project - Department relationship
Project.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(Project, { foreignKey: 'departmentId', as: 'projects' });

// Project - self-referential relationship (hierarchical projects)
Project.belongsTo(Project, { foreignKey: 'parentId', as: 'parent' });
Project.hasMany(Project, { foreignKey: 'parentId', as: 'children' });

// Task - Project relationship
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });

// Task - User relationships
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });

Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });

// Task - self-referential relationship (dependencies)
Task.belongsTo(Task, { foreignKey: 'dependsOnTaskId', as: 'dependsOn' });
Task.hasMany(Task, { foreignKey: 'dependsOnTaskId', as: 'dependentTasks' });

// Task Attachment relationships
TaskAttachment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Task.hasMany(TaskAttachment, { foreignKey: 'taskId', as: 'attachments' });

TaskAttachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(TaskAttachment, { foreignKey: 'uploadedBy', as: 'uploadedTaskAttachments' });

// Project Attachment relationships
ProjectAttachment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(ProjectAttachment, { foreignKey: 'projectId', as: 'attachments' });

ProjectAttachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(ProjectAttachment, { foreignKey: 'uploadedBy', as: 'uploadedProjectAttachments' });

// Notification - User relationship
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// Payroll - User relationship
Payroll.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Payroll, { foreignKey: 'userId', as: 'payrollRecords' });

Payroll.belongsTo(User, { foreignKey: 'processedBy', as: 'processor' });
User.hasMany(Payroll, { foreignKey: 'processedBy', as: 'processedPayrolls' });

// Employee Salary Detail - User relationship
EmployeeSalaryDetail.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(EmployeeSalaryDetail, { foreignKey: 'userId', as: 'salaryDetails' });

// Voucher - User relationship
Voucher.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Voucher, { foreignKey: 'createdBy', as: 'vouchers' });

// Voucher - Expense relationship
Voucher.belongsTo(Expense, { foreignKey: 'expenseId', as: 'expense' });
Expense.hasMany(Voucher, { foreignKey: 'expenseId', as: 'vouchers' });

// AdvanceSalaryRequest - User relationships
AdvanceSalaryRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AdvanceSalaryRequest, { foreignKey: 'userId', as: 'advanceSalaryRequests' });

AdvanceSalaryRequest.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
User.hasMany(AdvanceSalaryRequest, { foreignKey: 'approverId', as: 'approvedAdvances' });

AdvanceSalaryRequest.belongsTo(User, { foreignKey: 'disbursedBy', as: 'disburser' });
User.hasMany(AdvanceSalaryRequest, { foreignKey: 'disbursedBy', as: 'disbursedAdvances' });

// EmployeeCustomField - User relationship
EmployeeCustomField.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(EmployeeCustomField, { foreignKey: 'userId', as: 'customFields' });

// EmployeeDocument - User relationship
EmployeeDocument.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(EmployeeDocument, { foreignKey: 'userId', as: 'documents' });

// InventoryProduct - User relationship
InventoryProduct.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(InventoryProduct, { foreignKey: 'createdBy', as: 'inventoryProducts' });

// InventoryMovement - InventoryProduct relationship
InventoryMovement.belongsTo(InventoryProduct, { foreignKey: 'productId', as: 'product' });
InventoryProduct.hasMany(InventoryMovement, { foreignKey: 'productId', as: 'movements' });

// InventoryMovement - User relationship
InventoryMovement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(InventoryMovement, { foreignKey: 'createdBy', as: 'inventoryMovements' });

// InventoryMovement - Vendor relationship (for stock in)
InventoryMovement.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Vendor.hasMany(InventoryMovement, { foreignKey: 'vendorId', as: 'inventoryMovements' });

// InventoryMovement - Customer relationship (for stock out)
InventoryMovement.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(InventoryMovement, { foreignKey: 'customerId', as: 'inventoryMovements' });

// ============================================
// Asset Management Associations
// ============================================

// Asset - User (Creator) relationship
Asset.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Asset, { foreignKey: 'createdBy', as: 'createdAssets' });

// AssetAssignment - Asset relationship
AssetAssignment.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
Asset.hasMany(AssetAssignment, { foreignKey: 'assetId', as: 'assignments' });

// AssetAssignment - User relationships
AssetAssignment.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
User.hasMany(AssetAssignment, { foreignKey: 'assignedTo', as: 'assetAssignments' });

AssetAssignment.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });
User.hasMany(AssetAssignment, { foreignKey: 'assignedBy', as: 'assignedAssets' });

// AssetRequest - Asset relationship
AssetRequest.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
Asset.hasMany(AssetRequest, { foreignKey: 'assetId', as: 'requests' });

// AssetRequest - User relationships
AssetRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });
User.hasMany(AssetRequest, { foreignKey: 'requestedBy', as: 'assetRequests' });

AssetRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
User.hasMany(AssetRequest, { foreignKey: 'reviewedBy', as: 'reviewedAssetRequests' });

// ============================================
// Storage Management Associations
// ============================================

// StorageFolder - User (Owner) relationship
StorageFolder.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(StorageFolder, { foreignKey: 'ownerId', as: 'storageFolders' });

// StorageFolder self-referencing (parent-child)
StorageFolder.belongsTo(StorageFolder, { foreignKey: 'parentId', as: 'parent' });
StorageFolder.hasMany(StorageFolder, { foreignKey: 'parentId', as: 'children' });

// StorageFile - User (Owner) relationship
StorageFile.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(StorageFile, { foreignKey: 'ownerId', as: 'storageFiles' });

// StorageFile - StorageFolder relationship
StorageFile.belongsTo(StorageFolder, { foreignKey: 'folderId', as: 'folder' });
StorageFolder.hasMany(StorageFile, { foreignKey: 'folderId', as: 'files' });

// StorageShare - StorageFile relationship
StorageShare.belongsTo(StorageFile, { foreignKey: 'fileId', as: 'file' });
StorageFile.hasMany(StorageShare, { foreignKey: 'fileId', as: 'shares' });

// StorageShare - StorageFolder relationship
StorageShare.belongsTo(StorageFolder, { foreignKey: 'folderId', as: 'folder' });
StorageFolder.hasMany(StorageShare, { foreignKey: 'folderId', as: 'shares' });

// StorageShare - User (sharedWith) relationship
StorageShare.belongsTo(User, { foreignKey: 'sharedWith', as: 'sharedWithUser' });
User.hasMany(StorageShare, { foreignKey: 'sharedWith', as: 'sharedWithMe' });

// StorageShare - User (sharedBy) relationship
StorageShare.belongsTo(User, { foreignKey: 'sharedBy', as: 'sharedByUser' });
User.hasMany(StorageShare, { foreignKey: 'sharedBy', as: 'sharedByMe' });

// ============================================
// Chat Associations
// ============================================

// ChatConversation - User (Creator) relationship
ChatConversation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(ChatConversation, { foreignKey: 'createdBy', as: 'createdConversations' });

// ChatParticipant - ChatConversation relationship
ChatParticipant.belongsTo(ChatConversation, { foreignKey: 'conversationId', as: 'conversation' });
ChatConversation.hasMany(ChatParticipant, { foreignKey: 'conversationId', as: 'participants' });

// ChatParticipant - User relationship
ChatParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ChatParticipant, { foreignKey: 'userId', as: 'chatParticipations' });

// ChatMessage - ChatConversation relationship
ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversationId', as: 'conversation' });
ChatConversation.hasMany(ChatMessage, { foreignKey: 'conversationId', as: 'messages' });

// ChatMessage - User (Sender) relationship
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });

// ChatMessage self-referencing (reply to)
ChatMessage.belongsTo(ChatMessage, { foreignKey: 'replyToId', as: 'replyTo' });
ChatMessage.hasMany(ChatMessage, { foreignKey: 'replyToId', as: 'replies' });

// ChatAttachment - ChatMessage relationship
ChatAttachment.belongsTo(ChatMessage, { foreignKey: 'messageId', as: 'message' });
ChatMessage.hasMany(ChatAttachment, { foreignKey: 'messageId', as: 'attachments' });

// ChatAttachment - StorageFile relationship (optional link to storage system)
ChatAttachment.belongsTo(StorageFile, { foreignKey: 'fileId', as: 'storageFile' });
StorageFile.hasMany(ChatAttachment, { foreignKey: 'fileId', as: 'chatAttachments' });

// ChatUserStatus - User relationship
ChatUserStatus.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(ChatUserStatus, { foreignKey: 'userId', as: 'chatStatus' });

// Export all models
export {
  User,
  Department,
  LeaveBalance,
  LeaveRequest,
  LeaveApproval,
  Holiday,
  Expense,
  Project,
  Task,
  TaskAttachment,
  ProjectAttachment,
  Notification,
  Payroll,
  EmployeeSalaryDetail,
  Voucher,
  AdvanceSalaryRequest,
  EmployeeCustomField,
  EmployeeDocument,
  ExpenseCategoryCap,
  Vendor,
  Customer,
  InventoryProduct,
  InventoryMovement,
  Asset,
  AssetAssignment,
  AssetRequest,
  StorageFolder,
  StorageFile,
  StorageShare,
  // Chat models
  ChatConversation,
  ChatParticipant,
  ChatMessage,
  ChatAttachment,
  ChatUserStatus,
};

// Export default object with all models
export default {
  User,
  Department,
  LeaveBalance,
  LeaveRequest,
  LeaveApproval,
  Holiday,
  Expense,
  Project,
  Task,
  TaskAttachment,
  ProjectAttachment,
  Notification,
  Payroll,
  EmployeeSalaryDetail,
  Voucher,
  AdvanceSalaryRequest,
  EmployeeCustomField,
  EmployeeDocument,
  ExpenseCategoryCap,
  Vendor,
  Customer,
  InventoryProduct,
  InventoryMovement,
  Asset,
  AssetAssignment,
  AssetRequest,
  StorageFolder,
  StorageFile,
  StorageShare,
  // Chat models
  ChatConversation,
  ChatParticipant,
  ChatMessage,
  ChatAttachment,
  ChatUserStatus,
};
