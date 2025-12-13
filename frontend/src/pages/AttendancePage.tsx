import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Drawer,
  Divider,
} from '@mui/material';
import {
  AccessTime,
  ExitToApp,
  Edit,
  Download,
  Refresh,
  LocationOn,
  Close,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import attendanceService from '../services/attendance.service';
import {
  Attendance,
  AttendanceRegularization,
  AttendanceStatus,
  RegularizationStatus,
  MonthlySummary,
} from '../types/attendance';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<Attendance[]>([]);
  const [regularizations, setRegularizations] = useState<AttendanceRegularization[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [regularizationDialogOpen, setRegularizationDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedRegularization, setSelectedRegularization] =
    useState<AttendanceRegularization | null>(null);
  const [regularizationForm, setRegularizationForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: '',
  });
  const [approvalComments, setApprovalComments] = useState('');

  useEffect(() => {
    loadTodayAttendance();
    loadMonthlySummary();
    loadMyAttendance();
    loadRegularizations();
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadTeamAttendance();
    }
  }, [selectedMonth, selectedYear]);

  const loadTodayAttendance = async () => {
    try {
      const { attendance } = await attendanceService.getTodayAttendance();
      setTodayAttendance(attendance);
    } catch (error: any) {
      console.error('Failed to load today attendance:', error);
    }
  };

  const loadMyAttendance = async () => {
    try {
      const { attendance } = await attendanceService.getMyAttendance({
        month: selectedMonth,
        year: selectedYear,
      });
      setMyAttendance(attendance || []);
    } catch (error: any) {
      console.error('Failed to load attendance:', error);
      setMyAttendance([]);
    }
  };

  const loadTeamAttendance = async () => {
    try {
      const { attendance } = await attendanceService.getTeamAttendance({
        month: selectedMonth,
        year: selectedYear,
      });
      setTeamAttendance(attendance || []);
    } catch (error: any) {
      console.error('Failed to load team attendance:', error);
      setTeamAttendance([]);
    }
  };

  const loadRegularizations = async () => {
    try {
      const { regularizations: regs } = await attendanceService.getRegularizations();
      console.log('Regularizations loaded:', regs.length, 'items');
      setRegularizations(regs || []);
    } catch (error: any) {
      console.error('Failed to load regularizations:', error);
      toast.error('Failed to load regularization requests');
      setRegularizations([]);
    }
  };

  const loadMonthlySummary = async () => {
    try {
      const summary = await attendanceService.getMonthlySummary(selectedMonth, selectedYear);
      setMonthlySummary(summary);
    } catch (error: any) {
      console.error('Failed to load monthly summary:', error);
      setMonthlySummary(null);
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      let location = '';
      try {
        location = await attendanceService.getCurrentLocation();
      } catch (error) {
        console.warn('Failed to get location:', error);
        location = 'Location not available';
      }

      await attendanceService.checkIn({ location });
      toast.success('Checked in successfully!');
      loadTodayAttendance();
      loadMyAttendance();
      loadMonthlySummary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      let location = '';
      try {
        location = await attendanceService.getCurrentLocation();
      } catch (error) {
        console.warn('Failed to get location:', error);
        location = 'Location not available';
      }

      await attendanceService.checkOut({ location });
      toast.success('Checked out successfully!');
      loadTodayAttendance();
      loadMyAttendance();
      loadMonthlySummary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const handleRegularizationSubmit = async () => {
    try {
      setLoading(true);
      await attendanceService.requestRegularization({
        date: regularizationForm.date,
        requestedCheckIn: regularizationForm.requestedCheckIn
          ? `${regularizationForm.date}T${regularizationForm.requestedCheckIn}:00`
          : undefined,
        requestedCheckOut: regularizationForm.requestedCheckOut
          ? `${regularizationForm.date}T${regularizationForm.requestedCheckOut}:00`
          : undefined,
        reason: regularizationForm.reason,
      });
      toast.success('Regularization request submitted successfully!');
      setRegularizationDialogOpen(false);
      setRegularizationForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        requestedCheckIn: '',
        requestedCheckOut: '',
        reason: '',
      });
      loadRegularizations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit regularization request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRegularization) return;
    try {
      setLoading(true);
      await attendanceService.approveRegularization(selectedRegularization.id, {
        comments: approvalComments,
      });
      toast.success('Regularization request approved!');
      setApprovalDialogOpen(false);
      setSelectedRegularization(null);
      setApprovalComments('');
      loadRegularizations();
      loadTeamAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegularization || !approvalComments) {
      toast.error('Please provide comments for rejection');
      return;
    }
    try {
      setLoading(true);
      await attendanceService.rejectRegularization(selectedRegularization.id, {
        comments: approvalComments,
      });
      toast.success('Regularization request rejected!');
      setApprovalDialogOpen(false);
      setSelectedRegularization(null);
      setApprovalComments('');
      loadRegularizations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await attendanceService.exportAttendance({
        month: selectedMonth,
        year: selectedYear,
      });
      attendanceService.downloadCSV(
        blob,
        `attendance_${selectedYear}_${selectedMonth}.csv`
      );
      toast.success('Attendance report exported successfully!');
    } catch (error: any) {
      toast.error('Failed to export attendance report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    const colors: Record<AttendanceStatus, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      [AttendanceStatus.PRESENT]: 'success',
      [AttendanceStatus.ABSENT]: 'error',
      [AttendanceStatus.LATE]: 'warning',
      [AttendanceStatus.HALF_DAY]: 'info',
      [AttendanceStatus.ON_LEAVE]: 'info',
      [AttendanceStatus.WEEKEND]: 'default',
      [AttendanceStatus.HOLIDAY]: 'default',
    };
    return colors[status];
  };

  const formatTime = (dateTime: string | null) => {
    if (!dateTime) return '-';
    return format(parseISO(dateTime), 'hh:mm a');
  };

  const formatDate = (date: string) => {
    return format(parseISO(date), 'MMM dd, yyyy');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
          Attendance Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            label="Month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            sx={{ minWidth: 120 }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <MenuItem key={month} value={month}>
                {format(new Date(2025, month - 1, 1), 'MMMM')}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            sx={{ minWidth: 100 }}
          >
            {[2024, 2025, 2026].map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={loading}
            sx={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
          >
            Export
          </Button>
          <IconButton
            onClick={() => {
              loadTodayAttendance();
              loadMyAttendance();
              loadMonthlySummary();
              loadRegularizations();
              if (user?.role === 'admin' || user?.role === 'manager') {
                loadTeamAttendance();
              }
            }}
            sx={{ color: 'var(--text-secondary)' }}
          >
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Today's Attendance Card */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Today's Attendance
        </h3>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            {todayAttendance ? (
              <Box>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Check In: {formatTime(todayAttendance.checkInTime)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Check Out: {formatTime(todayAttendance.checkOutTime)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Work Hours: {todayAttendance.workHours} hrs
                </Typography>
                <Chip
                  label={todayAttendance.status}
                  color={getStatusColor(todayAttendance.status)}
                  size="small"
                  sx={{ mt: 1 }}
                />
                {todayAttendance.isLate && (
                  <Chip label="Late" color="warning" size="small" sx={{ mt: 1, ml: 1 }} />
                )}
                {todayAttendance.isEarlyDeparture && (
                  <Chip label="Early" color="warning" size="small" sx={{ mt: 1, ml: 1 }} />
                )}
              </Box>
            ) : (
              <Alert severity="info">
                No attendance record for today
              </Alert>
            )}
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AccessTime />}
              onClick={handleCheckIn}
              disabled={loading}
              size="large"
              sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
            >
              Check In
            </Button>
            <Button
              variant="contained"
              startIcon={<ExitToApp />}
              onClick={handleCheckOut}
              disabled={loading}
              size="large"
              sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-primary-hover)' } }}
            >
              Check Out
            </Button>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setRegularizationDialogOpen(true)}
            >
              Regularize
            </Button>
          </Grid>
        </Grid>
      </div>

      {/* Monthly Summary Cards */}
      {monthlySummary && monthlySummary.summary && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <div
            className="flex-1 min-w-[140px] rounded-lg p-4"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Working Days
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {monthlySummary.summary.workingDays}
            </p>
          </div>
          <div
            className="flex-1 min-w-[140px] rounded-lg p-4"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Present Days
            </p>
            <p className="text-2xl font-bold" style={{ color: '#10B981' }}>
              {monthlySummary.summary.presentDays}
            </p>
          </div>
          <div
            className="flex-1 min-w-[140px] rounded-lg p-4"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Attendance %
            </p>
            <p className="text-2xl font-bold" style={{ color: '#3d9be9' }}>
              {monthlySummary.summary.attendancePercentage}%
            </p>
          </div>
          <div
            className="flex-1 min-w-[140px] rounded-lg p-4"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Total Hours
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {monthlySummary.summary.totalWorkHours}h
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        className="rounded-xl"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_e, v) => setTabValue(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'var(--border)',
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
          <Tab label="My Attendance" />
          <Tab label="Regularizations" />
          {(user?.role === 'admin' || user?.role === 'manager') && <Tab label="Team Attendance" />}
        </Tabs>

        {/* My Attendance Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer sx={{ bgcolor: 'var(--bg-elevated)', borderRadius: 1 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Date</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Check In</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Check Out</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Work Hours</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Status</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Location</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: 'var(--text-muted)', borderColor: 'var(--border)', bgcolor: 'var(--surface)' }}>
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  myAttendance.map((record) => (
                    <TableRow key={record.id} sx={{ bgcolor: 'var(--surface)', '&:hover': { bgcolor: 'var(--sidebar-item-hover)' } }}>
                      <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{formatDate(record.date)}</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{formatTime(record.checkInTime)}</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{formatTime(record.checkOutTime)}</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{record.workHours} hrs</TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Chip
                          label={record.status}
                          color={getStatusColor(record.status)}
                          size="small"
                        />
                        {record.isLate && (
                          <Chip label="Late" color="warning" size="small" sx={{ ml: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        {record.checkInLocation && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn fontSize="small" sx={{ color: 'var(--text-muted)' }} />
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{record.checkInLocation}</Typography>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Regularizations Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer sx={{ bgcolor: 'var(--bg-elevated)', borderRadius: 1 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Date</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Requested Check In</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Requested Check Out</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Reason</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Status</strong></TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regularizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: 'var(--text-muted)', borderColor: 'var(--border)', bgcolor: 'var(--surface)' }}>
                      No regularization requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  regularizations.map((reg) => (
                    <TableRow key={reg.id} sx={{ bgcolor: 'var(--surface)', '&:hover': { bgcolor: 'var(--sidebar-item-hover)' } }}>
                      <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{formatDate(reg.date)}</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{formatTime(reg.requestedCheckIn)}</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{formatTime(reg.requestedCheckOut)}</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{reg.reason}</TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Chip
                          label={reg.status}
                          color={
                            reg.status === RegularizationStatus.APPROVED
                              ? 'success'
                              : reg.status === RegularizationStatus.REJECTED
                              ? 'error'
                              : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        {reg.status === RegularizationStatus.PENDING &&
                          (user?.role === 'admin' || user?.role === 'manager') && (
                            <Button
                              size="small"
                              onClick={() => {
                                setSelectedRegularization(reg);
                                setApprovalDialogOpen(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Team Attendance Tab */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <TabPanel value={tabValue} index={2}>
            <TableContainer sx={{ bgcolor: 'var(--bg-elevated)', borderRadius: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Employee</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Date</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Check In</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Check Out</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Work Hours</strong></TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)', bgcolor: 'var(--bg-elevated)' }}><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: 'var(--text-muted)', borderColor: 'var(--border)', bgcolor: 'var(--surface)' }}>
                        No team attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    teamAttendance.map((record) => (
                      <TableRow key={record.id} sx={{ bgcolor: 'var(--surface)', '&:hover': { bgcolor: 'var(--sidebar-item-hover)' } }}>
                        <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                          {record.user?.firstName} {record.user?.lastName}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{formatDate(record.date)}</TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{formatTime(record.checkInTime)}</TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{formatTime(record.checkOutTime)}</TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>{record.workHours} hrs</TableCell>
                        <TableCell sx={{ borderColor: 'var(--border)' }}>
                          <Chip
                            label={record.status}
                            color={getStatusColor(record.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        )}
      </div>

      {/* Regularization Drawer */}
      <Drawer
        anchor="right"
        open={regularizationDialogOpen}
        onClose={() => setRegularizationDialogOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
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
              Request Regularization
            </Typography>
            <IconButton
              onClick={() => setRegularizationDialogOpen(false)}
              size="small"
              sx={{ color: 'var(--text-secondary)' }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: -0.5 }}>
                Attendance Details
              </Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />

              <TextField
                label="Date"
                type="date"
                size="small"
                value={regularizationForm.date}
                onChange={(e) =>
                  setRegularizationForm({ ...regularizationForm, date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Requested Check In"
                type="time"
                size="small"
                value={regularizationForm.requestedCheckIn}
                onChange={(e) =>
                  setRegularizationForm({ ...regularizationForm, requestedCheckIn: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step: 300, // 5 min
                }}
                fullWidth
              />

              <TextField
                label="Requested Check Out"
                type="time"
                size="small"
                value={regularizationForm.requestedCheckOut}
                onChange={(e) =>
                  setRegularizationForm({ ...regularizationForm, requestedCheckOut: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step: 300, // 5 min
                }}
                fullWidth
              />

              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mt: 1, mb: -0.5 }}>
                Reason
              </Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />

              <TextField
                label="Reason for Regularization"
                multiline
                rows={4}
                size="small"
                value={regularizationForm.reason}
                onChange={(e) =>
                  setRegularizationForm({ ...regularizationForm, reason: e.target.value })
                }
                required
                fullWidth
                placeholder="Please provide a detailed reason for the regularization request"
              />
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
              onClick={() => setRegularizationDialogOpen(false)}
              sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleRegularizationSubmit}
              variant="contained"
              disabled={loading || !regularizationForm.reason}
              sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-primary-hover)' } }}
            >
              Submit Request
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface)',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Review Regularization Request</DialogTitle>
        <DialogContent>
          {selectedRegularization && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                <strong>Employee:</strong> {selectedRegularization.user?.firstName}{' '}
                {selectedRegularization.user?.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                <strong>Date:</strong> {formatDate(selectedRegularization.date)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                <strong>Check In:</strong> {formatTime(selectedRegularization.requestedCheckIn)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                <strong>Check Out:</strong> {formatTime(selectedRegularization.requestedCheckOut)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 1 }}>
                <strong>Reason:</strong> {selectedRegularization.reason}
              </Typography>
              <TextField
                label="Comments"
                multiline
                rows={3}
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                fullWidth
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border)', p: 2 }}>
          <Button onClick={() => setApprovalDialogOpen(false)} sx={{ color: 'var(--text-secondary)' }}>
            Cancel
          </Button>
          <Button onClick={handleReject} color="error" variant="outlined" disabled={loading}>
            Reject
          </Button>
          <Button onClick={handleApprove} variant="contained" color="success" disabled={loading}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendancePage;
