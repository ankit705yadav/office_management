// Import all models
import User from './User';
import Department from './Department';
import LeaveBalance from './LeaveBalance';
import LeaveRequest from './LeaveRequest';
import LeaveApproval from './LeaveApproval';
import Holiday from './Holiday';
import Project from './Project';
import Task from './Task';
import Notification from './Notification';
import EmployeeCustomField from './EmployeeCustomField';
import EmployeeDocument from './EmployeeDocument';
import TaskAttachment from './TaskAttachment';
import ProjectAttachment from './ProjectAttachment';
import DailyReport from './DailyReport';
import DailyReportEntry from './DailyReportEntry';
import EmployeeSalary from './EmployeeSalary';
import Payment from './Payment';
import Attendance from './Attendance';
import Client from './Client';

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

// EmployeeCustomField - User relationship
EmployeeCustomField.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(EmployeeCustomField, { foreignKey: 'userId', as: 'customFields' });

// EmployeeDocument - User relationship
EmployeeDocument.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(EmployeeDocument, { foreignKey: 'userId', as: 'documents' });

// Daily Report - User relationship
DailyReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(DailyReport, { foreignKey: 'userId', as: 'dailyReports' });

// Daily Report Entry - Daily Report relationship
DailyReportEntry.belongsTo(DailyReport, { foreignKey: 'dailyReportId', as: 'dailyReport' });
DailyReport.hasMany(DailyReportEntry, { foreignKey: 'dailyReportId', as: 'entries' });

// Daily Report Entry - Project relationship
DailyReportEntry.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(DailyReportEntry, { foreignKey: 'projectId', as: 'dailyReportEntries' });

// Daily Report Entry - Task relationship
DailyReportEntry.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Task.hasMany(DailyReportEntry, { foreignKey: 'taskId', as: 'dailyReportEntries' });

// EmployeeSalary - User relationships
EmployeeSalary.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(EmployeeSalary, { foreignKey: 'userId', as: 'salaries' });

EmployeeSalary.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Payment - User relationships
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });

Payment.belongsTo(User, { foreignKey: 'paidBy', as: 'payer' });

// Payment - EmployeeSalary relationship
Payment.belongsTo(EmployeeSalary, { foreignKey: 'salaryId', as: 'salary' });
EmployeeSalary.hasMany(Payment, { foreignKey: 'salaryId', as: 'payments' });

// Client - User (Creator) relationship
Client.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Client, { foreignKey: 'createdBy', as: 'createdClients' });

// Project - Client relationship
Project.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Client.hasMany(Project, { foreignKey: 'clientId', as: 'projects' });

// Export all models
export {
  User,
  Department,
  LeaveBalance,
  LeaveRequest,
  LeaveApproval,
  Holiday,
  Project,
  Task,
  TaskAttachment,
  ProjectAttachment,
  Notification,
  EmployeeCustomField,
  EmployeeDocument,
  DailyReport,
  DailyReportEntry,
  EmployeeSalary,
  Payment,
  Attendance,
  Client,
};

// Export default object with all models
export default {
  User,
  Department,
  LeaveBalance,
  LeaveRequest,
  LeaveApproval,
  Holiday,
  Project,
  Task,
  TaskAttachment,
  ProjectAttachment,
  Notification,
  EmployeeCustomField,
  EmployeeDocument,
  DailyReport,
  DailyReportEntry,
  EmployeeSalary,
  Payment,
  Attendance,
  Client,
};
