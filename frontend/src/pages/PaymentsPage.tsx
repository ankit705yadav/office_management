import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Card,
  CardContent,
  CircularProgress,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Check,
  PlayArrow,
  Edit,
  CurrencyRupee,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import {
  paymentService,
  EmployeeSalary,
  Payment,
  PaymentStatus,
} from '@/services/payment.service';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Tab state (admin only)
  const [activeTab, setActiveTab] = useState(0);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Admin: Salary state
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [employeesWithoutSalary, setEmployeesWithoutSalary] = useState<{ id: number; firstName: string; lastName: string; email: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; firstName: string; lastName: string; email: string } | null>(null);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [salarySubmitting, setSalarySubmitting] = useState(false);

  // Admin: Payment state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentFilters, setPaymentFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: '' as PaymentStatus | '',
  });
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [payrollSubmitting, setPayrollSubmitting] = useState(false);

  // Employee: Salary and payments state
  const [mySalary, setMySalary] = useState<EmployeeSalary | null>(null);
  const [myPayments, setMyPayments] = useState<Payment[]>([]);
  const [myPaymentsYear, setMyPaymentsYear] = useState(new Date().getFullYear());

  // Load data on mount
  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else {
      loadEmployeeData();
    }
  }, [isAdmin]);

  // Load payments when filters change
  useEffect(() => {
    if (isAdmin && activeTab === 1) {
      loadPayments();
    }
  }, [paymentFilters, activeTab]);

  // Load employee payments when year changes
  useEffect(() => {
    if (!isAdmin) {
      loadMyPayments();
    }
  }, [myPaymentsYear]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [salariesData, employeesData] = await Promise.all([
        paymentService.getAllSalaries({ limit: 100 }),
        paymentService.getEmployeesWithoutSalary(),
      ]);
      setSalaries(salariesData.salaries);
      setEmployeesWithoutSalary(employeesData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const params: any = { limit: 100 };
      if (paymentFilters.month) params.month = paymentFilters.month;
      if (paymentFilters.year) params.year = paymentFilters.year;
      if (paymentFilters.status) params.status = paymentFilters.status;

      const data = await paymentService.getAllPayments(params);
      setPayments(data.payments);
    } catch (error) {
      toast.error('Failed to load payments');
    }
  };

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      const [salary, paymentsData] = await Promise.all([
        paymentService.getMySalary(),
        paymentService.getMyPayments({ year: myPaymentsYear, limit: 12 }),
      ]);
      setMySalary(salary);
      setMyPayments(paymentsData.payments);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadMyPayments = async () => {
    try {
      const data = await paymentService.getMyPayments({ year: myPaymentsYear, limit: 12 });
      setMyPayments(data.payments);
    } catch (error) {
      toast.error('Failed to load payments');
    }
  };

  // Admin: Set salary
  const handleSetSalary = async () => {
    if (!selectedEmployee || !salaryAmount) {
      toast.error('Please select employee and enter salary');
      return;
    }

    setSalarySubmitting(true);
    try {
      await paymentService.setSalary({
        userId: selectedEmployee.id,
        basicSalary: parseFloat(salaryAmount),
        effectiveFrom,
      });
      toast.success('Salary set successfully');
      setSalaryDialogOpen(false);
      setSelectedEmployee(null);
      setSalaryAmount('');
      loadAdminData();
    } catch (error) {
      toast.error('Failed to set salary');
    } finally {
      setSalarySubmitting(false);
    }
  };

  // Admin: Run payroll
  const handleRunPayroll = async () => {
    setPayrollSubmitting(true);
    try {
      const result = await paymentService.runBulkPayroll({
        month: payrollMonth,
        year: payrollYear,
      });
      toast.success(`Payroll generated for ${result.paymentsCreated} employees`);
      if (result.errors && result.errors.length > 0) {
        toast.warning(`${result.errors.length} errors occurred`);
      }
      setPayrollDialogOpen(false);
      loadPayments();
    } catch (error) {
      toast.error('Failed to run payroll');
    } finally {
      setPayrollSubmitting(false);
    }
  };

  // Admin: Mark payment as paid
  const handleMarkAsPaid = async (paymentId: number) => {
    try {
      await paymentService.updatePayment(paymentId, { status: PaymentStatus.PAID });
      toast.success('Payment marked as paid');
      loadPayments();
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  // Admin: Bulk mark as paid
  const handleBulkMarkAsPaid = async () => {
    if (selectedPayments.length === 0) {
      toast.error('Please select payments to mark as paid');
      return;
    }
    try {
      await paymentService.bulkUpdatePayments(selectedPayments, PaymentStatus.PAID);
      toast.success(`${selectedPayments.length} payments marked as paid`);
      setSelectedPayments([]);
      loadPayments();
    } catch (error) {
      toast.error('Failed to update payments');
    }
  };

  const handleSelectAllPayments = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const pendingIds = payments.filter(p => p.status === PaymentStatus.PENDING).map(p => p.id);
      setSelectedPayments(pendingIds);
    } else {
      setSelectedPayments([]);
    }
  };

  const handleSelectPayment = (paymentId: number) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const getStatusChip = (status: PaymentStatus) => {
    const statusConfig = {
      [PaymentStatus.PENDING]: { color: 'warning' as const, label: 'Pending' },
      [PaymentStatus.PAID]: { color: 'success' as const, label: 'Paid' },
      [PaymentStatus.CANCELLED]: { color: 'error' as const, label: 'Cancelled' },
    };
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Generate year options
  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // ==================== EMPLOYEE VIEW ====================
  if (!isAdmin) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={600} mb={3}>
          My Payments
        </Typography>

        {/* Salary Card */}
        <Card sx={{ mb: 3, maxWidth: 400 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CurrencyRupee color="primary" />
              <Typography variant="h6">My Salary</Typography>
            </Box>
            {mySalary ? (
              <>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {formatCurrency(mySalary.basicSalary)}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Effective from: {formatDate(mySalary.effectiveFrom)}
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">
                Salary not yet configured
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Payment History</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={myPaymentsYear}
              label="Year"
              onChange={(e) => setMyPaymentsYear(e.target.value as number)}
            >
              {yearOptions.map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Paid Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No payment records found
                  </TableCell>
                </TableRow>
              ) : (
                myPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {MONTHS[payment.paymentMonth - 1]} {payment.paymentYear}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getStatusChip(payment.status)}</TableCell>
                    <TableCell>
                      {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // ==================== ADMIN VIEW ====================
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Payment Management
      </Typography>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Salary Setup" />
        <Tab label="Payments" />
      </Tabs>

      {/* ==================== SALARY SETUP TAB ==================== */}
      {activeTab === 0 && (
        <>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setSalaryDialogOpen(true)}
              disabled={employeesWithoutSalary.length === 0}
            >
              Set Salary
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Basic Salary</TableCell>
                  <TableCell>Effective From</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No salary records found
                    </TableCell>
                  </TableRow>
                ) : (
                  salaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell>
                        {salary.user?.firstName} {salary.user?.lastName}
                      </TableCell>
                      <TableCell>{salary.user?.email}</TableCell>
                      <TableCell>{salary.user?.department?.name || '-'}</TableCell>
                      <TableCell align="right">{formatCurrency(salary.basicSalary)}</TableCell>
                      <TableCell>{formatDate(salary.effectiveFrom)}</TableCell>
                      <TableCell>
                        <Tooltip title="Update Salary">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedEmployee({
                                id: salary.userId,
                                firstName: salary.user?.firstName || '',
                                lastName: salary.user?.lastName || '',
                                email: salary.user?.email || '',
                              });
                              setSalaryAmount(salary.basicSalary.toString());
                              setEffectiveFrom(new Date().toISOString().split('T')[0]);
                              setSalaryDialogOpen(true);
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Set Salary Dialog */}
          <Dialog open={salaryDialogOpen} onClose={() => setSalaryDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              {selectedEmployee && salaries.find(s => s.userId === selectedEmployee.id)
                ? 'Update Salary'
                : 'Set Salary'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {!selectedEmployee || !salaries.find(s => s.userId === selectedEmployee.id) ? (
                  <Autocomplete
                    options={employeesWithoutSalary}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                    value={selectedEmployee}
                    onChange={(_, value) => setSelectedEmployee(value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Employee" required />
                    )}
                  />
                ) : (
                  <TextField
                    label="Employee"
                    value={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                    disabled
                  />
                )}
                <TextField
                  label="Basic Salary"
                  type="number"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: <CurrencyRupee fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  label="Effective From"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSalaryDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSetSalary}
                disabled={salarySubmitting}
              >
                {salarySubmitting ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* ==================== PAYMENTS TAB ==================== */}
      {activeTab === 1 && (
        <>
          {/* Filters and Actions */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={paymentFilters.month}
                  label="Month"
                  onChange={(e) => setPaymentFilters(prev => ({ ...prev, month: e.target.value as number }))}
                >
                  {MONTHS.map((m, i) => (
                    <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={paymentFilters.year}
                  label="Year"
                  onChange={(e) => setPaymentFilters(prev => ({ ...prev, year: e.target.value as number }))}
                >
                  {yearOptions.map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={paymentFilters.status}
                  label="Status"
                  onChange={(e) => setPaymentFilters(prev => ({ ...prev, status: e.target.value as PaymentStatus | '' }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={PaymentStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={PaymentStatus.PAID}>Paid</MenuItem>
                  <MenuItem value={PaymentStatus.CANCELLED}>Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              {selectedPayments.length > 0 && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Check />}
                  onClick={handleBulkMarkAsPaid}
                >
                  Mark {selectedPayments.length} as Paid
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => setPayrollDialogOpen(true)}
              >
                Run Payroll
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedPayments.length > 0 &&
                        selectedPayments.length < payments.filter(p => p.status === PaymentStatus.PENDING).length
                      }
                      checked={
                        payments.filter(p => p.status === PaymentStatus.PENDING).length > 0 &&
                        selectedPayments.length === payments.filter(p => p.status === PaymentStatus.PENDING).length
                      }
                      onChange={handleSelectAllPayments}
                    />
                  </TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Month/Year</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Paid Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No payments found for selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell padding="checkbox">
                        {payment.status === PaymentStatus.PENDING && (
                          <Checkbox
                            checked={selectedPayments.includes(payment.id)}
                            onChange={() => handleSelectPayment(payment.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.user?.firstName} {payment.user?.lastName}
                      </TableCell>
                      <TableCell>
                        {MONTHS[payment.paymentMonth - 1]} {payment.paymentYear}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{getStatusChip(payment.status)}</TableCell>
                      <TableCell>
                        {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                      </TableCell>
                      <TableCell>
                        {payment.status === PaymentStatus.PENDING && (
                          <Tooltip title="Mark as Paid">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleMarkAsPaid(payment.id)}
                            >
                              <Check fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Run Payroll Dialog */}
          <Dialog open={payrollDialogOpen} onClose={() => setPayrollDialogOpen(false)}>
            <DialogTitle>Run Payroll</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={payrollMonth}
                    label="Month"
                    onChange={(e) => setPayrollMonth(e.target.value as number)}
                  >
                    {MONTHS.map((m, i) => (
                      <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={payrollYear}
                    label="Year"
                    onChange={(e) => setPayrollYear(e.target.value as number)}
                  >
                    {yearOptions.map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                  This will generate pending payments for all employees with salary setup.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPayrollDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleRunPayroll}
                disabled={payrollSubmitting}
              >
                {payrollSubmitting ? <CircularProgress size={24} /> : 'Run Payroll'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default PaymentsPage;
