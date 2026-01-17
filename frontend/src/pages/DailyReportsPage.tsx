import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
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
  Tabs,
  Tab,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  Save,
  Send,
  Visibility,
  CalendarToday,
  AccessTime,
  Person,
} from '@mui/icons-material';
import { format, subDays, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import {
  dailyReportService,
  DailyReport,
  TeamMember,
} from '@/services/dailyReport.service';

const getStatusColor = (status: string): 'default' | 'warning' | 'success' => {
  switch (status) {
    case 'draft':
      return 'warning';
    case 'submitted':
      return 'success';
    default:
      return 'default';
  }
};

// Common TextField styling for dark mode compatibility
const textFieldSx = {
  '& .MuiInputBase-root': {
    color: 'var(--text-primary)',
    backgroundColor: 'var(--surface)',
  },
  '& .MuiInputBase-input': {
    color: 'var(--text-primary)',
    WebkitTextFillColor: 'var(--text-primary)',
  },
  '& .MuiInputBase-input.Mui-disabled': {
    color: 'var(--text-secondary)',
    WebkitTextFillColor: 'var(--text-secondary)',
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-secondary)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border)',
  },
  '& .MuiSvgIcon-root': {
    color: 'var(--text-secondary)',
  },
  '& .Mui-disabled': {
    color: 'var(--text-secondary)',
    WebkitTextFillColor: 'var(--text-secondary)',
  },
};

const DailyReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Separate loading states per tab
  const [todayLoading, setTodayLoading] = useState(false);
  const [myReportsLoading, setMyReportsLoading] = useState(false);
  const [teamReportsLoading, setTeamReportsLoading] = useState(false);

  // Today's Report State
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentReport, setCurrentReport] = useState<DailyReport | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // My Reports State
  const [myReports, setMyReports] = useState<DailyReport[]>([]);
  const [myReportsPage, setMyReportsPage] = useState(0);
  const [myReportsRowsPerPage, setMyReportsRowsPerPage] = useState(10);
  const [myReportsTotal, setMyReportsTotal] = useState(0);

  // Team Reports State
  const [teamReports, setTeamReports] = useState<DailyReport[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [teamReportsPage, setTeamReportsPage] = useState(0);
  const [teamReportsRowsPerPage, setTeamReportsRowsPerPage] = useState(10);
  const [teamReportsTotal, setTeamReportsTotal] = useState(0);

  // View Report Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

  // Generate date options (today and past 7 days)
  const dateOptions = Array.from({ length: 8 }, (_, i) => {
    const date = subDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: i === 0 ? `Today (${format(date, 'MMM dd')})` : format(date, 'EEE, MMM dd'),
    };
  });

  const loadReportForDate = useCallback(async (date: string) => {
    try {
      setTodayLoading(true);
      const report = await dailyReportService.getReportByDate(date);
      setCurrentReport(report);
      if (report) {
        setTitle(report.title || '');
        setDescription(report.description || '');
      } else {
        setTitle('');
        setDescription('');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report');
    } finally {
      setTodayLoading(false);
    }
  }, []);

  const loadMyReports = useCallback(async () => {
    try {
      setMyReportsLoading(true);
      const data = await dailyReportService.getMyReports({
        page: myReportsPage + 1, // API uses 1-indexed pages
        limit: myReportsRowsPerPage,
      });
      setMyReports(data.reports);
      setMyReportsTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading my reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setMyReportsLoading(false);
    }
  }, [myReportsPage, myReportsRowsPerPage]);

  const loadTeamReports = useCallback(async () => {
    if (!isManagerOrAdmin) return;
    try {
      setTeamReportsLoading(true);
      const data = await dailyReportService.getTeamReports({
        page: teamReportsPage + 1, // API uses 1-indexed pages
        limit: teamReportsRowsPerPage,
        employeeId: selectedEmployee || undefined,
      });
      setTeamReports(data.reports);
      setTeamReportsTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading team reports:', error);
      toast.error('Failed to load team reports');
    } finally {
      setTeamReportsLoading(false);
    }
  }, [isManagerOrAdmin, teamReportsPage, teamReportsRowsPerPage, selectedEmployee]);

  const loadTeamMembers = useCallback(async () => {
    if (!isManagerOrAdmin) return;
    try {
      const data = await dailyReportService.getTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  }, [isManagerOrAdmin]);

  useEffect(() => {
    if (isManagerOrAdmin) {
      loadTeamMembers();
    }
  }, [loadTeamMembers, isManagerOrAdmin]);

  useEffect(() => {
    if (activeTab === 0) {
      loadReportForDate(selectedDate);
    } else if (activeTab === 1) {
      loadMyReports();
    } else if (activeTab === 2 && isManagerOrAdmin) {
      loadTeamReports();
    }
  }, [activeTab, selectedDate, loadReportForDate, loadMyReports, loadTeamReports, isManagerOrAdmin]);

  const handleSave = async (submit: boolean = false) => {
    if (!title.trim()) {
      toast.error('Please enter a title for your report');
      return;
    }

    try {
      setSubmitting(true);
      const report = await dailyReportService.createOrUpdateReport({
        reportDate: selectedDate,
        title: title.trim(),
        description: description.trim() || undefined,
      });

      if (submit) {
        await dailyReportService.submitReport(report.id);
        toast.success('Report submitted successfully');
      } else {
        toast.success('Report saved as draft');
      }

      loadReportForDate(selectedDate);
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error(error.response?.data?.message || 'Failed to save report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = (report: DailyReport) => {
    setViewingReport(report);
    setViewDialogOpen(true);
  };

  const renderTodayReport = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          select
          label="Report Date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          sx={{ minWidth: 200, ...textFieldSx }}
          size="small"
        >
          {dateOptions.map((option) => (
            <MenuItem key={option.value} value={option.value} sx={{ color: 'var(--text-primary)' }}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {currentReport && (
          <Chip
            label={currentReport.status.toUpperCase()}
            color={getStatusColor(currentReport.status)}
            size="small"
          />
        )}
      </Box>

      {currentReport?.status === 'submitted' ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          This report has been submitted on{' '}
          {currentReport.submittedAt &&
            format(parseISO(currentReport.submittedAt), 'MMM dd, yyyy HH:mm')}
        </Alert>
      ) : null}

      <Card sx={{ mb: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <CardContent>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your daily report..."
            disabled={currentReport?.status === 'submitted'}
            sx={{ mb: 3, ...textFieldSx }}
          />

          <TextField
            fullWidth
            multiline
            rows={8}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your work for the day..."
            disabled={currentReport?.status === 'submitted'}
            sx={textFieldSx}
          />
        </CardContent>
      </Card>

      {currentReport?.status !== 'submitted' && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={() => handleSave(false)}
            disabled={submitting}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => handleSave(true)}
            disabled={submitting}
          >
            Submit Report
          </Button>
        </Box>
      )}
    </Box>
  );

  const renderReportsList = (reports: DailyReport[], showUser: boolean = false) => (
    <Paper sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: 'var(--text-primary)' }}>Date</TableCell>
            {showUser && <TableCell sx={{ color: 'var(--text-primary)' }}>Employee</TableCell>}
            <TableCell sx={{ color: 'var(--text-primary)' }}>Title</TableCell>
            <TableCell sx={{ color: 'var(--text-primary)' }}>Status</TableCell>
            <TableCell sx={{ color: 'var(--text-primary)' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showUser ? 5 : 4} align="center">
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', py: 4 }}>
                  No reports found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell sx={{ color: 'var(--text-primary)' }}>
                  {format(parseISO(report.reportDate), 'EEE, MMM dd, yyyy')}
                </TableCell>
                {showUser && (
                  <TableCell sx={{ color: 'var(--text-primary)' }}>
                    {report.user?.firstName} {report.user?.lastName}
                  </TableCell>
                )}
                <TableCell sx={{ color: 'var(--text-primary)', maxWidth: 300 }}>
                  <Typography noWrap title={report.title}>
                    {report.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={report.status.toUpperCase()}
                    color={getStatusColor(report.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View Report">
                    <IconButton size="small" onClick={() => handleViewReport(report)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  );

  // Pagination handlers for My Reports
  const handleMyReportsPageChange = (_event: unknown, newPage: number) => {
    setMyReportsPage(newPage);
  };

  const handleMyReportsRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMyReportsRowsPerPage(parseInt(event.target.value, 10));
    setMyReportsPage(0);
  };

  const renderMyReports = () => (
    <Box>
      {myReportsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
        </Box>
      ) : (
        <>
          {renderReportsList(myReports)}
          <TablePagination
            component="div"
            count={myReportsTotal}
            page={myReportsPage}
            onPageChange={handleMyReportsPageChange}
            rowsPerPage={myReportsRowsPerPage}
            onRowsPerPageChange={handleMyReportsRowsPerPageChange}
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
        </>
      )}
    </Box>
  );

  // Pagination handlers for Team Reports
  const handleTeamReportsPageChange = (_event: unknown, newPage: number) => {
    setTeamReportsPage(newPage);
  };

  const handleTeamReportsRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTeamReportsRowsPerPage(parseInt(event.target.value, 10));
    setTeamReportsPage(0);
  };

  const renderTeamReports = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Filter by Employee"
          value={selectedEmployee}
          onChange={(e) => {
            setSelectedEmployee(e.target.value as number | '');
            setTeamReportsPage(0);
          }}
          sx={{ minWidth: 250, ...textFieldSx }}
          size="small"
        >
          <MenuItem value="" sx={{ color: 'var(--text-primary)' }}>All Employees</MenuItem>
          {teamMembers.map((member) => (
            <MenuItem key={member.id} value={member.id} sx={{ color: 'var(--text-primary)' }}>
              {member.firstName} {member.lastName}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {teamReportsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
        </Box>
      ) : (
        <>
          {renderReportsList(teamReports, true)}
          <TablePagination
            component="div"
            count={teamReportsTotal}
            page={teamReportsPage}
            onPageChange={handleTeamReportsPageChange}
            rowsPerPage={teamReportsRowsPerPage}
            onRowsPerPageChange={handleTeamReportsRowsPerPageChange}
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
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, color: 'var(--text-primary)' }}>
        Daily Reports
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'var(--border)' }}
      >
        <Tab
          icon={<CalendarToday />}
          iconPosition="start"
          label="Today's Report"
          sx={{ color: 'var(--text-primary)' }}
        />
        <Tab
          icon={<AccessTime />}
          iconPosition="start"
          label="My Reports"
          sx={{ color: 'var(--text-primary)' }}
        />
        {isManagerOrAdmin && (
          <Tab
            icon={<Person />}
            iconPosition="start"
            label="Team Reports"
            sx={{ color: 'var(--text-primary)' }}
          />
        )}
      </Tabs>

      {activeTab === 0 && !todayLoading && renderTodayReport()}
      {activeTab === 0 && todayLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
        </Box>
      )}
      {activeTab === 1 && renderMyReports()}
      {activeTab === 2 && isManagerOrAdmin && renderTeamReports()}

      {/* View Report Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'var(--surface)', color: 'var(--text-primary)' }}>
          Daily Report - {viewingReport && format(parseISO(viewingReport.reportDate), 'EEEE, MMMM dd, yyyy')}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'var(--surface)' }}>
          {viewingReport && (
            <Box sx={{ pt: 2 }}>
              {viewingReport.user && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)' }}>
                    Submitted by
                  </Typography>
                  <Typography sx={{ color: 'var(--text-primary)' }}>
                    {viewingReport.user.firstName} {viewingReport.user.lastName} ({viewingReport.user.email})
                  </Typography>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)' }}>
                  Status
                </Typography>
                <Chip
                  label={viewingReport.status.toUpperCase()}
                  color={getStatusColor(viewingReport.status)}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)' }}>
                  Title
                </Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {viewingReport.title}
                </Typography>
              </Box>

              {viewingReport.description && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--text-secondary)' }}>
                    Description
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'var(--background)' }}>
                    <Typography sx={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {viewingReport.description}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'var(--surface)' }}>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DailyReportsPage;
