import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Tooltip,
  Paper,
  InputAdornment,
  Avatar,
  Autocomplete,
  Drawer,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Badge,
  Search,
  Visibility,
  Business,
  Phone,
  Email,
  CalendarMonth,
  Close,
  Link as LinkIcon,
  LocationOn,
  Cake,
  ContactPhone,
  Person,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { employeeService, CreateEmployeeRequest, UpdateEmployeeRequest, CustomField } from '@/services/employee.service';
import type { User, Department } from '@/types';

// Drawer mode type
type DrawerMode = 'add' | 'edit' | 'view' | null;

const createEmployeeSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phone: yup.string().optional(),
  dateOfBirth: yup.string().optional(),
  dateOfJoining: yup.string().required('Date of joining is required'),
  role: yup.string().required('Role is required'),
  departmentId: yup.number().transform((value, original) => original === '' ? undefined : value).optional().nullable(),
  managerId: yup.number().transform((value, original) => original === '' ? undefined : value).optional().nullable(),
  address: yup.string().optional(),
  emergencyContactName: yup.string().optional(),
  emergencyContactPhone: yup.string().optional(),
});

const updateEmployeeSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().optional(),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().optional(),
  phone: yup.string().optional(),
  dateOfBirth: yup.string().optional(),
  dateOfJoining: yup.string().optional(),
  role: yup.string().required('Role is required'),
  status: yup.string().required('Status is required'),
  departmentId: yup.number().transform((value, original) => original === '' ? undefined : value).optional().nullable(),
  managerId: yup.number().transform((value, original) => original === '' ? undefined : value).optional().nullable(),
  address: yup.string().optional(),
  panNumber: yup.string().optional(),
  aadharNumber: yup.string().optional(),
  emergencyContactName: yup.string().optional(),
  emergencyContactPhone: yup.string().optional(),
});

const getStatusColor = (status: string): 'default' | 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'active':
      return 'success';
    case 'on_leave':
      return 'warning';
    case 'terminated':
      return 'error';
    default:
      return 'default';
  }
};

const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return '#8B5CF6';
    case 'manager':
      return '#3B82F6';
    case 'employee':
      return '#10B981';
    default:
      return '#6B7280';
  }
};

// Common TextField styling
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
    '& fieldset': { borderColor: 'var(--text-secondary)' },
    '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
    '&.Mui-disabled': {
      '& fieldset': { borderColor: 'var(--border)' },
    },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
  '& .MuiOutlinedInput-input': {
    backgroundColor: 'transparent',
    '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
      WebkitBoxShadow: '0 0 0 30px var(--surface) inset !important',
      WebkitTextFillColor: 'var(--text-primary) !important',
      caretColor: 'var(--text-primary)',
    },
  },
  '& .MuiOutlinedInput-input.Mui-disabled': {
    color: 'var(--text-primary)',
    WebkitTextFillColor: 'var(--text-primary)',
  },
};

const dateFieldSx = {
  ...textFieldSx,
  '& input[type="date"]::-webkit-calendar-picker-indicator': {
    filter: 'invert(1)',
    cursor: 'pointer',
  },
};

const selectFieldSx = {
  ...textFieldSx,
  '& .MuiSelect-icon': { color: 'var(--text-secondary)' },
};

const selectMenuProps = {
  PaperProps: {
    sx: {
      bgcolor: 'var(--surface)',
      border: '1px solid var(--border)',
      '& .MuiMenuItem-root': {
        color: 'var(--text-primary)',
        '&:hover': { bgcolor: 'var(--bg-elevated)' },
        '&.Mui-selected': { bgcolor: 'var(--bg-elevated)' },
      },
    },
  },
};

const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [documentLinks, setDocumentLinks] = useState<{ linkTitle: string; linkUrl: string }[]>([]);

  // Edit mode state variables
  const [editProfileImageUrl, setEditProfileImageUrl] = useState('');
  const [editEmergencyContactName, setEditEmergencyContactName] = useState('');
  const [editEmergencyContactPhone, setEditEmergencyContactPhone] = useState('');
  const [editCustomFields, setEditCustomFields] = useState<CustomField[]>([]);
  const [editDocumentLinks, setEditDocumentLinks] = useState<{ linkTitle: string; linkUrl: string }[]>([]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Stats from API
  const [stats, setStats] = useState({ total: 0, active: 0, managers: 0, admins: 0 });

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreate,
  } = useForm<CreateEmployeeRequest>({
    resolver: yupResolver(createEmployeeSchema) as any,
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      dateOfJoining: format(new Date(), 'yyyy-MM-dd'),
      role: 'employee',
      departmentId: '' as any,
      managerId: '' as any,
    },
  });

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue,
  } = useForm<UpdateEmployeeRequest>({
    resolver: yupResolver(updateEmployeeSchema) as any,
  });

  useEffect(() => {
    loadDepartments();
    loadManagers();
  }, []);

  // Load employees when pagination or filters change
  useEffect(() => {
    loadEmployees();
  }, [page, rowsPerPage, searchTerm, filterStatus, filterDepartment]);

  const loadEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await employeeService.getEmployees({
        page: page + 1, // API uses 1-indexed pages
        limit: rowsPerPage,
        search: searchTerm || undefined,
        status: filterStatus || undefined,
        departmentId: filterDepartment ? parseInt(filterDepartment) : undefined,
      });
      setEmployees(response.items);
      setTotal(response.pagination?.total || 0);
      setStats(response.stats);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      // Load all managers/admins for the manager dropdown
      const response = await employeeService.getEmployees({ limit: 100, role: 'manager' });
      const adminResponse = await employeeService.getEmployees({ limit: 100, role: 'admin' });
      setManagers([...response.items, ...adminResponse.items]);
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const depts = await employeeService.getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const handleCreateEmployee = async (data: CreateEmployeeRequest) => {
    try {
      setSubmitting(true);
      await employeeService.createEmployee({
        ...data,
        panNumber: panNumber || undefined,
        aadharNumber: aadharNumber || undefined,
        address: address || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        profileImageUrl: profileImageUrl || undefined,
        documentLinks: documentLinks.filter(d => d.linkUrl && d.linkTitle).length > 0
          ? documentLinks.filter(d => d.linkUrl && d.linkTitle)
          : undefined,
        customFields: customFields.filter(f => f.fieldName && f.fieldValue).length > 0
          ? customFields.filter(f => f.fieldName && f.fieldValue)
          : undefined,
      });
      toast.success('Employee created successfully');
      closeDrawer();
      loadEmployees();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to create employee';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (data: UpdateEmployeeRequest) => {
    if (!selectedEmployee) return;

    try {
      setSubmitting(true);
      // Clean up data before sending
      const updateData: any = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      // Remove empty/invalid date fields
      if (!updateData.dateOfBirth || updateData.dateOfBirth === 'Invalid date') {
        delete updateData.dateOfBirth;
      }
      if (!updateData.dateOfJoining || updateData.dateOfJoining === 'Invalid date') {
        delete updateData.dateOfJoining;
      }
      // Add edit form state fields
      updateData.profileImageUrl = editProfileImageUrl || undefined;
      updateData.emergencyContactName = editEmergencyContactName || undefined;
      updateData.emergencyContactPhone = editEmergencyContactPhone || undefined;
      updateData.customFields = editCustomFields.filter(f => f.fieldName && f.fieldValue).length > 0
        ? editCustomFields.filter(f => f.fieldName && f.fieldValue)
        : undefined;
      updateData.documentLinks = editDocumentLinks.filter(d => d.linkUrl && d.linkTitle).length > 0
        ? editDocumentLinks.filter(d => d.linkUrl && d.linkTitle)
        : undefined;
      await employeeService.updateEmployee(selectedEmployee.id, updateData);
      toast.success('Employee updated successfully');
      closeDrawer();
      loadEmployees();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to update employee';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employee: User) => {
    if (!window.confirm(`Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}?`)) {
      return;
    }

    try {
      await employeeService.deleteEmployee(employee.id);
      toast.success('Employee deactivated successfully');
      loadEmployees();
    } catch (error) {
      toast.error('Failed to deactivate employee');
    }
  };

  const handleDownloadIdCard = async (employee: User) => {
    try {
      toast.info('Generating ID card...');
      await employeeService.downloadIdCard(employee.id, `${employee.firstName} ${employee.lastName}`);
      toast.success('ID card downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate ID card');
    }
  };

  const openDrawer = (mode: DrawerMode, employee?: User) => {
    setDrawerMode(mode);
    if (employee) {
      setSelectedEmployee(employee);
      if (mode === 'edit') {
        setEditValue('email', employee.email);
        setEditValue('password', '');
        setEditValue('firstName', employee.firstName);
        setEditValue('lastName', employee.lastName || '');
        setEditValue('phone', employee.phone || '');
        const dob = employee.dateOfBirth ? new Date(employee.dateOfBirth) : null;
        const doj = employee.dateOfJoining ? new Date(employee.dateOfJoining) : null;
        setEditValue('dateOfBirth', dob && !isNaN(dob.getTime()) ? format(dob, 'yyyy-MM-dd') : '');
        setEditValue('dateOfJoining', doj && !isNaN(doj.getTime()) ? format(doj, 'yyyy-MM-dd') : '');
        setEditValue('role', employee.role);
        setEditValue('status', employee.status);
        setEditValue('departmentId', employee.departmentId || undefined);
        setEditValue('managerId', employee.managerId || undefined);
        setEditValue('address', (employee as any).address || '');
        setEditValue('panNumber', (employee as any).panNumber || '');
        setEditValue('aadharNumber', (employee as any).aadharNumber || '');
        // Set edit mode state variables
        setEditProfileImageUrl((employee as any).profileImageUrl || '');
        setEditEmergencyContactName((employee as any).emergencyContactName || '');
        setEditEmergencyContactPhone((employee as any).emergencyContactPhone || '');
        setEditCustomFields((employee as any).customFields || []);
        setEditDocumentLinks((employee as any).documents || []);
      }
    }
  };

  const closeDrawer = () => {
    if (submitting) return;
    setDrawerMode(null);
    setSelectedEmployee(null);
    resetCreate();
    resetEdit();
    // Reset create form state
    setProfileImageUrl('');
    setPanNumber('');
    setAadharNumber('');
    setAddress('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setCustomFields([]);
    setDocumentLinks([]);
    // Reset edit form state
    setEditProfileImageUrl('');
    setEditEmergencyContactName('');
    setEditEmergencyContactPhone('');
    setEditCustomFields([]);
    setEditDocumentLinks([]);
  };

  const handleViewEmployee = async (employee: User) => {
    try {
      const fullEmployee = await employeeService.getEmployeeById(employee.id);
      openDrawer('view', fullEmployee);
    } catch (error) {
      toast.error('Failed to load employee details');
    }
  };

  const switchToEditMode = () => {
    if (selectedEmployee) {
      setEditValue('email', selectedEmployee.email);
      setEditValue('password', '');
      setEditValue('firstName', selectedEmployee.firstName);
      setEditValue('lastName', selectedEmployee.lastName || '');
      setEditValue('phone', selectedEmployee.phone || '');
      const dob = selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth) : null;
      const doj = selectedEmployee.dateOfJoining ? new Date(selectedEmployee.dateOfJoining) : null;
      setEditValue('dateOfBirth', dob && !isNaN(dob.getTime()) ? format(dob, 'yyyy-MM-dd') : '');
      setEditValue('dateOfJoining', doj && !isNaN(doj.getTime()) ? format(doj, 'yyyy-MM-dd') : '');
      setEditValue('role', selectedEmployee.role);
      setEditValue('status', selectedEmployee.status);
      setEditValue('departmentId', selectedEmployee.departmentId || undefined);
      setEditValue('managerId', selectedEmployee.managerId || undefined);
      setEditValue('address', (selectedEmployee as any).address || '');
      setEditValue('panNumber', (selectedEmployee as any).panNumber || '');
      setEditValue('aadharNumber', (selectedEmployee as any).aadharNumber || '');
      // Set edit mode state variables
      setEditProfileImageUrl((selectedEmployee as any).profileImageUrl || '');
      setEditEmergencyContactName((selectedEmployee as any).emergencyContactName || '');
      setEditEmergencyContactPhone((selectedEmployee as any).emergencyContactPhone || '');
      setEditCustomFields((selectedEmployee as any).customFields || []);
      setEditDocumentLinks((selectedEmployee as any).documents || []);
      setDrawerMode('edit');
    }
  };

  // Pagination handlers
  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get drawer title based on mode
  const getDrawerTitle = () => {
    switch (drawerMode) {
      case 'add': return 'Add New Employee';
      case 'edit': return 'Edit Employee';
      case 'view': return 'Employee Details';
      default: return '';
    }
  };

  const isViewMode = drawerMode === 'view';
  const isEditMode = drawerMode === 'edit';
  const isAddMode = drawerMode === 'add';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Employee Management</h1>
          <p className="text-sm text-text-secondary mt-1">Manage employees and generate ID cards</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => openDrawer('add')}
        >
          <Add sx={{ fontSize: 20 }} />
          Add Employee
        </button>
      </Box>

      {/* Statistics */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div
          className="flex-1 min-w-[140px] rounded-lg p-3"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-xs mb-1" style={{ color: '#3d9be9' }}>
            Total Employees
          </p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.total}
          </p>
        </div>

        <div
          className="flex-1 min-w-[140px] rounded-lg p-3"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-xs mb-1" style={{ color: '#10B981' }}>
            Active
          </p>
          <p className="text-xl font-bold" style={{ color: '#10B981' }}>
            {stats.active}
          </p>
        </div>

        <div
          className="flex-1 min-w-[140px] rounded-lg p-3"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-xs mb-1" style={{ color: '#3B82F6' }}>
            Managers
          </p>
          <p className="text-xl font-bold" style={{ color: '#3B82F6' }}>
            {stats.managers}
          </p>
        </div>

        <div
          className="flex-1 min-w-[140px] rounded-lg p-3"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-xs mb-1" style={{ color: '#8B5CF6' }}>
            Admins
          </p>
          <p className="text-xl font-bold" style={{ color: '#8B5CF6' }}>
            {stats.admins}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'var(--text-secondary)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--text-primary)',
                    '& fieldset': { borderColor: 'var(--border)' },
                    '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                  },
                  '& .MuiOutlinedInput-input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                sx={selectFieldSx}
                SelectProps={{ MenuProps: selectMenuProps }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="on_leave">On Leave</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Department"
                value={filterDepartment}
                onChange={(e) => { setFilterDepartment(e.target.value); setPage(0); }}
                sx={selectFieldSx}
                SelectProps={{ MenuProps: selectMenuProps }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', backgroundImage: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}><strong>Employee</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}><strong>Email</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}><strong>Department</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}><strong>Role</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}><strong>Status</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}><strong>Joined</strong></TableCell>
                    <TableCell align="center" sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ borderColor: 'var(--border)' }}>
                        <CircularProgress size={24} sx={{ color: 'var(--accent-primary)' }} />
                      </TableCell>
                    </TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                        <Typography sx={{ color: 'var(--text-secondary)' }} py={4}>
                          No employees found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow key={employee.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                        <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              src={employee.profileImageUrl ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${employee.profileImageUrl}` : undefined}
                              sx={{ width: 36, height: 36, bgcolor: getRoleColor(employee.role) }}
                            >
                              {employee.firstName[0]}{employee.lastName[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                                {employee.firstName} {employee.lastName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                {employee.phone || 'No phone'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                          {employee.email}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                          {(employee as any).department?.name || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'var(--border)' }}>
                          <Chip
                            label={employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                            size="small"
                            sx={{
                              bgcolor: getRoleColor(employee.role) + '20',
                              color: getRoleColor(employee.role),
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: 'var(--border)' }}>
                          <Chip
                            label={employee.status.replace('_', ' ')}
                            size="small"
                            color={getStatusColor(employee.status)}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                          {employee.dateOfJoining
                            ? format(new Date(employee.dateOfJoining), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="center" sx={{ borderColor: 'var(--border)' }}>
                          <Box display="flex" gap={0.5} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewEmployee(employee)}
                                sx={{ color: '#3d9be9' }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => openDrawer('edit', employee)}
                                sx={{ color: '#F59E0B' }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Generate ID Card">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadIdCard(employee)}
                                sx={{ color: '#8B5CF6' }}
                              >
                                <Badge />
                              </IconButton>
                            </Tooltip>
                            {employee.id !== user?.id && employee.status === 'active' && (
                              <Tooltip title="Deactivate">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteEmployee(employee)}
                                  sx={{ color: '#EF4444' }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                  borderTop: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    color: 'var(--text-secondary)',
                  },
                  '& .MuiTablePagination-select': {
                    color: 'var(--text-primary)',
                  },
                  '& .MuiIconButton-root': {
                    color: 'var(--text-secondary)',
                  },
                  '& .MuiIconButton-root.Mui-disabled': {
                    color: 'var(--text-muted)',
                  },
                }}
              />
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Unified Employee Drawer */}
      <Drawer
        anchor="right"
        open={drawerMode !== null}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480 },
            bgcolor: 'var(--surface)',
            borderRadius: 0,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
              {getDrawerTitle()}
            </Typography>
            <IconButton
              onClick={closeDrawer}
              size="small"
              sx={{ color: 'var(--text-secondary)' }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {/* View Mode Content */}
            {isViewMode && selectedEmployee && (
              <Box>
                {/* Profile Header */}
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar
                    src={selectedEmployee.profileImageUrl ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${selectedEmployee.profileImageUrl}` : undefined}
                    sx={{ width: 80, height: 80, bgcolor: getRoleColor(selectedEmployee.role) }}
                  >
                    {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </Typography>
                    <Chip
                      label={selectedEmployee.role.charAt(0).toUpperCase() + selectedEmployee.role.slice(1)}
                      size="small"
                      sx={{
                        bgcolor: getRoleColor(selectedEmployee.role) + '20',
                        color: getRoleColor(selectedEmployee.role),
                        fontWeight: 500,
                        mt: 0.5,
                      }}
                    />
                  </Box>
                </Box>

                {/* Contact Information */}
                <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                  Contact Information
                </Typography>
                <Divider sx={{ borderColor: 'var(--border)', mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Email sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{selectedEmployee.email}</Typography>
                  </Box>
                  {selectedEmployee.phone && (
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Phone sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{selectedEmployee.phone}</Typography>
                    </Box>
                  )}
                  {(selectedEmployee as any).address && (
                    <Box display="flex" alignItems="flex-start" gap={1.5}>
                      <LocationOn sx={{ color: 'var(--text-secondary)', fontSize: 20, mt: 0.25 }} />
                      <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{(selectedEmployee as any).address}</Typography>
                    </Box>
                  )}
                </Box>

                {/* Personal Information */}
                {(selectedEmployee as any).dateOfBirth && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Personal Information
                    </Typography>
                    <Divider sx={{ borderColor: 'var(--border)', mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Cake sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                          {format(new Date((selectedEmployee as any).dateOfBirth), 'MMMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}

                {/* Employment Details */}
                <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                  Employment Details
                </Typography>
                <Divider sx={{ borderColor: 'var(--border)', mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Business sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                      {(selectedEmployee as any).department?.name || 'No Department'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <CalendarMonth sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                      Joined: {selectedEmployee.dateOfJoining
                        ? format(new Date(selectedEmployee.dateOfJoining), 'MMMM dd, yyyy')
                        : 'N/A'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Status:
                    </Typography>
                    <Chip
                      label={selectedEmployee.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(selectedEmployee.status)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                  {(selectedEmployee as any).manager && (
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Reports to: <span style={{ color: 'var(--text-primary)' }}>{(selectedEmployee as any).manager.firstName} {(selectedEmployee as any).manager.lastName}</span>
                    </Typography>
                  )}
                </Box>

                {/* Emergency Contact */}
                {((selectedEmployee as any).emergencyContactName || (selectedEmployee as any).emergencyContactPhone) && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Emergency Contact
                    </Typography>
                    <Divider sx={{ borderColor: 'var(--border)', mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                      {(selectedEmployee as any).emergencyContactName && (
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Person sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                            {(selectedEmployee as any).emergencyContactName}
                          </Typography>
                        </Box>
                      )}
                      {(selectedEmployee as any).emergencyContactPhone && (
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <ContactPhone sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                            {(selectedEmployee as any).emergencyContactPhone}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                )}

                {/* Leave Balance */}
                {(selectedEmployee as any).leaveBalances && (selectedEmployee as any).leaveBalances.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Leave Balance ({new Date().getFullYear()})
                    </Typography>
                    <Divider sx={{ borderColor: 'var(--border)', mb: 2 }} />
                    <Grid container spacing={1} sx={{ mb: 3 }}>
                      {(selectedEmployee as any).leaveBalances[0].sickLeave !== undefined && (
                        <Grid item xs={4}>
                          <Box sx={{ p: 1, bgcolor: 'var(--bg-elevated)', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>Sick</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#EF4444' }}>
                              {(selectedEmployee as any).leaveBalances[0].sickLeave}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {(selectedEmployee as any).leaveBalances[0].casualLeave !== undefined && (
                        <Grid item xs={4}>
                          <Box sx={{ p: 1, bgcolor: 'var(--bg-elevated)', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>Casual</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#3B82F6' }}>
                              {(selectedEmployee as any).leaveBalances[0].casualLeave}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {(selectedEmployee as any).leaveBalances[0].earnedLeave !== undefined && (
                        <Grid item xs={4}>
                          <Box sx={{ p: 1, bgcolor: 'var(--bg-elevated)', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>Earned</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#10B981' }}>
                              {(selectedEmployee as any).leaveBalances[0].earnedLeave}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {(selectedEmployee as any).leaveBalances[0].compOff !== undefined && (
                        <Grid item xs={4}>
                          <Box sx={{ p: 1, bgcolor: 'var(--bg-elevated)', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>Comp Off</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#8B5CF6' }}>
                              {(selectedEmployee as any).leaveBalances[0].compOff}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {(selectedEmployee as any).leaveBalances[0].paternityMaternity !== undefined && (
                        <Grid item xs={4}>
                          <Box sx={{ p: 1, bgcolor: 'var(--bg-elevated)', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>Paternity</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#F59E0B' }}>
                              {(selectedEmployee as any).leaveBalances[0].paternityMaternity}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {(selectedEmployee as any).leaveBalances[0].birthdayLeave !== undefined && (
                        <Grid item xs={4}>
                          <Box sx={{ p: 1, bgcolor: 'var(--bg-elevated)', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>Birthday</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#EC4899' }}>
                              {(selectedEmployee as any).leaveBalances[0].birthdayLeave}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}

                {/* Identity Documents */}
                {((selectedEmployee as any).panNumber || (selectedEmployee as any).aadharNumber) && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Identity Documents
                    </Typography>
                    <Divider sx={{ borderColor: 'var(--border)', mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                      {(selectedEmployee as any).panNumber && (
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                          PAN: <span style={{ color: 'var(--text-primary)' }}>{(selectedEmployee as any).panNumber}</span>
                        </Typography>
                      )}
                      {(selectedEmployee as any).aadharNumber && (
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                          Aadhar: <span style={{ color: 'var(--text-primary)' }}>{(selectedEmployee as any).aadharNumber}</span>
                        </Typography>
                      )}
                    </Box>
                  </>
                )}

                {/* Custom Fields */}
                {(selectedEmployee as any).customFields && (selectedEmployee as any).customFields.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Custom Fields
                    </Typography>
                    <Divider sx={{ borderColor: 'var(--border)', mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                      {(selectedEmployee as any).customFields.map((field: any, index: number) => (
                        <Typography key={index} variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                          {field.fieldName}: <span style={{ color: 'var(--text-primary)' }}>{field.fieldValue}</span>
                        </Typography>
                      ))}
                    </Box>
                  </>
                )}

                {/* Documents */}
                {(selectedEmployee as any).documents && (selectedEmployee as any).documents.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Document Links
                    </Typography>
                    <Divider sx={{ borderColor: 'var(--border)', mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {(selectedEmployee as any).documents.map((doc: any, index: number) => (
                        <Box
                          key={index}
                          component="a"
                          href={doc.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'var(--accent-primary)',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          <LinkIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">{doc.linkTitle}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}

            {/* Add Mode Form */}
            {isAddMode && (
              <form id="employee-form" onSubmit={handleCreateSubmit(handleCreateEmployee)}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: -0.5 }}>
                    Profile Photo
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  {/* Profile Image URL */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Profile Image URL"
                    value={profileImageUrl}
                    onChange={(e) => setProfileImageUrl(e.target.value)}
                    placeholder="https://example.com/profile-image.jpg"
                    disabled={submitting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'var(--bg-elevated)',
                        '& fieldset': { borderColor: 'var(--border)' },
                        '&:hover fieldset': { borderColor: 'var(--accent-primary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputBase-input': { color: 'var(--text-primary)' },
                    }}
                  />
                  {profileImageUrl && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar src={profileImageUrl} sx={{ width: 40, height: 40 }} />
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        Preview
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Personal Information
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <Controller
                    name="firstName"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="First Name"
                        error={!!createErrors.firstName}
                        helperText={createErrors.firstName?.message}
                        disabled={submitting}
                        sx={textFieldSx}
                      />
                    )}
                  />

                  <Controller
                    name="lastName"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Last Name"
                        error={!!createErrors.lastName}
                        helperText={createErrors.lastName?.message}
                        disabled={submitting}
                        sx={textFieldSx}
                      />
                    )}
                  />

                  <Controller
                    name="email"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Email"
                        type="email"
                        error={!!createErrors.email}
                        helperText={createErrors.email?.message}
                        disabled={submitting}
                        sx={textFieldSx}
                      />
                    )}
                  />

                  <Controller
                    name="password"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Password"
                        type="password"
                        error={!!createErrors.password}
                        helperText={createErrors.password?.message}
                        disabled={submitting}
                        sx={textFieldSx}
                      />
                    )}
                  />

                  <Controller
                    name="phone"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Phone"
                        error={!!createErrors.phone}
                        helperText={createErrors.phone?.message}
                        disabled={submitting}
                        sx={textFieldSx}
                      />
                    )}
                  />

                  <Controller
                    name="dateOfBirth"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Date of Birth"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        error={!!createErrors.dateOfBirth}
                        helperText={createErrors.dateOfBirth?.message}
                        disabled={submitting}
                        sx={dateFieldSx}
                      />
                    )}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    multiline
                    rows={2}
                    disabled={submitting}
                    sx={textFieldSx}
                  />

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Emergency Contact
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <TextField
                    fullWidth
                    size="small"
                    label="Emergency Contact Name"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    disabled={submitting}
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Emergency Contact Phone"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    disabled={submitting}
                    sx={textFieldSx}
                  />

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Employment Details
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <Controller
                    name="dateOfJoining"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Date of Joining"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        error={!!createErrors.dateOfJoining}
                        helperText={createErrors.dateOfJoining?.message}
                        disabled={submitting}
                        sx={dateFieldSx}
                      />
                    )}
                  />

                  <Controller
                    name="role"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        size="small"
                        label="Role"
                        error={!!createErrors.role}
                        helperText={createErrors.role?.message}
                        disabled={submitting}
                        sx={selectFieldSx}
                        SelectProps={{ MenuProps: selectMenuProps }}
                      >
                        <MenuItem value="employee">Employee</MenuItem>
                        <MenuItem value="manager">Manager</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </TextField>
                    )}
                  />

                  <Controller
                    name="departmentId"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        size="small"
                        label="Department"
                        error={!!createErrors.departmentId}
                        helperText={createErrors.departmentId?.message}
                        disabled={submitting}
                        sx={selectFieldSx}
                        SelectProps={{ MenuProps: selectMenuProps }}
                      >
                        <MenuItem value="">None</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />

                  <Controller
                    name="managerId"
                    control={createControl}
                    render={({ field }) => (
                      <Autocomplete
                        options={managers}
                        getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                        value={managers.find(m => m.id === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue?.id || undefined);
                        }}
                        disabled={submitting}
                        size="small"
                        componentsProps={{
                          paper: {
                            sx: {
                              bgcolor: 'var(--surface)',
                              border: '1px solid var(--border)',
                            },
                          },
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Manager"
                            error={!!createErrors.managerId}
                            helperText={createErrors.managerId?.message}
                            placeholder="Search manager..."
                            sx={{
                              ...textFieldSx,
                              '& .MuiAutocomplete-popupIndicator': { color: 'var(--text-secondary)' },
                              '& .MuiAutocomplete-clearIndicator': { color: 'var(--text-secondary)' },
                            }}
                          />
                        )}
                        renderOption={({ key, ...props }, option) => (
                          <Box component="li" key={key} {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'var(--text-primary)', '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: getRoleColor(option.role), fontSize: 14 }}>
                              {option.firstName[0]}{option.lastName[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500} sx={{ color: 'var(--text-primary)' }}>
                                {option.firstName} {option.lastName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                {option.email}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                      />
                    )}
                  />

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Identity Documents
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <TextField
                    fullWidth
                    size="small"
                    label="PAN Number"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    disabled={submitting}
                    inputProps={{ maxLength: 10 }}
                    placeholder="ABCDE1234F"
                    sx={{
                      ...textFieldSx,
                      '& .MuiOutlinedInput-input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Aadhar Number"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
                    disabled={submitting}
                    inputProps={{ maxLength: 12 }}
                    placeholder="123456789012"
                    sx={{
                      ...textFieldSx,
                      '& .MuiOutlinedInput-input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
                    }}
                  />

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Custom Fields
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  {customFields.map((field, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        size="small"
                        label="Field Name"
                        value={field.fieldName}
                        onChange={(e) => {
                          const updated = [...customFields];
                          updated[index].fieldName = e.target.value;
                          setCustomFields(updated);
                        }}
                        disabled={submitting}
                        sx={{ flex: 1, ...textFieldSx }}
                      />
                      <TextField
                        size="small"
                        label="Field Value"
                        value={field.fieldValue}
                        onChange={(e) => {
                          const updated = [...customFields];
                          updated[index].fieldValue = e.target.value;
                          setCustomFields(updated);
                        }}
                        disabled={submitting}
                        sx={{ flex: 1, ...textFieldSx }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCustomFields(customFields.filter((_, i) => i !== index));
                        }}
                        disabled={submitting}
                        sx={{ color: '#EF4444', mt: 0.5 }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setCustomFields([...customFields, { fieldName: '', fieldValue: '' }])}
                    disabled={submitting}
                    sx={{ alignSelf: 'flex-start', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                  >
                    Add Custom Field
                  </Button>

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Document Links
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  {documentLinks.map((doc, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        p: 1.5,
                        bgcolor: 'var(--bg-elevated)',
                        borderRadius: 1,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Document Title"
                          value={doc.linkTitle}
                          onChange={(e) => {
                            const updated = [...documentLinks];
                            updated[index].linkTitle = e.target.value;
                            setDocumentLinks(updated);
                          }}
                          placeholder="e.g., Passport, Aadhar Card"
                          disabled={submitting}
                          sx={textFieldSx}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Document URL"
                          value={doc.linkUrl}
                          onChange={(e) => {
                            const updated = [...documentLinks];
                            updated[index].linkUrl = e.target.value;
                            setDocumentLinks(updated);
                          }}
                          placeholder="https://drive.google.com/..."
                          disabled={submitting}
                          sx={textFieldSx}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setDocumentLinks(documentLinks.filter((_, i) => i !== index))}
                        disabled={submitting}
                        sx={{ color: '#EF4444', mt: 0.5 }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setDocumentLinks([...documentLinks, { linkTitle: '', linkUrl: '' }])}
                    disabled={submitting}
                    sx={{ alignSelf: 'flex-start', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                  >
                    Add Document Link
                  </Button>
                </Box>
              </form>
            )}

            {/* Edit Mode Form */}
            {isEditMode && selectedEmployee && (
              <form id="employee-form" onSubmit={handleEditSubmit(handleUpdateEmployee)}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Profile Header in Edit Mode */}
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Avatar
                      src={selectedEmployee.profileImageUrl ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${selectedEmployee.profileImageUrl}` : undefined}
                      sx={{ width: 64, height: 64, bgcolor: getRoleColor(selectedEmployee.role) }}
                    >
                      {selectedEmployee.firstName[0]}{selectedEmployee.lastName?.[0] || ''}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                        Editing Employee
                      </Typography>
                      <Chip
                        label={selectedEmployee.role.charAt(0).toUpperCase() + selectedEmployee.role.slice(1)}
                        size="small"
                        sx={{
                          bgcolor: getRoleColor(selectedEmployee.role) + '20',
                          color: getRoleColor(selectedEmployee.role),
                          fontWeight: 500,
                          mt: 0.5,
                        }}
                      />
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Profile Photo
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <TextField
                    fullWidth
                    size="small"
                    label="Profile Image URL"
                    value={editProfileImageUrl}
                    onChange={(e) => setEditProfileImageUrl(e.target.value)}
                    placeholder="https://example.com/profile-image.jpg"
                    disabled={submitting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'var(--bg-elevated)',
                        '& fieldset': { borderColor: 'var(--border)' },
                        '&:hover fieldset': { borderColor: 'var(--accent-primary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputBase-input': { color: 'var(--text-primary)' },
                    }}
                  />
                  {editProfileImageUrl && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar src={editProfileImageUrl} sx={{ width: 40, height: 40 }} />
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        Preview
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Account Credentials
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <Controller
                    name="email"
                    control={editControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Email"
                        type="email"
                        error={!!editErrors.email}
                        helperText={editErrors.email?.message}
                        disabled={submitting}
                        sx={textFieldSx}
                      />
                    )}
                  />

                  <Controller
                    name="password"
                    control={editControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="New Password"
                        type="password"
                        placeholder="Leave blank to keep current password"
                        error={!!editErrors.password}
                        helperText={editErrors.password?.message || 'Leave blank to keep current password'}
                        disabled={submitting}
                        sx={{
                          ...textFieldSx,
                          '& .MuiOutlinedInput-input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
                        }}
                      />
                    )}
                  />

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Personal Information
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Controller
                        name="firstName"
                        control={editControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            label="First Name"
                            error={!!editErrors.firstName}
                            helperText={editErrors.firstName?.message}
                            disabled={submitting}
                            sx={textFieldSx}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="lastName"
                        control={editControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            label="Last Name"
                            error={!!editErrors.lastName}
                            helperText={editErrors.lastName?.message}
                            disabled={submitting}
                            sx={textFieldSx}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Controller
                    name="phone"
                    control={editControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Phone"
                        error={!!editErrors.phone}
                        helperText={editErrors.phone?.message}
                        disabled={submitting}
                        sx={textFieldSx}
                      />
                    )}
                  />

                  <Controller
                    name="dateOfBirth"
                    control={editControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Date of Birth"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        error={!!editErrors.dateOfBirth}
                        helperText={editErrors.dateOfBirth?.message}
                        disabled={submitting}
                        sx={dateFieldSx}
                      />
                    )}
                  />

                  <Controller
                    name="address"
                    control={editControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Address"
                        multiline
                        rows={2}
                        error={!!editErrors.address}
                        helperText={editErrors.address?.message}
                        disabled={submitting}
                        sx={textFieldSx}
                      />
                    )}
                  />

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Emergency Contact
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <TextField
                    fullWidth
                    size="small"
                    label="Emergency Contact Name"
                    value={editEmergencyContactName}
                    onChange={(e) => setEditEmergencyContactName(e.target.value)}
                    disabled={submitting}
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Emergency Contact Phone"
                    value={editEmergencyContactPhone}
                    onChange={(e) => setEditEmergencyContactPhone(e.target.value)}
                    disabled={submitting}
                    sx={textFieldSx}
                  />

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Employment Details
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <Controller
                    name="dateOfJoining"
                    control={editControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Date of Joining"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        error={!!editErrors.dateOfJoining}
                        helperText={editErrors.dateOfJoining?.message}
                        disabled={submitting}
                        sx={dateFieldSx}
                      />
                    )}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Controller
                        name="role"
                        control={editControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            size="small"
                            label="Role"
                            error={!!editErrors.role}
                            helperText={editErrors.role?.message}
                            disabled={submitting}
                            sx={selectFieldSx}
                            SelectProps={{ MenuProps: selectMenuProps }}
                          >
                            <MenuItem value="employee">Employee</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </TextField>
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="status"
                        control={editControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            size="small"
                            label="Status"
                            error={!!editErrors.status}
                            helperText={editErrors.status?.message}
                            disabled={submitting}
                            sx={selectFieldSx}
                            SelectProps={{ MenuProps: selectMenuProps }}
                          >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="on_leave">On Leave</MenuItem>
                            <MenuItem value="terminated">Terminated</MenuItem>
                          </TextField>
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Controller
                    name="departmentId"
                    control={editControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        size="small"
                        label="Department"
                        error={!!editErrors.departmentId}
                        helperText={editErrors.departmentId?.message}
                        disabled={submitting}
                        sx={selectFieldSx}
                        SelectProps={{ MenuProps: selectMenuProps }}
                      >
                        <MenuItem value="">None</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />

                  <Controller
                    name="managerId"
                    control={editControl}
                    render={({ field }) => (
                      <Autocomplete
                        options={managers.filter(m => m.id !== selectedEmployee?.id)}
                        getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                        value={managers.find(m => m.id === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue?.id || undefined);
                        }}
                        disabled={submitting}
                        size="small"
                        componentsProps={{
                          paper: {
                            sx: {
                              bgcolor: 'var(--surface)',
                              border: '1px solid var(--border)',
                            },
                          },
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Manager"
                            error={!!editErrors.managerId}
                            helperText={editErrors.managerId?.message}
                            placeholder="Search manager..."
                            sx={{
                              ...textFieldSx,
                              '& .MuiAutocomplete-popupIndicator': { color: 'var(--text-secondary)' },
                              '& .MuiAutocomplete-clearIndicator': { color: 'var(--text-secondary)' },
                            }}
                          />
                        )}
                        renderOption={({ key, ...props }, option) => (
                          <Box component="li" key={key} {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'var(--text-primary)', '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: getRoleColor(option.role), fontSize: 14 }}>
                              {option.firstName[0]}{option.lastName[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500} sx={{ color: 'var(--text-primary)' }}>
                                {option.firstName} {option.lastName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                {option.email}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                      />
                    )}
                  />

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Identity Documents
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  <Controller
                    name="panNumber"
                    control={editControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="PAN Number"
                        placeholder="ABCDE1234F"
                        inputProps={{ maxLength: 10 }}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        error={!!editErrors.panNumber}
                        helperText={editErrors.panNumber?.message}
                        disabled={submitting}
                        sx={{
                          ...textFieldSx,
                          '& .MuiOutlinedInput-input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
                        }}
                      />
                    )}
                  />

                  <Controller
                    name="aadharNumber"
                    control={editControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Aadhar Number"
                        placeholder="123456789012"
                        inputProps={{ maxLength: 12 }}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                        error={!!editErrors.aadharNumber}
                        helperText={editErrors.aadharNumber?.message}
                        disabled={submitting}
                        sx={{
                          ...textFieldSx,
                          '& .MuiOutlinedInput-input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
                        }}
                      />
                    )}
                  />

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Custom Fields
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  {editCustomFields.map((field, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        size="small"
                        label="Field Name"
                        value={field.fieldName}
                        onChange={(e) => {
                          const updated = [...editCustomFields];
                          updated[index].fieldName = e.target.value;
                          setEditCustomFields(updated);
                        }}
                        disabled={submitting}
                        sx={{ flex: 1, ...textFieldSx }}
                      />
                      <TextField
                        size="small"
                        label="Field Value"
                        value={field.fieldValue}
                        onChange={(e) => {
                          const updated = [...editCustomFields];
                          updated[index].fieldValue = e.target.value;
                          setEditCustomFields(updated);
                        }}
                        disabled={submitting}
                        sx={{ flex: 1, ...textFieldSx }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditCustomFields(editCustomFields.filter((_, i) => i !== index));
                        }}
                        disabled={submitting}
                        sx={{ color: '#EF4444', mt: 0.5 }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setEditCustomFields([...editCustomFields, { fieldName: '', fieldValue: '' }])}
                    disabled={submitting}
                    sx={{ alignSelf: 'flex-start', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                  >
                    Add Custom Field
                  </Button>

                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                    Document Links
                  </Typography>
                  <Divider sx={{ borderColor: 'var(--border)' }} />

                  {editDocumentLinks.map((doc, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        p: 1.5,
                        bgcolor: 'var(--bg-elevated)',
                        borderRadius: 1,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Document Title"
                          value={doc.linkTitle}
                          onChange={(e) => {
                            const updated = [...editDocumentLinks];
                            updated[index].linkTitle = e.target.value;
                            setEditDocumentLinks(updated);
                          }}
                          placeholder="e.g., Passport, Aadhar Card"
                          disabled={submitting}
                          sx={textFieldSx}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Document URL"
                          value={doc.linkUrl}
                          onChange={(e) => {
                            const updated = [...editDocumentLinks];
                            updated[index].linkUrl = e.target.value;
                            setEditDocumentLinks(updated);
                          }}
                          placeholder="https://drive.google.com/..."
                          disabled={submitting}
                          sx={textFieldSx}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setEditDocumentLinks(editDocumentLinks.filter((_, i) => i !== index))}
                        disabled={submitting}
                        sx={{ color: '#EF4444', mt: 0.5 }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setEditDocumentLinks([...editDocumentLinks, { linkTitle: '', linkUrl: '' }])}
                    disabled={submitting}
                    sx={{ alignSelf: 'flex-start', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                  >
                    Add Document Link
                  </Button>
                </Box>
              </form>
            )}
          </Box>

          {/* Footer Actions */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              p: 2,
              borderTop: '1px solid var(--border)',
              bgcolor: 'var(--bg-elevated)',
            }}
          >
            {isViewMode && (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Badge />}
                  onClick={() => selectedEmployee && handleDownloadIdCard(selectedEmployee)}
                  sx={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                >
                  Download ID
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={switchToEditMode}
                  sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
                >
                  Edit
                </Button>
              </>
            )}
            {(isAddMode || isEditMode) && (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={closeDrawer}
                  disabled={submitting}
                  sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  type="submit"
                  form="employee-form"
                  variant="contained"
                  disabled={submitting}
                  sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
                >
                  {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : (isAddMode ? 'Create Employee' : 'Update Employee')}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default EmployeesPage;
