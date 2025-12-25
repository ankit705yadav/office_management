export const mockAdmin = {
  id: 1,
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  fullName: 'Admin User',
  role: 'admin',
  status: 'active',
  departmentId: 1,
  department: {
    id: 1,
    name: 'Engineering',
  },
};

export const mockManager = {
  id: 2,
  email: 'manager@test.com',
  firstName: 'Manager',
  lastName: 'User',
  fullName: 'Manager User',
  role: 'manager',
  status: 'active',
  departmentId: 1,
  department: {
    id: 1,
    name: 'Engineering',
  },
};

export const mockEmployee = {
  id: 3,
  email: 'employee@test.com',
  firstName: 'Employee',
  lastName: 'User',
  fullName: 'Employee User',
  role: 'employee',
  status: 'active',
  departmentId: 1,
  managerId: 2,
  department: {
    id: 1,
    name: 'Engineering',
  },
  manager: {
    id: 2,
    firstName: 'Manager',
    lastName: 'User',
    email: 'manager@test.com',
  },
};

export const mockUsers = [mockAdmin, mockManager, mockEmployee];
