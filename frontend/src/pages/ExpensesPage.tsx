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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Drawer,
  Divider,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Cancel,
  Delete,
  FileDownload,
  Receipt,
  History,
  CloudUpload,
  Close,
  QrCode2,
  Print,
  Visibility,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService } from '@/services/expense.service';
import { voucherService } from '@/services/voucher.service';
import { expenseCapService, ExpenseCategoryCap } from '@/services/expenseCap.service';
import type { Expense, CreateExpenseRequest, ExpenseCategory, RequestStatus, ExpenseSummary, Voucher, CreateVoucherRequest } from '@/types';

// Get base URL for uploaded files (strip /api suffix)
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api$/, '');
};

const expenseCategories = [
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

const expenseSchema = yup.object().shape({
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .min(1, 'Amount must be at least 1'),
  category: yup.string().required('Category is required'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
  expenseDate: yup.string().required('Expense date is required'),
});

const voucherSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(3, 'Name must be at least 3 characters'),
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .min(1, 'Amount must be at least 1'),
  region: yup.string().required('Region is required'),
  description: yup.string(),
});

const defaultRegions = ['North', 'South', 'East', 'West', 'Central'];

const getStatusColor = (status: RequestStatus): 'default' | 'warning' | 'success' | 'error' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
};

const getCategoryColor = (category: ExpenseCategory): string => {
  switch (category) {
    case 'travel':
      return '#3B82F6';
    case 'food':
      return '#10B981';
    case 'accommodation':
      return '#8B5CF6';
    case 'office_supplies':
      return '#F59E0B';
    case 'software':
      return '#EC4899';
    case 'hardware':
      return '#6366F1';
    case 'training':
      return '#14B8A6';
    case 'other':
      return '#6B7280';
    default:
      return '#6B7280';
  }
};

const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Voucher state
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [openVoucherDialog, setOpenVoucherDialog] = useState(false);
  const [openVoucherViewDialog, setOpenVoucherViewDialog] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [regions, setRegions] = useState<string[]>(defaultRegions);

  // Expense Caps state
  const [expenseCaps, setExpenseCaps] = useState<ExpenseCategoryCap[]>([]);
  const [openCapDialog, setOpenCapDialog] = useState(false);
  const [selectedCapCategory, setSelectedCapCategory] = useState<string>('');
  const [capAmount, setCapAmount] = useState<string>('');
  const [capIsActive, setCapIsActive] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateExpenseRequest>({
    resolver: yupResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: '',
      description: '',
      expenseDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  // Watch category and amount for cap indicator
  const watchedCategory = watch('category');
  const watchedAmount = watch('amount');

  const {
    control: voucherControl,
    handleSubmit: handleVoucherSubmit,
    formState: { errors: voucherErrors },
    reset: resetVoucher,
  } = useForm<CreateVoucherRequest>({
    resolver: yupResolver(voucherSchema),
    defaultValues: {
      name: '',
      amount: 0,
      region: '',
      description: '',
    },
  });

  useEffect(() => {
    loadExpenses();
    loadSummary();
    loadVouchers();
    loadRegions();
    loadExpenseCaps(); // Load caps for all users to show in submission form
    if (user?.role !== 'employee') {
      loadPendingExpenses();
    }
  }, [user?.role]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getMyExpenses({ limit: 100 });
      setExpenses(response.items);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingExpenses = async () => {
    try {
      const response = await expenseService.getPendingExpenses({ limit: 100 });
      setPendingExpenses(response.items);
    } catch (error) {
      console.error('Failed to load pending expenses:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await expenseService.getExpenseSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load expense summary:', error);
    }
  };

  const loadVouchers = async () => {
    try {
      const response = await voucherService.getAllVouchers({ limit: 100 });
      setVouchers(response.items);
    } catch (error) {
      console.error('Failed to load vouchers:', error);
    }
  };

  const loadRegions = async () => {
    try {
      const regionsData = await voucherService.getRegions();
      setRegions(regionsData);
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  };

  const loadExpenseCaps = async () => {
    try {
      const caps = await expenseCapService.getAllCaps();
      setExpenseCaps(caps);
    } catch (error) {
      console.error('Failed to load expense caps:', error);
    }
  };

  const handleOpenCapDialog = (category: string, currentCap: ExpenseCategoryCap) => {
    setSelectedCapCategory(category);
    setCapAmount(currentCap.capAmount ? currentCap.capAmount.toString() : '');
    setCapIsActive(currentCap.isActive);
    setOpenCapDialog(true);
  };

  const handleSaveCap = async () => {
    if (!selectedCapCategory || !capAmount || parseFloat(capAmount) < 0) {
      toast.error('Please enter a valid cap amount');
      return;
    }

    try {
      setSubmitting(true);
      await expenseCapService.setCapForCategory(selectedCapCategory, parseFloat(capAmount), capIsActive);
      toast.success(`Cap updated for ${selectedCapCategory}`);
      setOpenCapDialog(false);
      loadExpenseCaps();
    } catch (error) {
      toast.error('Failed to update cap');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCap = async (category: string) => {
    if (!window.confirm(`Remove cap for ${category}? Expenses in this category will require manual approval.`)) {
      return;
    }

    try {
      await expenseCapService.removeCapForCategory(category);
      toast.success(`Cap removed for ${category}`);
      loadExpenseCaps();
    } catch (error) {
      toast.error('Failed to remove cap');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await expenseService.exportExpenseReport({});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Expense report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export expense report');
    }
  };

  const handleSubmitExpense = async (data: CreateExpenseRequest) => {
    try {
      setSubmitting(true);
      await expenseService.submitExpense({
        ...data,
        receipt: receiptFile || undefined,
      });
      toast.success('Expense claim submitted successfully');
      setOpenSubmitDialog(false);
      reset();
      setReceiptFile(null);
      loadExpenses();
      loadSummary();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to submit expense claim';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedExpense) return;

    try {
      setSubmitting(true);
      await expenseService.approveExpense(selectedExpense.id, approvalComments);
      toast.success('Expense approved successfully');
      setOpenApproveDialog(false);
      setSelectedExpense(null);
      setApprovalComments('');
      loadExpenses();
      loadPendingExpenses();
      loadSummary();
    } catch (error) {
      toast.error('Failed to approve expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExpense) return;

    if (!approvalComments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      await expenseService.rejectExpense(selectedExpense.id, approvalComments);
      toast.success('Expense rejected');
      setOpenApproveDialog(false);
      setSelectedExpense(null);
      setApprovalComments('');
      loadExpenses();
      loadPendingExpenses();
      loadSummary();
    } catch (error) {
      toast.error('Failed to reject expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (expenseId: number) => {
    if (!window.confirm('Are you sure you want to cancel this expense claim?')) {
      return;
    }

    try {
      await expenseService.cancelExpense(expenseId);
      toast.success('Expense claim cancelled');
      loadExpenses();
      loadSummary();
    } catch (error) {
      toast.error('Failed to cancel expense claim');
    }
  };

  const handleDelete = async (expenseId: number) => {
    if (!window.confirm('Are you sure you want to delete this expense claim?')) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      toast.success('Expense claim deleted');
      loadExpenses();
      loadSummary();
    } catch (error) {
      toast.error('Failed to delete expense claim');
    }
  };

  const canManageExpense = (expense: Expense) => {
    return (
      user?.role !== 'employee' &&
      expense.status === 'pending' &&
      expense.userId !== user?.id
    );
  };

  const canCancelExpense = (expense: Expense) => {
    return (
      expense.userId === user?.id &&
      expense.status === 'pending'
    );
  };

  const canDeleteExpense = (expense: Expense) => {
    return (
      (expense.userId === user?.id && expense.status === 'pending') ||
      user?.role === 'admin'
    );
  };

  // Get cap info for a specific category
  const getCapForCategory = (category: string): ExpenseCategoryCap | undefined => {
    return expenseCaps.find(cap => cap.category === category);
  };

  const handleCreateVoucher = async (data: CreateVoucherRequest) => {
    try {
      setSubmitting(true);
      const voucher = await voucherService.createVoucher(data);
      toast.success('Voucher generated successfully');
      setOpenVoucherDialog(false);
      resetVoucher();
      setSelectedVoucher(voucher);
      setOpenVoucherViewDialog(true);
      loadVouchers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to generate voucher';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVoucher = async (voucherId: number) => {
    if (!window.confirm('Are you sure you want to delete this voucher?')) {
      return;
    }

    try {
      await voucherService.deleteVoucher(voucherId);
      toast.success('Voucher deleted successfully');
      loadVouchers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete voucher';
      toast.error(errorMessage);
    }
  };

  const handlePrintVoucher = (voucher: Voucher) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const qrData = JSON.stringify({
        voucherNumber: voucher.voucherNumber,
        name: voucher.name,
        amount: voucher.amount,
        region: voucher.region,
      });
      printWindow.document.write(`
        <html>
          <head>
            <title>Voucher - ${voucher.voucherNumber}</title>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .voucher { border: 2px solid #333; padding: 30px; max-width: 400px; margin: 0 auto; }
              .voucher-header { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
              .voucher-number { font-size: 14px; color: #666; margin-bottom: 20px; }
              .voucher-details { text-align: left; margin: 20px 0; }
              .voucher-details p { margin: 8px 0; }
              .voucher-details strong { display: inline-block; width: 80px; }
              .qr-code { margin: 20px auto; }
              .footer { font-size: 12px; color: #888; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="voucher">
              <div class="voucher-header">EXPENSE VOUCHER</div>
              <div class="voucher-number">${voucher.voucherNumber}</div>
              <div class="voucher-details">
                <p><strong>Name:</strong> ${voucher.name}</p>
                <p><strong>Amount:</strong> ₹${voucher.amount.toLocaleString()}</p>
                <p><strong>Region:</strong> ${voucher.region}</p>
                ${voucher.description ? `<p><strong>Details:</strong> ${voucher.description}</p>` : ''}
              </div>
              <div class="qr-code">
                <canvas id="qrcode"></canvas>
              </div>
              <div class="footer">Generated on ${voucher.createdAt ? format(new Date(voucher.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</div>
            </div>
            <script>
              QRCode.toCanvas(document.getElementById('qrcode'), '${qrData.replace(/'/g, "\\'")}', { width: 200 }, function(error) {
                if (!error) {
                  setTimeout(() => window.print(), 500);
                }
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const renderExpenseTable = (expenseList: Expense[], title: string, showEmployee: boolean = false) => (
    <Card sx={{ mb: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: 'var(--text-primary)' }}>
          {title}
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', backgroundImage: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'var(--bg-elevated)' }}>
                {showEmployee && <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Employee</strong></TableCell>}
                <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Date</strong></TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Category</strong></TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Description</strong></TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Amount</strong></TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Status</strong></TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Comments</strong></TableCell>
                <TableCell align="center" sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenseList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showEmployee ? 8 : 7} align="center" sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                    <Typography sx={{ color: 'var(--text-secondary)' }} py={4}>
                      No expense claims found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                expenseList.map((expense) => (
                  <TableRow key={expense.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                    {showEmployee && (
                      <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                        {expense.user
                          ? `${expense.user.firstName} ${expense.user.lastName}`
                          : 'Unknown'}
                      </TableCell>
                    )}
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                      {expense.expenseDate
                        ? format(new Date(expense.expenseDate), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'var(--border)' }}>
                      <Chip
                        label={expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                        size="small"
                        sx={{
                          bgcolor: getCategoryColor(expense.category) + '20',
                          color: getCategoryColor(expense.category),
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', maxWidth: 200 }}>
                      <Typography variant="body2" noWrap title={expense.description}>
                        {expense.description}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', fontWeight: 600 }}>
                      ₹{expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'var(--border)' }}>
                      <Chip
                        label={expense.status}
                        size="small"
                        color={getStatusColor(expense.status)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'var(--border)' }}>
                      {expense.comments ? (
                        <Box>
                          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {expense.comments}
                          </Typography>
                          {expense.approver && (
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.5 }}>
                              - {expense.approver.firstName} {expense.approver.lastName}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ borderColor: 'var(--border)' }}>
                      <Box display="flex" gap={0.5} justifyContent="center">
                        {expense.receiptUrl && (
                          <Tooltip title="View Receipt">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const url = expense.receiptUrl?.startsWith('http')
                                  ? expense.receiptUrl
                                  : `${getBaseUrl()}${expense.receiptUrl}`;
                                window.open(url, '_blank');
                              }}
                              sx={{ color: '#3d9be9' }}
                            >
                              <Receipt />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canManageExpense(expense) && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setOpenApproveDialog(true);
                                }}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setOpenApproveDialog(true);
                                }}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {canCancelExpense(expense) && (
                          <Tooltip title="Cancel">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleCancel(expense.id)}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDeleteExpense(expense) && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(expense.id)}
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
        </TableContainer>
      </CardContent>
    </Card>
  );

  const expenseStats = {
    pending: expenses.filter(e => e.status === 'pending').length,
    approved: expenses.filter(e => e.status === 'approved').length,
    rejected: expenses.filter(e => e.status === 'rejected').length,
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Expense Management</h1>
          <p className="text-sm text-text-secondary mt-1">Submit and track your expense claims</p>
        </div>
        <Box display="flex" gap={2}>
          <button
            className="btn-outline px-4 py-2 flex items-center gap-2"
            onClick={handleExport}
          >
            <FileDownload sx={{ fontSize: 20 }} />
            Export Report
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setOpenSubmitDialog(true)}
          >
            <Add sx={{ fontSize: 20 }} />
            Submit Expense
          </button>
        </Box>
      </Box>

      {/* Expense Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {/* Total Pending Amount */}
        <Card sx={{ flex: 1, minWidth: 140, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography color="#F59E0B" variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
              Pending Amount
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
              ₹{summary?.totalPending?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>

        {/* Total Approved Amount */}
        <Card sx={{ flex: 1, minWidth: 140, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography color="#10B981" variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
              Approved Amount
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
              ₹{summary?.totalApproved?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>

        {/* Monthly Total */}
        <Card sx={{ flex: 1, minWidth: 140, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography color="#3d9be9" variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
              Monthly Total
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
              ₹{summary?.monthlyTotal?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>

        {/* Pending Claims */}
        <Card sx={{ flex: 1, minWidth: 120, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography color="#F59E0B" variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }} fontWeight="bold">
              Pending Claims
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="#F59E0B">
              {expenseStats.pending}
            </Typography>
          </CardContent>
        </Card>

        {/* Approved Claims */}
        <Card sx={{ flex: 1, minWidth: 120, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography color="#10B981" variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }} fontWeight="bold">
              Approved Claims
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="#10B981">
              {expenseStats.approved}
            </Typography>
          </CardContent>
        </Card>

        {/* Rejected Claims */}
        <Card sx={{ flex: 1, minWidth: 120, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography color="#EF4444" variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }} fontWeight="bold">
              Rejected Claims
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="#EF4444">
              {expenseStats.rejected}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'var(--border)', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'var(--text-secondary)',
              fontWeight: 500,
            },
            '& .Mui-selected': {
              color: 'var(--accent-primary) !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--accent-primary)',
            },
          }}
        >
          <Tab label="My Expenses" />
          {user?.role !== 'employee' && (
            <Tab
              label={`Pending Approvals (${pendingExpenses.length})`}
              icon={<History />}
              iconPosition="start"
            />
          )}
          <Tab
            label="Vouchers"
            icon={<QrCode2 />}
            iconPosition="start"
          />
          {user?.role === 'admin' && (
            <Tab
              label="Expense Caps"
              icon={<Receipt />}
              iconPosition="start"
            />
          )}
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 && renderExpenseTable(expenses, 'My Expense Claims', false)}
          {activeTab === 1 && user?.role !== 'employee' && (
            renderExpenseTable(pendingExpenses, 'Pending Approvals', true)
          )}
          {((user?.role === 'employee' && activeTab === 1) || (user?.role !== 'employee' && activeTab === 2)) && (
            <Card sx={{ mb: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
                    Generated Vouchers
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenVoucherDialog(true)}
                    sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
                  >
                    Generate Voucher
                  </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', backgroundImage: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'var(--bg-elevated)' }}>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Voucher #</strong></TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Name</strong></TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Amount</strong></TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Region</strong></TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Status</strong></TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Created</strong></TableCell>
                        <TableCell align="center" sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vouchers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                            <Typography sx={{ color: 'var(--text-secondary)' }} py={4}>
                              No vouchers generated yet
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        vouchers.map((voucher) => (
                          <TableRow key={voucher.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                            <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', fontFamily: 'monospace' }}>
                              {voucher.voucherNumber}
                            </TableCell>
                            <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                              {voucher.name}
                            </TableCell>
                            <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', fontWeight: 600 }}>
                              ₹{voucher.amount.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ borderColor: 'var(--border)' }}>
                              <Chip
                                label={voucher.region}
                                size="small"
                                sx={{ bgcolor: '#6366F1', color: '#ffffff' }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderColor: 'var(--border)' }}>
                              <Chip
                                label={voucher.isUsed ? 'Used' : 'Active'}
                                size="small"
                                color={voucher.isUsed ? 'default' : 'success'}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                              {voucher.createdAt ? format(new Date(voucher.createdAt), 'MMM dd, yyyy') : '-'}
                            </TableCell>
                            <TableCell align="center" sx={{ borderColor: 'var(--border)' }}>
                              <Box display="flex" gap={0.5} justifyContent="center">
                                <Tooltip title="View QR Code">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedVoucher(voucher);
                                      setOpenVoucherViewDialog(true);
                                    }}
                                    sx={{ color: 'var(--accent-primary)' }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Print Voucher">
                                  <IconButton
                                    size="small"
                                    onClick={() => handlePrintVoucher(voucher)}
                                    sx={{ color: '#10B981' }}
                                  >
                                    <Print />
                                  </IconButton>
                                </Tooltip>
                                {!voucher.isUsed && (
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteVoucher(voucher.id)}
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
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Expense Caps Tab - Admin Only */}
          {user?.role === 'admin' && activeTab === 3 && (
            <Card sx={{ mb: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
                      Expense Category Caps
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Set caps for automatic expense approval. Expenses under the cap will be auto-approved.
                    </Typography>
                  </Box>
                </Box>
                <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)', backgroundImage: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'var(--bg-elevated)' }}>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Category</strong></TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Cap Amount</strong></TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Status</strong></TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Auto-Approval</strong></TableCell>
                        <TableCell align="center" sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenseCaps.map((cap) => {
                        const categoryLabel = expenseCategories.find(c => c.value === cap.category)?.label || cap.category;
                        return (
                          <TableRow key={cap.category} hover sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                            <TableCell sx={{ borderColor: 'var(--border)' }}>
                              <Chip
                                label={categoryLabel}
                                size="small"
                                sx={{
                                  bgcolor: getCategoryColor(cap.category as ExpenseCategory) + '20',
                                  color: getCategoryColor(cap.category as ExpenseCategory),
                                  fontWeight: 500,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', fontWeight: 600 }}>
                              {cap.capAmount !== null ? `₹${cap.capAmount.toLocaleString()}` : (
                                <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  No cap set
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ borderColor: 'var(--border)' }}>
                              {cap.capAmount !== null ? (
                                <Chip
                                  label={cap.isActive ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={cap.isActive ? 'success' : 'default'}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>-</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ borderColor: 'var(--border)' }}>
                              {cap.capAmount !== null && cap.isActive ? (
                                <Typography variant="body2" color="#10B981">
                                  Expenses ≤ ₹{cap.capAmount.toLocaleString()} auto-approved
                                </Typography>
                              ) : (
                                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                                  Manual approval required
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center" sx={{ borderColor: 'var(--border)' }}>
                              <Box display="flex" gap={0.5} justifyContent="center">
                                <Tooltip title={cap.capAmount !== null ? 'Edit Cap' : 'Set Cap'}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleOpenCapDialog(cap.category, cap)}
                                    sx={{
                                      minWidth: 'auto',
                                      px: 1.5,
                                      borderColor: 'var(--accent-primary)',
                                      color: 'var(--accent-primary)',
                                    }}
                                  >
                                    {cap.capAmount !== null ? 'Edit' : 'Set Cap'}
                                  </Button>
                                </Tooltip>
                                {cap.capAmount !== null && (
                                  <Tooltip title="Remove Cap">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveCap(cap.category)}
                                    >
                                      <Delete fontSize="small" />
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
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Submit Expense Drawer */}
      <Drawer
        anchor="right"
        open={openSubmitDialog}
        onClose={() => { if (!submitting) { setOpenSubmitDialog(false); setReceiptFile(null); } }}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
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
              Submit Expense Claim
            </Typography>
            <IconButton
              onClick={() => { if (!submitting) { setOpenSubmitDialog(false); setReceiptFile(null); } }}
              size="small"
              sx={{ color: 'var(--text-secondary)' }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <form id="submit-expense-form" onSubmit={handleSubmit(handleSubmitExpense)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', mb: -0.5 }}>
                  Expense Details
                </Typography>
                <Divider sx={{ borderColor: 'var(--border)' }} />

                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      label="Amount (₹)"
                      type="number"
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                      disabled={submitting}
                      inputProps={{ min: 1, step: 0.01 }}
                    />
                  )}
                />

                <Controller
                  name="expenseDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      label="Expense Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.expenseDate}
                      helperText={errors.expenseDate?.message}
                      disabled={submitting}
                      inputProps={{
                        max: format(new Date(), 'yyyy-MM-dd'),
                      }}
                      sx={{
                        '& input[type="date"]::-webkit-calendar-picker-indicator': {
                          filter: 'invert(1)',
                          cursor: 'pointer',
                        },
                      }}
                    />
                  )}
                />

                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      size="small"
                      label="Category"
                      error={!!errors.category}
                      helperText={errors.category?.message}
                      disabled={submitting}
                      sx={{
                        '& .MuiSelect-icon': { color: 'var(--text-secondary)' },
                      }}
                      SelectProps={{
                        MenuProps: {
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
                        },
                      }}
                    >
                      {expenseCategories.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                {/* Cap Indicator */}
                {watchedCategory && (() => {
                  const cap = getCapForCategory(watchedCategory);
                  if (cap && cap.capAmount !== null && cap.isActive) {
                    const willAutoApprove = watchedAmount && watchedAmount <= cap.capAmount;
                    return (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: willAutoApprove ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          border: `1px solid ${willAutoApprove ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        }}
                      >
                        <Typography variant="body2" color={willAutoApprove ? '#10B981' : '#F59E0B'} fontWeight={500}>
                          {willAutoApprove ? (
                            <>Auto-approval eligible</>
                          ) : (
                            <>Requires manager approval</>
                          )}
                        </Typography>
                        <Typography variant="caption" color={willAutoApprove ? '#10B981' : '#F59E0B'}>
                          Cap for {expenseCategories.find(c => c.value === watchedCategory)?.label}: ₹{cap.capAmount.toLocaleString()}
                          {watchedAmount && watchedAmount > cap.capAmount && (
                            <> (your amount: ₹{watchedAmount.toLocaleString()})</>
                          )}
                        </Typography>
                      </Box>
                    );
                  }
                  return (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Requires manager approval
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                        No auto-approval cap set for this category
                      </Typography>
                    </Box>
                  );
                })()}

                <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', mt: 1, mb: -0.5 }}>
                  Description & Receipt
                </Typography>
                <Divider sx={{ borderColor: 'var(--border)' }} />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      label="Description"
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      disabled={submitting}
                      placeholder="Please provide details about the expense"
                    />
                  )}
                />

                <Box>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1, fontSize: '0.8rem' }}>
                    Receipt (Optional)
                  </Typography>
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: receiptFile ? '#10B981' : 'var(--border)',
                      borderRadius: 2,
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor: receiptFile ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'var(--accent-primary)',
                        bgcolor: 'rgba(241, 78, 30, 0.05)',
                      },
                    }}
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                  >
                    <input
                      id="receipt-upload"
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('File size must be less than 10MB');
                            return;
                          }
                          setReceiptFile(file);
                        }
                      }}
                      disabled={submitting}
                    />
                    {receiptFile ? (
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <Receipt sx={{ color: '#10B981', fontSize: 20 }} />
                        <Typography variant="body2" color="#10B981" fontWeight={500} sx={{ fontSize: '0.85rem' }}>
                          {receiptFile.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptFile(null);
                          }}
                          disabled={submitting}
                          sx={{ p: 0.5, color: 'var(--text-secondary)' }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box>
                        <CloudUpload sx={{ fontSize: 28, color: 'var(--text-muted)', mb: 0.5 }} />
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          Click to upload receipt
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          JPEG, PNG, GIF, WebP, or PDF (max 10MB)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </form>
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
              onClick={() => { setOpenSubmitDialog(false); setReceiptFile(null); }}
              disabled={submitting}
              sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              type="submit"
              form="submit-expense-form"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Submit Claim'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Approve/Reject Dialog */}
      <Dialog
        open={openApproveDialog}
        onClose={() => !submitting && setOpenApproveDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Review Expense Claim</DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Box>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                <strong>Employee:</strong>{' '}
                {selectedExpense.user?.firstName} {selectedExpense.user?.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                <strong>Category:</strong>{' '}
                {expenseCategories.find(c => c.value === selectedExpense.category)?.label}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                <strong>Amount:</strong> ₹{selectedExpense.amount.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                <strong>Date:</strong>{' '}
                {format(new Date(selectedExpense.expenseDate), 'MMM dd, yyyy')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                <strong>Description:</strong> {selectedExpense.description}
              </Typography>
              {selectedExpense.receiptUrl && (
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                  <strong>Receipt:</strong>{' '}
                  <a
                    href={selectedExpense.receiptUrl?.startsWith('http')
                      ? selectedExpense.receiptUrl
                      : `${getBaseUrl()}${selectedExpense.receiptUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    View Receipt
                  </a>
                </Typography>
              )}

              <TextField
                fullWidth
                label="Comments"
                multiline
                rows={3}
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                sx={{ mt: 2 }}
                disabled={submitting}
                placeholder="Add your comments here..."
                helperText="Optional for approval, but required for rejection"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border)', p: 2 }}>
          <Button onClick={() => setOpenApproveDialog(false)} disabled={submitting} sx={{ color: 'var(--text-secondary)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="outlined"
            disabled={submitting}
          >
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            color="success"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Voucher Dialog */}
      <Dialog
        open={openVoucherDialog}
        onClose={() => { if (!submitting) { setOpenVoucherDialog(false); resetVoucher(); } }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Generate Expense Voucher</DialogTitle>
        <form onSubmit={handleVoucherSubmit(handleCreateVoucher)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={voucherControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Recipient Name"
                      error={!!voucherErrors.name}
                      helperText={voucherErrors.name?.message}
                      disabled={submitting}
                      placeholder="Enter the recipient name"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="amount"
                  control={voucherControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Amount (₹)"
                      type="number"
                      error={!!voucherErrors.amount}
                      helperText={voucherErrors.amount?.message}
                      disabled={submitting}
                      inputProps={{ min: 1, step: 0.01 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="region"
                  control={voucherControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Region"
                      error={!!voucherErrors.region}
                      helperText={voucherErrors.region?.message}
                      disabled={submitting}
                    >
                      {regions.map((region) => (
                        <MenuItem key={region} value={region}>
                          {region}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={voucherControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description (Optional)"
                      multiline
                      rows={2}
                      error={!!voucherErrors.description}
                      helperText={voucherErrors.description?.message}
                      disabled={submitting}
                      placeholder="Enter any additional details"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid var(--border)', p: 2 }}>
            <Button onClick={() => { setOpenVoucherDialog(false); resetVoucher(); }} disabled={submitting} sx={{ color: 'var(--text-secondary)' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={<QrCode2 />}
              sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Generate Voucher'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Voucher Dialog */}
      <Dialog
        open={openVoucherViewDialog}
        onClose={() => { setOpenVoucherViewDialog(false); setSelectedVoucher(null); }}
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
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>Voucher Details</Typography>
            <IconButton onClick={() => { setOpenVoucherViewDialog(false); setSelectedVoucher(null); }} sx={{ color: 'var(--text-secondary)' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedVoucher && (
            <Box textAlign="center">
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'var(--bg-elevated)',
                  borderRadius: 2,
                  border: '1px solid var(--border)',
                  mb: 3,
                }}
              >
                <Typography variant="overline" sx={{ color: 'var(--text-secondary)' }}>
                  Voucher Number
                </Typography>
                <Typography variant="h6" fontFamily="monospace" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
                  {selectedVoucher.voucherNumber}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 3,
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  border: '2px solid var(--border)',
                  mb: 3,
                }}
              >
                <QRCodeSVG
                  value={JSON.stringify({
                    voucherNumber: selectedVoucher.voucherNumber,
                    name: selectedVoucher.name,
                    amount: selectedVoucher.amount,
                    region: selectedVoucher.region,
                  })}
                  size={200}
                  level="M"
                  includeMargin
                />
              </Box>

              <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Name</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
                    {selectedVoucher.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Amount</Typography>
                  <Typography variant="body1" fontWeight="bold" color="#10B981">
                    ₹{selectedVoucher.amount.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Region</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
                    {selectedVoucher.region}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Status</Typography>
                  <Typography variant="body1">
                    <Chip
                      label={selectedVoucher.isUsed ? 'Used' : 'Active'}
                      size="small"
                      color={selectedVoucher.isUsed ? 'default' : 'success'}
                    />
                  </Typography>
                </Grid>
                {selectedVoucher.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Description</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      {selectedVoucher.description}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Generated On</Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    {selectedVoucher.createdAt ? format(new Date(selectedVoucher.createdAt), 'MMMM dd, yyyy HH:mm') : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border)', p: 2 }}>
          <Button onClick={() => { setOpenVoucherViewDialog(false); setSelectedVoucher(null); }} sx={{ color: 'var(--text-secondary)' }}>
            Close
          </Button>
          {selectedVoucher && (
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={() => handlePrintVoucher(selectedVoucher)}
              sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
            >
              Print Voucher
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Expense Cap Dialog */}
      <Dialog
        open={openCapDialog}
        onClose={() => !submitting && setOpenCapDialog(false)}
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
          {selectedCapCategory && (
            <>
              Set Cap for{' '}
              <Chip
                label={expenseCategories.find(c => c.value === selectedCapCategory)?.label || selectedCapCategory}
                size="small"
                sx={{
                  bgcolor: getCategoryColor(selectedCapCategory as ExpenseCategory) + '20',
                  color: getCategoryColor(selectedCapCategory as ExpenseCategory),
                  fontWeight: 500,
                  ml: 1,
                }}
              />
            </>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
              Expenses in this category at or below the cap amount will be automatically approved without manager review.
            </Typography>
            <TextField
              fullWidth
              label="Cap Amount (₹)"
              type="number"
              value={capAmount}
              onChange={(e) => setCapAmount(e.target.value)}
              disabled={submitting}
              inputProps={{ min: 0, step: 100 }}
              sx={{ mb: 2 }}
              helperText="Set to 0 to require approval for all expenses in this category"
            />
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>Status:</Typography>
              <Chip
                label={capIsActive ? 'Active' : 'Inactive'}
                size="small"
                color={capIsActive ? 'success' : 'default'}
                onClick={() => setCapIsActive(!capIsActive)}
                sx={{ cursor: 'pointer' }}
              />
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                (Click to toggle)
              </Typography>
            </Box>
            {!capIsActive && (
              <Typography variant="body2" color="#F59E0B" sx={{ mt: 1 }}>
                When inactive, all expenses in this category will require manual approval.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border)', p: 2 }}>
          <Button onClick={() => setOpenCapDialog(false)} disabled={submitting} sx={{ color: 'var(--text-secondary)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveCap}
            variant="contained"
            disabled={submitting || !capAmount}
            sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Save Cap'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpensesPage;
