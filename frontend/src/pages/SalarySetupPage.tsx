import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Pagination,
  InputAdornment,
  CircularProgress,
  Grid,
  Drawer,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { payrollService } from '../services/payroll.service';
import { EmployeeSalaryDetail, CreateSalaryDetailRequest, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

const SalarySetupPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [salaryDetails, setSalaryDetails] = useState<EmployeeSalaryDetail[]>([]);
  const [employeesWithoutSalary, setEmployeesWithoutSalary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<EmployeeSalaryDetail | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateSalaryDetailRequest>({
    userId: 0,
    employeeCode: '',
    panNumber: '',
    bankAccountNumber: '',
    bankName: '',
    bankIfscCode: '',
    bankBranch: '',
    pfAccountNumber: '',
    uanNumber: '',
    esiNumber: '',
    basicSalary: 0,
    hraPercentage: 40,
    transportAllowance: 1600,
    otherAllowances: 0,
    pfApplicable: true,
    esiApplicable: false,
    professionalTax: 200,
    taxRegime: 'old',
  });

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      toast.error('Access denied. Admin only.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch salary details
  const fetchSalaryDetails = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getAllSalaryDetails({
        page,
        limit: 10,
        search: searchTerm || undefined,
        department: selectedDepartment || undefined,
      });
      setSalaryDetails(response.items);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch salary details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees without salary
  const fetchEmployeesWithoutSalary = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getEmployeesWithoutSalary({
        page,
        limit: 10,
        search: searchTerm || undefined,
        department: selectedDepartment || undefined,
      });
      setEmployeesWithoutSalary(response.items);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchSalaryDetails();
    } else {
      fetchEmployeesWithoutSalary();
    }
  }, [page, searchTerm, selectedDepartment, activeTab]);

  const handleOpenDialog = (salary?: EmployeeSalaryDetail, employeeId?: number) => {
    if (salary) {
      setSelectedSalary(salary);
      setFormData({
        userId: salary.userId,
        employeeCode: salary.employeeCode || '',
        panNumber: salary.panNumber || '',
        bankAccountNumber: salary.bankAccountNumber || '',
        bankName: salary.bankName || '',
        bankIfscCode: salary.bankIfscCode || '',
        bankBranch: salary.bankBranch || '',
        pfAccountNumber: salary.pfAccountNumber || '',
        uanNumber: salary.uanNumber || '',
        esiNumber: salary.esiNumber || '',
        basicSalary: salary.basicSalary,
        hraPercentage: salary.hraPercentage,
        transportAllowance: salary.transportAllowance,
        otherAllowances: salary.otherAllowances,
        pfApplicable: salary.pfApplicable,
        esiApplicable: salary.esiApplicable,
        professionalTax: salary.professionalTax,
        taxRegime: salary.taxRegime,
      });
    } else if (employeeId) {
      setSelectedSalary(null);
      setFormData({
        ...formData,
        userId: employeeId,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSalary(null);
    setFormData({
      userId: 0,
      employeeCode: '',
      panNumber: '',
      bankAccountNumber: '',
      bankName: '',
      bankIfscCode: '',
      bankBranch: '',
      pfAccountNumber: '',
      uanNumber: '',
      esiNumber: '',
      basicSalary: 0,
      hraPercentage: 40,
      transportAllowance: 1600,
      otherAllowances: 0,
      pfApplicable: true,
      esiApplicable: false,
      professionalTax: 200,
      taxRegime: 'old',
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (selectedSalary) {
        await payrollService.updateSalaryDetails(selectedSalary.userId, formData);
        toast.success('Salary details updated successfully');
      } else {
        await payrollService.createSalaryDetails(formData);
        toast.success('Salary details created successfully');
      }
      handleCloseDialog();
      if (activeTab === 0) {
        fetchSalaryDetails();
      } else {
        fetchEmployeesWithoutSalary();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save salary details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setLoading(true);
      await payrollService.deleteSalaryDetails(deleteId);
      toast.success('Salary details deleted successfully');
      setOpenDeleteDialog(false);
      setDeleteId(null);
      fetchSalaryDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete salary details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateGrossSalary = () => {
    const hra = (formData.basicSalary * formData.hraPercentage!) / 100;
    const gross = formData.basicSalary + hra + formData.transportAllowance! + formData.otherAllowances!;
    return gross;
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          Salary Setup & Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/payroll')}
          sx={{
            bgcolor: 'var(--accent-primary)',
            '&:hover': { bgcolor: 'var(--accent-hover)' },
          }}
        >
          View Payroll
        </Button>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setPage(1);
          }}
          sx={{
            '& .MuiTab-root': { color: 'var(--text-secondary)' },
            '& .Mui-selected': { color: 'var(--accent-primary)' },
            '& .MuiTabs-indicator': { bgcolor: 'var(--accent-primary)' },
          }}
        >
          <Tab label="Employees with Salary Setup" />
          <Tab label="Employees without Salary Setup" />
        </Tabs>
      </Card>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or employee code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'var(--text-secondary)' }} />
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
                  '& .MuiInputBase-input::placeholder': { color: 'var(--text-secondary)', opacity: 1 },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'var(--text-secondary)' }}>Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setPage(1);
                  }}
                  label="Department"
                  sx={{
                    color: 'var(--text-primary)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-secondary)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--accent-primary)' },
                    '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
                  }}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  <MenuItem value="Engineering">Engineering</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
        </Box>
      ) : (
        <>
          <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <TableContainer component={Paper} sx={{ bgcolor: 'var(--surface)', backgroundImage: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderColor: 'var(--border)' }}>
                      Employee
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderColor: 'var(--border)' }}>
                      Department
                    </TableCell>
                    {activeTab === 0 ? (
                      <>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderColor: 'var(--border)' }}>
                          Employee Code
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderColor: 'var(--border)' }}>
                          Basic Salary
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderColor: 'var(--border)' }}>
                          Gross Salary
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderColor: 'var(--border)' }}>
                          Tax Regime
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderColor: 'var(--border)' }}>
                          PF/ESI
                        </TableCell>
                      </>
                    ) : (
                      <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderColor: 'var(--border)' }}>
                        Email
                      </TableCell>
                    )}
                    <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderColor: 'var(--border)' }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeTab === 0 ? (
                    salaryDetails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ color: 'var(--text-secondary)', py: 4, borderColor: 'var(--border)' }}>
                          No salary details found
                        </TableCell>
                      </TableRow>
                    ) : (
                      salaryDetails.map((salary) => {
                        const basicSalary = Number(salary.basicSalary) || 0;
                        const hraPercentage = Number(salary.hraPercentage) || 0;
                        const transportAllowance = Number(salary.transportAllowance) || 0;
                        const otherAllowances = Number(salary.otherAllowances) || 0;

                        const hra = (basicSalary * hraPercentage) / 100;
                        const grossSalary = basicSalary + hra + transportAllowance + otherAllowances;

                        return (
                          <TableRow key={salary.id} sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                            <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                  {salary.user?.firstName && salary.user?.lastName
                                    ? `${salary.user.firstName} ${salary.user.lastName}`
                                    : 'Unknown'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                  ID: {salary.userId}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                              {salary.user?.department?.name || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                              {salary.employeeCode || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                              {formatCurrency(salary.basicSalary)}
                            </TableCell>
                            <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                              {formatCurrency(grossSalary)}
                            </TableCell>
                            <TableCell sx={{ borderColor: 'var(--border)' }}>
                              <Chip
                                label={salary.taxRegime === 'old' ? 'Old Regime' : 'New Regime'}
                                size="small"
                                sx={{
                                  bgcolor: salary.taxRegime === 'old' ? '#3b82f6' : '#10b981',
                                  color: '#ffffff',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderColor: 'var(--border)' }}>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {salary.pfApplicable && (
                                  <Chip label="PF" size="small" sx={{ bgcolor: '#6366f1', color: '#ffffff' }} />
                                )}
                                {salary.esiApplicable && (
                                  <Chip label="ESI" size="small" sx={{ bgcolor: '#8b5cf6', color: '#ffffff' }} />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ borderColor: 'var(--border)' }} align="right">
                              <IconButton
                                onClick={() => handleOpenDialog(salary)}
                                sx={{ color: 'var(--text-secondary)' }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                onClick={() => {
                                  setDeleteId(salary.userId);
                                  setOpenDeleteDialog(true);
                                }}
                                sx={{ color: 'var(--text-secondary)' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  ) : (
                    employeesWithoutSalary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: 'var(--text-secondary)', py: 4, borderColor: 'var(--border)' }}>
                          All employees have salary setup
                        </TableCell>
                      </TableRow>
                    ) : (
                      employeesWithoutSalary.map((employee) => (
                        <TableRow key={employee.id} sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                          <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {employee.fullName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                ID: {employee.id}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                            {employee.department?.name || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                            {employee.email}
                          </TableCell>
                          <TableCell sx={{ borderColor: 'var(--border)' }} align="right">
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PersonAddIcon />}
                              onClick={() => handleOpenDialog(undefined, employee.id)}
                              sx={{
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' },
                              }}
                            >
                              Setup Salary
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                sx={{
                  '& .MuiPaginationItem-root': { color: 'var(--text-secondary)' },
                  '& .Mui-selected': { bgcolor: 'var(--accent-primary)', color: '#ffffff' },
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* Salary Form Drawer */}
      <Drawer
        anchor="right"
        open={openDialog}
        onClose={() => !loading && handleCloseDialog()}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500 },
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
              {selectedSalary ? 'Edit Salary Details' : 'Add Salary Details'}
            </Typography>
            <IconButton
              onClick={() => !loading && handleCloseDialog()}
              size="small"
              sx={{ color: 'var(--text-secondary)' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Employee Details */}
              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                Employee Details
              </Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Employee Code"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="PAN Number"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    disabled={loading}
                  />
                </Grid>
              </Grid>

              {/* Salary Components */}
              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600, mt: 1 }}>
                Salary Components
              </Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    type="number"
                    label="Basic Salary"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="HRA Percentage"
                    value={formData.hraPercentage}
                    onChange={(e) => setFormData({ ...formData, hraPercentage: parseFloat(e.target.value) || 0 })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Transport Allowance"
                    value={formData.transportAllowance}
                    onChange={(e) => setFormData({ ...formData, transportAllowance: parseFloat(e.target.value) || 0 })}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Other Allowances"
                    value={formData.otherAllowances}
                    onChange={(e) => setFormData({ ...formData, otherAllowances: parseFloat(e.target.value) || 0 })}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
              <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', p: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 500 }}>
                  Estimated Gross Salary: {formatCurrency(calculateGrossSalary())}
                </Typography>
              </Card>

              {/* Bank Details */}
              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600, mt: 1 }}>
                Bank Details
              </Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bank Account Number"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bank Name"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="IFSC Code"
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value.toUpperCase() })}
                    placeholder="ABCD0123456"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bank Branch"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    disabled={loading}
                  />
                </Grid>
              </Grid>

              {/* Statutory Details */}
              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600, mt: 1 }}>
                Statutory Details
              </Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="PF Account Number"
                    value={formData.pfAccountNumber}
                    onChange={(e) => setFormData({ ...formData, pfAccountNumber: e.target.value })}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="UAN Number"
                    value={formData.uanNumber}
                    onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ESI Number"
                    value={formData.esiNumber}
                    onChange={(e) => setFormData({ ...formData, esiNumber: e.target.value })}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Professional Tax"
                    value={formData.professionalTax}
                    onChange={(e) => setFormData({ ...formData, professionalTax: parseFloat(e.target.value) || 0 })}
                    disabled={loading}
                  />
                </Grid>
              </Grid>

              {/* Tax & Deductions */}
              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600, mt: 1 }}>
                Tax & Deductions
              </Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'var(--text-secondary)' }}>Tax Regime</InputLabel>
                <Select
                  value={formData.taxRegime}
                  onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value as 'old' | 'new' })}
                  label="Tax Regime"
                  disabled={loading}
                  sx={{
                    color: 'var(--text-primary)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-secondary)' },
                    '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
                  }}
                  MenuProps={{
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
                  }}
                >
                  <MenuItem value="old">Old Regime</MenuItem>
                  <MenuItem value="new">New Regime</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.pfApplicable}
                      onChange={(e) => setFormData({ ...formData, pfApplicable: e.target.checked })}
                      disabled={loading}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--accent-primary)' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'var(--accent-primary)' },
                      }}
                    />
                  }
                  label="PF Applicable"
                  sx={{ color: 'var(--text-secondary)' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.esiApplicable}
                      onChange={(e) => setFormData({ ...formData, esiApplicable: e.target.checked })}
                      disabled={loading}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--accent-primary)' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'var(--accent-primary)' },
                      }}
                    />
                  }
                  label="ESI Applicable"
                  sx={{ color: 'var(--text-secondary)' }}
                />
              </Box>
            </Box>
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
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseDialog}
              disabled={loading}
              sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || formData.basicSalary <= 0}
              sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
            >
              {loading ? <CircularProgress size={24} /> : selectedSalary ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete this salary setup? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border)', p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} sx={{ color: 'var(--text-secondary)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalarySetupPage;
