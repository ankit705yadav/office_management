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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Chip,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Download,
  Visibility,
  Settings,
  Payment,
  TrendingUp,
  People,
  AttachMoney,
  Add,
  Check,
  Close,
  Cancel,
  AccountBalance,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { payrollService } from '@/services/payroll.service';
import { advanceSalaryService } from '@/services/advanceSalary.service';
import type { Payroll, PayrollSummary, AdvanceSalaryRequest, AdvanceSalaryStatus, AdvanceSalarySummary } from '@/types';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const getCurrentMonth = () => new Date().getMonth() + 1;
const getCurrentYear = () => new Date().getFullYear();

const formatCurrency = (amount: number | undefined | null) => {
  const value = amount ?? 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return { bg: '#fef3c7', text: '#d97706' };
    case 'approved':
      return { bg: '#d1fae5', text: '#059669' };
    case 'rejected':
      return { bg: '#fee2e2', text: '#dc2626' };
    case 'disbursed':
      return { bg: '#dbeafe', text: '#2563eb' };
    case 'cancelled':
      return { bg: '#f3f4f6', text: '#6b7280' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280' };
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payroll-tabpanel-${index}`}
      aria-labelledby={`payroll-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Payroll state
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Advance Salary state
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceSalaryRequest[]>([]);
  const [advanceSummary, setAdvanceSummary] = useState<AdvanceSalarySummary | null>(null);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<AdvanceSalaryRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'disburse'>('approve');
  const [actionComments, setActionComments] = useState('');
  const [newAdvanceRequest, setNewAdvanceRequest] = useState({
    amount: '',
    reason: '',
    requestedForMonth: getCurrentMonth(),
    requestedForYear: getCurrentYear(),
  });

  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  const currentYear = getCurrentYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (activeTab === 0) {
      fetchPayrollData();
    } else {
      fetchAdvanceData();
    }
  }, [selectedMonth, selectedYear, activeTab]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        const response = await payrollService.getPayrollRecords({
          month: selectedMonth,
          year: selectedYear,
          limit: 100,
        });
        setPayrolls(response?.items || []);

        const summaryData = await payrollService.getPayrollSummary({
          month: selectedMonth,
          year: selectedYear,
        });
        setSummary(summaryData);
      } else {
        const myPayslips = await payrollService.getMyPayslips({
          year: selectedYear,
        });
        setPayrolls(myPayslips || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch payroll data');
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvanceData = async () => {
    try {
      setAdvanceLoading(true);

      if (isManagerOrAdmin) {
        const response = await advanceSalaryService.getAllAdvanceRequests({
          page: 1,
          limit: 100,
        });
        setAdvanceRequests(response?.items || []);

        const summaryData = await advanceSalaryService.getSummary();
        setAdvanceSummary(summaryData);
      } else {
        const myRequests = await advanceSalaryService.getMyAdvanceRequests();
        setAdvanceRequests(myRequests || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch advance salary data');
      setAdvanceRequests([]);
    } finally {
      setAdvanceLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setGenerating(true);
      const result = await payrollService.generatePayroll({
        month: selectedMonth,
        year: selectedYear,
        sendEmails: true,
      });

      if (result.success.length === 0 && result.failed.length > 0) {
        const reasons = result.failed.map((f: any) => f.reason).join(', ');
        toast.warning(
          `No payroll generated. ${result.failed.length} employee(s) failed: ${reasons}`
        );
      } else if (result.success.length > 0 && result.failed.length > 0) {
        toast.info(
          `Payroll generated for ${result.success.length} employee(s). ${result.failed.length} failed (check details).`
        );
      } else if (result.success.length > 0) {
        toast.success(
          `Payroll generated successfully for ${result.success.length} employee(s)!`
        );
      } else {
        toast.warning('No employees found to process.');
      }

      setGenerateDialogOpen(false);
      fetchPayrollData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPayslip = async (payrollId: number) => {
    try {
      const blob = await payrollService.downloadPayslip(payrollId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payslip_${selectedMonth}_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Payslip downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download payslip');
    }
  };

  const handleViewDetails = async (payrollId: number) => {
    try {
      const payroll = await payrollService.getPayrollById(payrollId);
      setSelectedPayroll(payroll);
      setViewDialogOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch payroll details');
    }
  };

  const handleRequestAdvance = async () => {
    try {
      if (!newAdvanceRequest.amount || !newAdvanceRequest.reason) {
        toast.error('Please fill in all required fields');
        return;
      }

      await advanceSalaryService.requestAdvance({
        amount: parseFloat(newAdvanceRequest.amount),
        reason: newAdvanceRequest.reason,
        requestedForMonth: newAdvanceRequest.requestedForMonth,
        requestedForYear: newAdvanceRequest.requestedForYear,
      });

      toast.success('Advance salary request submitted successfully');
      setRequestDialogOpen(false);
      setNewAdvanceRequest({
        amount: '',
        reason: '',
        requestedForMonth: getCurrentMonth(),
        requestedForYear: getCurrentYear(),
      });
      fetchAdvanceData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleAdvanceAction = async () => {
    if (!selectedAdvance) return;

    try {
      if (actionType === 'approve') {
        await advanceSalaryService.approveAdvance(selectedAdvance.id, actionComments);
        toast.success('Request approved successfully');
      } else if (actionType === 'reject') {
        await advanceSalaryService.rejectAdvance(selectedAdvance.id, actionComments);
        toast.success('Request rejected');
      } else if (actionType === 'disburse') {
        await advanceSalaryService.markAsDisbursed(selectedAdvance.id);
        toast.success('Marked as disbursed');
      }

      setActionDialogOpen(false);
      setSelectedAdvance(null);
      setActionComments('');
      fetchAdvanceData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleCancelAdvance = async (id: number) => {
    try {
      await advanceSalaryService.cancelAdvanceRequest(id);
      toast.success('Request cancelled');
      fetchAdvanceData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const openActionDialog = (advance: AdvanceSalaryRequest, type: 'approve' | 'reject' | 'disburse') => {
    setSelectedAdvance(advance);
    setActionType(type);
    setActionComments('');
    setActionDialogOpen(true);
  };

  const getMonthLabel = (month: number) => {
    return MONTHS.find((m) => m.value === month)?.label || '';
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'var(--text-primary)', mb: 1, fontWeight: 600 }}>
          Payroll Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          {isAdmin
            ? 'Manage employee payroll, generate payslips, and handle advance salary requests'
            : 'View your salary slips and request salary advances'}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'var(--border)', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'var(--text-secondary)',
              '&.Mui-selected': { color: 'var(--accent-primary)' },
            },
            '& .MuiTabs-indicator': { bgcolor: 'var(--accent-primary)' },
          }}
        >
          <Tab label="Payroll" icon={<Payment />} iconPosition="start" />
          <Tab label="Advance Requests" icon={<AccountBalance />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Payroll Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* Summary Cards - Admin Only */}
        {isAdmin && summary && (
          <Grid container spacing={3} sx={{ mb: 4, alignItems: 'stretch' }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                        Total Gross
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {formatCurrency(summary.totalGrossSalary)}
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ color: '#10b981', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                        Total Deductions
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {formatCurrency(summary.totalDeductions)}
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ color: '#f59e0b', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                        Total Net Pay
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {formatCurrency(summary.totalNetSalary)}
                      </Typography>
                    </Box>
                    <Payment sx={{ color: '#3b82f6', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                        Employees
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {summary.employeeCount || 0}
                      </Typography>
                    </Box>
                    <People sx={{ color: '#8b5cf6', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters and Actions */}
        <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel sx={{ color: 'var(--text-secondary)' }}>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  label="Month"
                  sx={{
                    color: 'var(--text-primary)',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-secondary)' },
                    '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
                  }}
                >
                  {MONTHS.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: 'var(--text-secondary)' }}>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  label="Year"
                  sx={{
                    color: 'var(--text-primary)',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-secondary)' },
                    '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
                  }}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ flexGrow: 1 }} />

              {isAdmin && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={() => window.location.href = '/salary-setup'}
                    sx={{
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border)',
                      '&:hover': {
                        borderColor: 'var(--text-secondary)',
                        bgcolor: 'var(--bg-elevated)',
                      },
                    }}
                  >
                    Salary Setup
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Payment />}
                    onClick={() => setGenerateDialogOpen(true)}
                    sx={{
                      bgcolor: 'var(--accent-primary)',
                      '&:hover': { bgcolor: 'var(--accent-hover)' },
                    }}
                  >
                    Generate Payroll
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Payroll Table */}
        <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
              </Box>
            ) : payrolls.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
                  No payroll records found for {getMonthLabel(selectedMonth)} {selectedYear}
                </Typography>
                {isAdmin && (
                  <Button
                    variant="contained"
                    startIcon={<Payment />}
                    onClick={() => setGenerateDialogOpen(true)}
                    sx={{
                      mt: 2,
                      bgcolor: 'var(--accent-primary)',
                      '&:hover': { bgcolor: 'var(--accent-hover)' },
                    }}
                  >
                    Generate Payroll
                  </Button>
                )}
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {isAdmin && (
                        <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                          Employee
                        </TableCell>
                      )}
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Period
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Gross Salary
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Deductions
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Net Salary
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Processed
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrolls.map((payroll) => (
                      <TableRow key={payroll.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                        {isAdmin && (
                          <TableCell sx={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                            {payroll.user?.firstName} {payroll.user?.lastName}
                          </TableCell>
                        )}
                        <TableCell sx={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                          {getMonthLabel(payroll.month)} {payroll.year}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                          {formatCurrency(payroll.grossSalary)}
                        </TableCell>
                        <TableCell sx={{ color: '#f59e0b', borderBottom: '1px solid var(--border)' }}>
                          {formatCurrency(payroll.totalDeductions)}
                        </TableCell>
                        <TableCell sx={{ color: '#10b981', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                          {formatCurrency(payroll.netSalary)}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                          {payroll.processedAt
                            ? format(new Date(payroll.processedAt), 'dd MMM yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid var(--border)' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(payroll.id)}
                                sx={{ color: '#3b82f6' }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download Payslip">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadPayslip(payroll.id)}
                                sx={{ color: '#10b981' }}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Advance Requests Tab */}
      <TabPanel value={activeTab} index={1}>
        {/* Summary Cards - Manager/Admin Only */}
        {isManagerOrAdmin && advanceSummary && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                        Pending Requests
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {formatCurrency(advanceSummary.totalPending)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        {advanceSummary.pendingCount} request(s)
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ color: '#f59e0b', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                        Approved (Pending Disbursal)
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {formatCurrency(advanceSummary.totalApproved)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        {advanceSummary.approvedCount} request(s)
                      </Typography>
                    </Box>
                    <Check sx={{ color: '#10b981', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                        Disbursed This Month
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {formatCurrency(advanceSummary.totalDisbursed)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        {advanceSummary.disbursedCount} disbursement(s)
                      </Typography>
                    </Box>
                    <AccountBalance sx={{ color: '#3b82f6', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Request Button */}
        <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
                {isManagerOrAdmin ? 'All Advance Requests' : 'My Advance Requests'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setRequestDialogOpen(true)}
                sx={{
                  bgcolor: 'var(--accent-primary)',
                  '&:hover': { bgcolor: 'var(--accent-hover)' },
                }}
              >
                Request Advance
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Advance Requests Table */}
        <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent>
            {advanceLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
              </Box>
            ) : advanceRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
                  No advance salary requests found
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {isManagerOrAdmin && (
                        <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                          Employee
                        </TableCell>
                      )}
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Amount
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        For Period
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Reason
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Requested On
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {advanceRequests.map((request) => {
                      const statusColor = getStatusColor(request.status);
                      const canApproveReject = isManagerOrAdmin && request.status === 'pending';
                      const canDisburse = isAdmin && request.status === 'approved';
                      const canCancel = request.status === 'pending' && (request.userId === user?.id || isAdmin);

                      return (
                        <TableRow key={request.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                          {isManagerOrAdmin && (
                            <TableCell sx={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                              {request.user?.firstName} {request.user?.lastName}
                            </TableCell>
                          )}
                          <TableCell sx={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                            {formatCurrency(request.amount)}
                          </TableCell>
                          <TableCell sx={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                            {getMonthLabel(request.requestedForMonth)} {request.requestedForYear}
                          </TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', maxWidth: 200 }}>
                            <Tooltip title={request.reason}>
                              <Typography noWrap variant="body2">
                                {request.reason}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid var(--border)' }}>
                            <Chip
                              label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              size="small"
                              sx={{
                                bgcolor: statusColor.bg,
                                color: statusColor.text,
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                            {(() => {
                              const dateStr = request.createdAt || (request as any).created_at;
                              if (dateStr && !isNaN(new Date(dateStr).getTime())) {
                                return format(new Date(dateStr), 'dd MMM yyyy');
                              }
                              return '-';
                            })()}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid var(--border)' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {canApproveReject && (
                                <>
                                  <Tooltip title="Approve">
                                    <IconButton
                                      size="small"
                                      onClick={() => openActionDialog(request, 'approve')}
                                      sx={{ color: '#10b981' }}
                                    >
                                      <Check fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <IconButton
                                      size="small"
                                      onClick={() => openActionDialog(request, 'reject')}
                                      sx={{ color: '#ef4444' }}
                                    >
                                      <Close fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              {canDisburse && (
                                <Tooltip title="Mark as Disbursed">
                                  <IconButton
                                    size="small"
                                    onClick={() => openActionDialog(request, 'disburse')}
                                    sx={{ color: '#3b82f6' }}
                                  >
                                    <AccountBalance fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {canCancel && (
                                <Tooltip title="Cancel Request">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCancelAdvance(request.id)}
                                    sx={{ color: 'var(--text-secondary)' }}
                                  >
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Generate Payroll Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Generate Payroll</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
            Generate payroll for {getMonthLabel(selectedMonth)} {selectedYear}?
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will process salary for all employees with salary details configured and send payslips via email.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setGenerateDialogOpen(false)}
            sx={{ color: 'var(--text-secondary)' }}
            disabled={generating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGeneratePayroll}
            variant="contained"
            disabled={generating}
            sx={{
              bgcolor: 'var(--accent-primary)',
              '&:hover': { bgcolor: 'var(--accent-hover)' },
            }}
          >
            {generating ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Payroll Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Payroll Details</DialogTitle>
        <DialogContent>
          {selectedPayroll && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 2 }}>
                    Employee Information
                  </Typography>
                  {isAdmin && (
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Name: {selectedPayroll.user?.firstName} {selectedPayroll.user?.lastName}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                    Period: {getMonthLabel(selectedPayroll.month)} {selectedPayroll.year}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 2 }}>
                Earnings
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    Basic Salary:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                    {formatCurrency(selectedPayroll.basicSalary)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    HRA:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                    {formatCurrency(selectedPayroll.hra)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    Transport Allowance:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                    {formatCurrency(selectedPayroll.transportAllowance)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    Other Allowances:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                    {formatCurrency(selectedPayroll.otherAllowances)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    Gross Salary:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" sx={{ color: '#10b981', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(selectedPayroll.grossSalary)}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 2 }}>
                Deductions
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    PF:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                    {formatCurrency(selectedPayroll.pfDeduction)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    ESI:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                    {formatCurrency(selectedPayroll.esiDeduction)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    Income Tax:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                    {formatCurrency(selectedPayroll.taxDeduction)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    Professional Tax:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                    {formatCurrency(selectedPayroll.otherDeductions)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    Total Deductions:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" sx={{ color: '#f59e0b', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(selectedPayroll.totalDeductions)}
                  </Typography>
                </Grid>
              </Grid>

              <Box
                sx={{
                  bgcolor: '#10b981',
                  p: 2,
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  Net Salary (Take Home):
                </Typography>
                <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700 }}>
                  {formatCurrency(selectedPayroll.netSalary)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} sx={{ color: 'var(--text-secondary)' }}>
            Close
          </Button>
          {selectedPayroll && (
            <Button
              onClick={() => handleDownloadPayslip(selectedPayroll.id)}
              variant="contained"
              startIcon={<Download />}
              sx={{
                bgcolor: 'var(--accent-primary)',
                '&:hover': { bgcolor: 'var(--accent-hover)' },
              }}
            >
              Download Payslip
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Request Advance Dialog */}
      <Dialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Request Salary Advance</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Amount"
              type="number"
              value={newAdvanceRequest.amount}
              onChange={(e) => setNewAdvanceRequest({ ...newAdvanceRequest, amount: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'var(--text-secondary)' }}>₹</Typography>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'var(--text-primary)',
                  '& fieldset': { borderColor: 'var(--border)' },
                  '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                },
                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'var(--text-secondary)' }}>For Month</InputLabel>
                <Select
                  value={newAdvanceRequest.requestedForMonth}
                  onChange={(e) => setNewAdvanceRequest({ ...newAdvanceRequest, requestedForMonth: Number(e.target.value) })}
                  label="For Month"
                  sx={{
                    color: 'var(--text-primary)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-secondary)' },
                    '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
                  }}
                >
                  {MONTHS.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel sx={{ color: 'var(--text-secondary)' }}>Year</InputLabel>
                <Select
                  value={newAdvanceRequest.requestedForYear}
                  onChange={(e) => setNewAdvanceRequest({ ...newAdvanceRequest, requestedForYear: Number(e.target.value) })}
                  label="Year"
                  sx={{
                    color: 'var(--text-primary)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-secondary)' },
                    '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
                  }}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Reason"
              multiline
              rows={3}
              value={newAdvanceRequest.reason}
              onChange={(e) => setNewAdvanceRequest({ ...newAdvanceRequest, reason: e.target.value })}
              fullWidth
              required
              placeholder="Please provide a reason for your advance salary request"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'var(--text-primary)',
                  '& fieldset': { borderColor: 'var(--border)' },
                  '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                },
                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)} sx={{ color: 'var(--text-secondary)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleRequestAdvance}
            variant="contained"
            sx={{
              bgcolor: 'var(--accent-primary)',
              '&:hover': { bgcolor: 'var(--accent-hover)' },
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve/Reject/Disburse Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>
          {actionType === 'approve' && 'Approve Request'}
          {actionType === 'reject' && 'Reject Request'}
          {actionType === 'disburse' && 'Mark as Disbursed'}
        </DialogTitle>
        <DialogContent>
          {selectedAdvance && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Employee:</strong> {selectedAdvance.user?.firstName} {selectedAdvance.user?.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Amount:</strong> {formatCurrency(selectedAdvance.amount)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                <strong style={{ color: 'var(--text-primary)' }}>For Period:</strong> {getMonthLabel(selectedAdvance.requestedForMonth)} {selectedAdvance.requestedForYear}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Reason:</strong> {selectedAdvance.reason}
              </Typography>

              {(actionType === 'approve' || actionType === 'reject') && (
                <TextField
                  label="Comments (optional)"
                  multiline
                  rows={2}
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'var(--text-primary)',
                      '& fieldset': { borderColor: 'var(--border)' },
                      '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                  }}
                />
              )}

              {actionType === 'disburse' && (
                <Alert severity="info">
                  This will mark the advance salary as disbursed. Make sure the payment has been processed.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)} sx={{ color: 'var(--text-secondary)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAdvanceAction}
            variant="contained"
            sx={{
              bgcolor: actionType === 'reject' ? '#ef4444' : 'var(--accent-primary)',
              '&:hover': { bgcolor: actionType === 'reject' ? '#dc2626' : 'var(--accent-hover)' },
            }}
          >
            {actionType === 'approve' && 'Approve'}
            {actionType === 'reject' && 'Reject'}
            {actionType === 'disburse' && 'Confirm Disbursed'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollPage;
