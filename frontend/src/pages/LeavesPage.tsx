import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
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
  Alert,
  CircularProgress,
  Tooltip,
  Checkbox,
  FormControlLabel,
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
  History,
  Link as LinkIcon,
  Close,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format, eachDayOfInterval, isSunday } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService } from '@/services/leave.service';
import type { LeaveRequest, RequestStatus, HalfDaySession, LeaveBalance, LeaveApproval } from '@/types';

const leaveTypes = [
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'casual_leave', label: 'Casual Leave' },
  { value: 'earned_leave', label: 'Earned Leave' },
  { value: 'comp_off', label: 'Comp Off' },
  { value: 'paternity_maternity', label: 'Paternity Leave' },
  { value: 'paternity_maternity', label: 'Maternity Leave' },
];

// Helper function to count days excluding Sundays
const countDaysExcludingSundays = (startDate: Date, endDate: Date): number => {
  // Validate dates
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }
  // Ensure start is before or equal to end
  if (startDate > endDate) {
    return 0;
  }
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(day => !isSunday(day)).length;
};

// Helper function to get approval status color
const getApprovalStatusColor = (status: string): 'default' | 'warning' | 'success' | 'error' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

// Component to display approval chain
const ApprovalChain: React.FC<{ approvals?: LeaveApproval[]; currentLevel?: number; totalLevels?: number }> = ({
  approvals,
  currentLevel = 0,
  totalLevels = 0,
}) => {
  if (!approvals || approvals.length === 0) {
    return <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>No approval chain</Typography>;
  }

  const sortedApprovals = [...approvals].sort((a, b) => a.approvalOrder - b.approvalOrder);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
        Approval Progress: {currentLevel}/{totalLevels}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {sortedApprovals.map((approval, index) => (
          <React.Fragment key={approval.id}>
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption" display="block">
                    {approval.approver?.firstName} {approval.approver?.lastName}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ textTransform: 'capitalize' }}>
                    Role: {approval.approver?.role}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ textTransform: 'capitalize' }}>
                    Status: {approval.status}
                  </Typography>
                  {approval.comments && (
                    <Typography variant="caption" display="block">
                      Comment: {approval.comments}
                    </Typography>
                  )}
                  {approval.actedAt && (
                    <Typography variant="caption" display="block">
                      Acted: {format(new Date(approval.actedAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  )}
                </Box>
              }
            >
              <Chip
                size="small"
                label={`L${approval.approvalOrder}: ${approval.approver?.firstName || 'Unknown'}`}
                color={getApprovalStatusColor(approval.status)}
                variant={approval.status === 'pending' ? 'outlined' : 'filled'}
                sx={{
                  fontSize: '0.7rem',
                  height: 22,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Tooltip>
            {index < sortedApprovals.length - 1 && (
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>→</Typography>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

// Form data type for the leave application form
interface LeaveFormData {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const leaveSchema = yup.object().shape({
  leaveType: yup.string().required('Leave type is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup
    .string()
    .required('End date is required')
    .test('is-after', 'End date must be after start date', function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),
  reason: yup
    .string()
    .required('Reason is required')
    .min(10, 'Reason must be at least 10 characters'),
});

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

const LeavesPage: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [openApplyDialog, setOpenApplyDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<HalfDaySession | ''>('');
  const [activeTab, setActiveTab] = useState(0);
  const [documentUrl, setDocumentUrl] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<LeaveFormData>({
    resolver: yupResolver(leaveSchema) as any,
    defaultValues: {
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  let daysCount = startDate && endDate
    ? countDaysExcludingSundays(new Date(startDate), new Date(endDate))
    : 0;

  if (isHalfDay) {
    daysCount = 0.5;
  }

  useEffect(() => {
    loadLeaves();
    loadLeaveBalance();
    if (activeTab === 1) {
      loadHistory();
    }
  }, [activeTab]);

  const loadLeaveBalance = async () => {
    try {
      const balance = await leaveService.getLeaveBalance();
      setLeaveBalance(balance);
    } catch (error) {
      console.error('Failed to load leave balance:', error);
    }
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getLeaveRequests({ limit: 100 });
      setLeaves(response.items);
    } catch (error) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getLeaveHistory({ limit: 100 });
      setLeaveHistory(response.items);
    } catch (error) {
      toast.error('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await leaveService.exportLeaveReport({});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Leave report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export leave report');
    }
  };

  const handleApplyLeave = async (data: LeaveFormData) => {
    try {
      setSubmitting(true);
      const leaveData = {
        leaveType: data.leaveType as any,
        startDate: data.startDate,
        endDate: isHalfDay ? data.startDate : data.endDate,
        reason: data.reason,
        isHalfDay,
        halfDaySession: isHalfDay ? (halfDaySession as HalfDaySession) : undefined,
        documentUrl: documentUrl.trim() || undefined,
      };
      await leaveService.applyLeave(leaveData);
      toast.success('Leave request submitted successfully');
      setOpenApplyDialog(false);
      reset();
      setIsHalfDay(false);
      setHalfDaySession('');
      setDocumentUrl('');
      loadLeaves();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to submit leave request';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedLeave) return;

    try {
      setSubmitting(true);
      await leaveService.approveLeave(selectedLeave.id, approvalComments);
      toast.success('Leave approved successfully');
      setOpenApproveDialog(false);
      setSelectedLeave(null);
      setApprovalComments('');
      loadLeaves();
    } catch (error) {
      toast.error('Failed to approve leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLeave) return;

    if (!approvalComments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      await leaveService.rejectLeave(selectedLeave.id, approvalComments);
      toast.success('Leave rejected');
      setOpenApproveDialog(false);
      setSelectedLeave(null);
      setApprovalComments('');
      loadLeaves();
    } catch (error) {
      toast.error('Failed to reject leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (leaveId: number) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      await leaveService.cancelLeave(leaveId);
      toast.success('Leave request cancelled');
      loadLeaves();
    } catch (error) {
      toast.error('Failed to cancel leave request');
    }
  };

  const canManageLeave = (leave: LeaveRequest) => {
    // Check if user is in the approval chain and has a pending approval
    if (leave.approvals && leave.approvals.length > 0) {
      const userApproval = leave.approvals.find(a => a.approverId === user?.id);
      if (userApproval) {
        // Check if it's user's turn (all previous must be approved)
        const previousApprovals = leave.approvals.filter(a => a.approvalOrder < userApproval.approvalOrder);
        const allPreviousApproved = previousApprovals.every(a => a.status === 'approved');
        return userApproval.status === 'pending' && allPreviousApproved && leave.status === 'pending';
      }
    }
    // Fallback for old requests without approval chain
    return (
      user?.role !== 'employee' &&
      leave.status === 'pending' &&
      leave.userId !== user?.id
    );
  };

  const canCancelLeave = (leave: LeaveRequest) => {
    return (
      leave.userId === user?.id &&
      (leave.status === 'pending' || leave.status === 'approved')
    );
  };


  const renderLeaveTable = (leaveList: LeaveRequest[], title: string, showEmployee: boolean = true) => (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <h3
        className="text-base font-semibold mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {showEmployee && (
                <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}>
                  <strong>Employee</strong>
                </TableCell>
              )}
              <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}>
                <strong>Leave Type</strong>
              </TableCell>
              <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}>
                <strong>Duration</strong>
              </TableCell>
              <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}>
                <strong>Days</strong>
              </TableCell>
              <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}>
                <strong>Status</strong>
              </TableCell>
              <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}>
                <strong>Approval Chain</strong>
              </TableCell>
              <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}>
                <strong>Applied On</strong>
              </TableCell>
              <TableCell align="center" sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaveList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showEmployee ? 8 : 7}
                  align="center"
                  sx={{ color: 'var(--text-muted)', borderColor: 'var(--border)', bgcolor: 'var(--surface)' }}
                >
                  <Typography sx={{ color: 'var(--text-muted)', py: 4 }}>
                    No leave requests found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              leaveList.map((leave) => (
                <TableRow
                  key={leave.id}
                  sx={{
                    '&:hover': { bgcolor: 'var(--sidebar-item-hover)' },
                    bgcolor: 'var(--surface)',
                  }}
                >
                  {showEmployee && (
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                      {leave.user
                        ? `${leave.user.firstName} ${leave.user.lastName}`
                        : 'Unknown'}
                    </TableCell>
                  )}
                  <TableCell sx={{ borderColor: 'var(--border)' }}>
                    <Chip
                      label={leaveTypes.find(t => t.value === leave.leaveType)?.label}
                      size="small"
                      variant="outlined"
                      sx={{
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border)',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                    {leave.startDate && leave.endDate ? (
                      <>
                        {format(new Date(leave.startDate), 'MMM dd')} -{' '}
                        {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                      </>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                    {leave.daysCount} day{leave.daysCount !== 1 ? 's' : ''}
                    {leave.isHalfDay && (
                      <Typography variant="caption" display="block" sx={{ color: 'var(--text-muted)' }}>
                        ({leave.halfDaySession === 'first_half' ? 'Morning' : 'Afternoon'})
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderColor: 'var(--border)' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip
                        label={leave.status}
                        size="small"
                        color={getStatusColor(leave.status)}
                        sx={{ textTransform: 'capitalize', width: 'fit-content' }}
                      />
                      {leave.status === 'pending' && leave.totalApprovalLevels && leave.totalApprovalLevels > 0 && (
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                          {leave.currentApprovalLevel || 0}/{leave.totalApprovalLevels} approved
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderColor: 'var(--border)', minWidth: 200 }}>
                    {leave.approvals && leave.approvals.length > 0 ? (
                      <ApprovalChain
                        approvals={leave.approvals}
                        currentLevel={leave.currentApprovalLevel}
                        totalLevels={leave.totalApprovalLevels}
                      />
                    ) : (
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        {leave.comments || leave.reason || '-'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                    {leave.createdAt
                      ? format(new Date(leave.createdAt), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ borderColor: 'var(--border)' }}>
                    <Box display="flex" gap={0.5} justifyContent="center">
                      {canManageLeave(leave) && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedLeave(leave);
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
                                setSelectedLeave(leave);
                                setOpenApproveDialog(true);
                              }}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {canCancelLeave(leave) && (
                        <Tooltip title="Cancel Request">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancel(leave.id)}
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
      </div>
    </div>
  );

  const totalAvailable = leaveBalance
    ? Number(leaveBalance.sickLeave) + Number(leaveBalance.casualLeave) + Number(leaveBalance.earnedLeave) + Number(leaveBalance.compOff)
    : 0;

  const myLeaves = leaves.filter(l => l.userId === user?.id);
  const teamLeaves = leaves.filter(l => l.userId !== user?.id);

  const leaveStats = {
    pending: myLeaves.filter(l => l.status === 'pending').length,
    approved: myLeaves.filter(l => l.status === 'approved').length,
    rejected: myLeaves.filter(l => l.status === 'rejected').length,
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Leave Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage your leave requests and balances
          </p>
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
            onClick={() => setOpenApplyDialog(true)}
          >
            <Add sx={{ fontSize: 20 }} />
            Apply for Leave
          </button>
        </Box>
      </Box>

      {/* Leave Statistics - Compact Single Row */}
      {leaveBalance && (
        <div className="flex gap-3 mb-4 flex-wrap">
          {/* Total Available */}
          <div
            className="flex-1 min-w-[120px] rounded-lg p-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Total Available
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalAvailable}
            </p>
          </div>

          {/* Casual Leave */}
          <div
            className="flex-1 min-w-[120px] rounded-lg p-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: '#10B981' }}>
              Casual Leave
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {leaveBalance.casualLeave}
            </p>
          </div>

          {/* Sick Leave */}
          <div
            className="flex-1 min-w-[120px] rounded-lg p-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: '#EF4444' }}>
              Sick Leave
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {leaveBalance.sickLeave}
            </p>
          </div>

          {/* Earned Leave */}
          <div
            className="flex-1 min-w-[120px] rounded-lg p-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: '#F59E0B' }}>
              Earned Leave
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {leaveBalance.earnedLeave}
            </p>
          </div>

          {/* Pending Requests */}
          <div
            className="flex-1 min-w-[120px] rounded-lg p-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#F59E0B' }}>
              Pending Requests
            </p>
            <p className="text-xl font-bold" style={{ color: '#F59E0B' }}>
              {leaveStats.pending}
            </p>
          </div>

          {/* Approved Leaves */}
          <div
            className="flex-1 min-w-[120px] rounded-lg p-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#10B981' }}>
              Approved Leaves
            </p>
            <p className="text-xl font-bold" style={{ color: '#10B981' }}>
              {leaveStats.approved}
            </p>
          </div>

          {/* Rejected Requests */}
          <div
            className="flex-1 min-w-[120px] rounded-lg p-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#EF4444' }}>
              Rejected Requests
            </p>
            <p className="text-xl font-bold" style={{ color: '#EF4444' }}>
              {leaveStats.rejected}
            </p>
          </div>
        </div>
      )}

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
          <Tab label="Current Leaves" />
          <Tab label="Leave History" icon={<History />} iconPosition="start" />
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 && (
            <>
              {/* My Leaves Section */}
              {renderLeaveTable(myLeaves, 'My Leaves', false)}

              {/* Team Leaves Section - Only show for managers and admins */}
              {user?.role !== 'employee' && teamLeaves.length > 0 && (
                renderLeaveTable(teamLeaves, 'Team Leave Requests', true)
              )}
            </>
          )}

          {activeTab === 1 && (
            <>
              {renderLeaveTable(leaveHistory, 'Leave History', false)}
            </>
          )}
        </>
      )}

      {/* Apply Leave Drawer */}
      <Drawer
        anchor="right"
        open={openApplyDialog}
        onClose={() => !submitting && setOpenApplyDialog(false)}
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
              Apply for Leave
            </Typography>
            <IconButton
              onClick={() => !submitting && setOpenApplyDialog(false)}
              size="small"
              sx={{ color: 'var(--text-secondary)' }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', p: 2 }}>
            <form id="apply-leave-form" onSubmit={handleSubmit(handleApplyLeave)}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--border)',
                },
              }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: -0.5 }}>
                  Leave Details
                </Typography>
                <Divider sx={{ borderColor: 'var(--border)' }} />

                <Controller
                  name="leaveType"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      size="small"
                      label="Leave Type"
                      error={!!errors.leaveType}
                      helperText={errors.leaveType?.message}
                      disabled={submitting}
                    >
                      {leaveTypes.map((option) => (
                        <MenuItem key={option.label} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      label="Start Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.startDate}
                      helperText={errors.startDate?.message}
                      disabled={submitting}
                      inputProps={{
                        min: format(new Date(), 'yyyy-MM-dd'),
                      }}
                    />
                  )}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isHalfDay}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsHalfDay(checked);
                        if (checked && startDate) {
                          setValue('endDate', startDate);
                        }
                        if (!checked) {
                          setHalfDaySession('');
                        }
                      }}
                      disabled={submitting}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Half-day leave</Typography>}
                />

                {isHalfDay && (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Session"
                    value={halfDaySession}
                    onChange={(e) => setHalfDaySession(e.target.value as HalfDaySession)}
                    disabled={submitting}
                    required
                  >
                    <MenuItem value="first_half">Morning (First Half)</MenuItem>
                    <MenuItem value="second_half">Afternoon (Second Half)</MenuItem>
                  </TextField>
                )}

                {!isHalfDay && (
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        label="End Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.endDate}
                        helperText={errors.endDate?.message}
                        disabled={submitting}
                        inputProps={{
                          min: startDate || format(new Date(), 'yyyy-MM-dd'),
                        }}
                      />
                    )}
                  />
                )}

                {daysCount > 0 && (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    Total days: <strong>{daysCount}</strong>
                  </Alert>
                )}

                <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                  Additional Information
                </Typography>
                <Divider sx={{ borderColor: 'var(--border)' }} />

                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      label="Reason"
                      multiline
                      rows={3}
                      error={!!errors.reason}
                      helperText={errors.reason?.message}
                      disabled={submitting}
                      placeholder="Please provide a detailed reason for your leave request"
                    />
                  )}
                />

                {/* Document Link */}
                <TextField
                  fullWidth
                  size="small"
                  label="Supporting Document Link (Optional)"
                  placeholder="https://drive.google.com/..."
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  disabled={submitting}
                  InputProps={{
                    startAdornment: <LinkIcon sx={{ mr: 1, color: 'var(--text-muted)', fontSize: 20 }} />,
                  }}
                />
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
              onClick={() => setOpenApplyDialog(false)}
              disabled={submitting}
              sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              type="submit"
              form="apply-leave-form"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-primary-hover)' } }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Submit Request'}
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
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Review Leave Request</DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                <strong>Employee:</strong>{' '}
                {selectedLeave.user?.firstName} {selectedLeave.user?.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                <strong>Leave Type:</strong>{' '}
                {leaveTypes.find(t => t.value === selectedLeave.leaveType)?.label}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                <strong>Duration:</strong>{' '}
                {format(new Date(selectedLeave.startDate), 'MMM dd')} -{' '}
                {format(new Date(selectedLeave.endDate), 'MMM dd, yyyy')} ({selectedLeave.daysCount} days)
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                <strong>Reason:</strong> {selectedLeave.reason}
              </Typography>

              {/* Approval Chain Display */}
              {selectedLeave.approvals && selectedLeave.approvals.length > 0 && (
                <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'var(--bg-elevated)', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'var(--text-primary)' }} gutterBottom>
                    Approval Chain Progress
                  </Typography>
                  <ApprovalChain
                    approvals={selectedLeave.approvals}
                    currentLevel={selectedLeave.currentApprovalLevel}
                    totalLevels={selectedLeave.totalApprovalLevels}
                  />
                  {/* Show current user's position in chain */}
                  {selectedLeave.approvals.find(a => a.approverId === user?.id) && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      You are Level {selectedLeave.approvals.find(a => a.approverId === user?.id)?.approvalOrder} approver in this chain.
                    </Alert>
                  )}
                </Box>
              )}

              {selectedLeave.documentUrl && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }} gutterBottom>
                    <strong>Attached Document:</strong>
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LinkIcon />}
                    href={selectedLeave.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Document
                  </Button>
                </Box>
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
          <Button
            onClick={() => setOpenApproveDialog(false)}
            disabled={submitting}
            sx={{ color: 'var(--text-secondary)' }}
          >
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
    </Box>
  );
};

export default LeavesPage;
