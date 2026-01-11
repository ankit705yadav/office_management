import {
  User,
  Department,
  LeaveBalance,
  LeaveRequest,
  Project,
  Task,
  Client,
  TaskComment,
  Notification,
} from '../../models';
import { UserRole, UserStatus, ProjectStatus } from '../../types/enums';

export interface TestData {
  department: Department;
  admin: User;
  manager: User;
  employee: User;
  inactiveUser: User;
  leaveBalance: LeaveBalance;
  client: Client;
  project: Project;
}

export const seedTestData = async (): Promise<TestData> => {
  // Create test department
  const department = await Department.create({
    name: 'Engineering',
    description: 'Engineering Department',
  });

  // Create admin user
  const admin = await User.create({
    email: 'admin@test.com',
    passwordHash: 'Admin@123',
    firstName: 'Admin',
    lastName: 'User',
    dateOfJoining: new Date('2023-01-01'),
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    departmentId: department.id,
  });

  // Create manager user
  const manager = await User.create({
    email: 'manager@test.com',
    passwordHash: 'Manager@123',
    firstName: 'Manager',
    lastName: 'User',
    dateOfJoining: new Date('2023-01-01'),
    role: UserRole.MANAGER,
    status: UserStatus.ACTIVE,
    departmentId: department.id,
  });

  // Create employee user
  const employee = await User.create({
    email: 'employee@test.com',
    passwordHash: 'Employee@123',
    firstName: 'Employee',
    lastName: 'User',
    dateOfJoining: new Date('2023-06-01'),
    role: UserRole.EMPLOYEE,
    status: UserStatus.ACTIVE,
    departmentId: department.id,
    managerId: manager.id,
  });

  // Create inactive user for testing
  const inactiveUser = await User.create({
    email: 'inactive@test.com',
    passwordHash: 'Inactive@123',
    firstName: 'Inactive',
    lastName: 'User',
    dateOfJoining: new Date('2023-01-01'),
    role: UserRole.EMPLOYEE,
    status: UserStatus.INACTIVE,
    departmentId: department.id,
  });

  // Create leave balance for employee (Total: 25 = 12 sick + 12 casual + 1 birthday)
  const leaveBalance = await LeaveBalance.create({
    userId: employee.id,
    year: new Date().getFullYear(),
    sickLeave: 12.0,
    casualLeave: 12.0,
    earnedLeave: 0.0,
    compOff: 2.0,
    paternityMaternity: 0,
    birthdayLeave: 1.0,
  });

  // Create a client
  const client = await Client.create({
    name: 'Test Client',
    email: 'client@test.com',
    contactPerson: 'John Client',
    createdBy: admin.id,
  });

  // Create a project
  const project = await Project.create({
    name: 'Test Project',
    description: 'A test project',
    status: ProjectStatus.ACTIVE,
    ownerId: manager.id,
    departmentId: department.id,
    clientId: client.id,
    createdBy: admin.id,
  });

  return {
    department,
    admin,
    manager,
    employee,
    inactiveUser,
    leaveBalance,
    client,
    project,
  };
};

export const cleanupTestData = async (): Promise<void> => {
  // Clean in reverse order of foreign key dependencies
  await TaskComment.destroy({ where: {}, force: true });
  await Task.destroy({ where: {}, force: true });
  await Project.destroy({ where: {}, force: true });
  await Client.destroy({ where: {}, force: true });
  await LeaveRequest.destroy({ where: {}, force: true });
  await LeaveBalance.destroy({ where: {}, force: true });
  await Notification.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
  await Department.destroy({ where: {}, force: true });
};
