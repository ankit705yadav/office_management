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
  Grid,
  Autocomplete,
  Paper,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Send,
  Visibility,
  CalendarToday,
  AccessTime,
  Person,
} from '@mui/icons-material';
import { format, subDays, parseISO, isValid } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import {
  dailyReportService,
  DailyReport,
  DailyReportEntry,
  TeamMember,
} from '@/services/dailyReport.service';
import { projectService, Project, Task } from '@/services/project.service';

interface ReportEntry {
  id?: number;
  projectId?: number;
  taskId?: number;
  description: string;
  hours: number;
  project?: { id: number; name: string; projectCode?: string };
  task?: { id: number; title: string; taskCode?: string };
}

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

const DailyReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Today's Report State
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentReport, setCurrentReport] = useState<DailyReport | null>(null);
  const [summary, setSummary] = useState('');
  const [entries, setEntries] = useState<ReportEntry[]>([{ description: '', hours: 0 }]);

  // Projects and Tasks
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTasks, setProjectTasks] = useState<{ [key: number]: Task[] }>({});

  // My Reports State
  const [myReports, setMyReports] = useState<DailyReport[]>([]);
  const [myReportsPage, setMyReportsPage] = useState(1);
  const [myReportsTotalPages, setMyReportsTotalPages] = useState(1);

  // Team Reports State
  const [teamReports, setTeamReports] = useState<DailyReport[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [teamReportsPage, setTeamReportsPage] = useState(1);
  const [teamReportsTotalPages, setTeamReportsTotalPages] = useState(1);

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

  const loadProjects = useCallback(async () => {
    try {
      const response = await projectService.getAllProjects({ status: 'active', limit: 100 });
      setProjects(response.items.filter((p: Project) => !p.isFolder));
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, []);

  const loadTasksForProject = async (projectId: number) => {
    if (projectTasks[projectId]) return;
    try {
      const response = await projectService.getAllTasks({ projectId, limit: 100 });
      setProjectTasks((prev) => ({ ...prev, [projectId]: response.items }));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadReportForDate = useCallback(async (date: string) => {
    try {
      setLoading(true);
      const report = await dailyReportService.getReportByDate(date);
      setCurrentReport(report);
      if (report) {
        setSummary(report.summary || '');
        setEntries(
          report.entries && report.entries.length > 0
            ? report.entries.map((e) => ({
                id: e.id,
                projectId: e.projectId,
                taskId: e.taskId,
                description: e.description,
                hours: e.hours,
                project: e.project,
                task: e.task,
              }))
            : [{ description: '', hours: 0 }]
        );
      } else {
        setSummary('');
        setEntries([{ description: '', hours: 0 }]);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dailyReportService.getMyReports({
        page: myReportsPage,
        limit: 10,
      });
      setMyReports(data.reports);
      setMyReportsTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading my reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [myReportsPage]);

  const loadTeamReports = useCallback(async () => {
    if (!isManagerOrAdmin) return;
    try {
      setLoading(true);
      const data = await dailyReportService.getTeamReports({
        page: teamReportsPage,
        limit: 10,
        employeeId: selectedEmployee || undefined,
      });
      setTeamReports(data.reports);
      setTeamReportsTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading team reports:', error);
      toast.error('Failed to load team reports');
    } finally {
      setLoading(false);
    }
  }, [isManagerOrAdmin, teamReportsPage, selectedEmployee]);

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
    loadProjects();
    if (isManagerOrAdmin) {
      loadTeamMembers();
    }
  }, [loadProjects, loadTeamMembers, isManagerOrAdmin]);

  useEffect(() => {
    if (activeTab === 0) {
      loadReportForDate(selectedDate);
    } else if (activeTab === 1) {
      loadMyReports();
    } else if (activeTab === 2 && isManagerOrAdmin) {
      loadTeamReports();
    }
  }, [activeTab, selectedDate, loadReportForDate, loadMyReports, loadTeamReports, isManagerOrAdmin]);

  const handleAddEntry = () => {
    setEntries([...entries, { description: '', hours: 0 }]);
  };

  const handleRemoveEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const handleEntryChange = (
    index: number,
    field: keyof ReportEntry,
    value: any
  ) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };

    // Clear task when project changes
    if (field === 'projectId') {
      newEntries[index].taskId = undefined;
      newEntries[index].task = undefined;
      if (value) {
        loadTasksForProject(value);
      }
    }

    setEntries(newEntries);
  };

  const calculateTotalHours = () => {
    return entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  };

  const handleSave = async (submit: boolean = false) => {
    // Validate entries
    const validEntries = entries.filter((e) => e.description.trim() && e.hours > 0);
    if (validEntries.length === 0) {
      toast.error('Please add at least one entry with description and hours');
      return;
    }

    try {
      setSubmitting(true);
      const report = await dailyReportService.createOrUpdateReport({
        reportDate: selectedDate,
        summary,
        entries: validEntries.map((e) => ({
          projectId: e.projectId,
          taskId: e.taskId,
          description: e.description,
          hours: e.hours,
        })),
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
          sx={{ minWidth: 200 }}
          size="small"
        >
          {dateOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
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

        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', ml: 'auto' }}>
          Total Hours: <strong>{calculateTotalHours().toFixed(1)}</strong>
        </Typography>
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
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'var(--text-primary)' }}>
            Work Entries
          </Typography>

          {entries.map((entry, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                p: 2,
                bgcolor: 'var(--background)',
                borderRadius: 1,
                flexWrap: 'wrap',
              }}
            >
              <Autocomplete
                options={projects}
                getOptionLabel={(option) =>
                  option.projectCode
                    ? `${option.name} (${option.projectCode})`
                    : option.name
                }
                value={projects.find((p) => p.id === entry.projectId) || null}
                onChange={(_, newValue) =>
                  handleEntryChange(index, 'projectId', newValue?.id || undefined)
                }
                renderInput={(params) => (
                  <TextField {...params} label="Project" size="small" />
                )}
                sx={{ minWidth: 200, flex: 1 }}
                disabled={currentReport?.status === 'submitted'}
              />

              {entry.projectId && projectTasks[entry.projectId] && (
                <Autocomplete
                  options={projectTasks[entry.projectId] || []}
                  getOptionLabel={(option) =>
                    option.taskCode
                      ? `${option.title} (${option.taskCode})`
                      : option.title
                  }
                  value={
                    projectTasks[entry.projectId]?.find((t) => t.id === entry.taskId) ||
                    null
                  }
                  onChange={(_, newValue) =>
                    handleEntryChange(index, 'taskId', newValue?.id || undefined)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Task" size="small" />
                  )}
                  sx={{ minWidth: 200, flex: 1 }}
                  disabled={currentReport?.status === 'submitted'}
                />
              )}

              <TextField
                label="Description"
                value={entry.description}
                onChange={(e) =>
                  handleEntryChange(index, 'description', e.target.value)
                }
                size="small"
                sx={{ flex: 2, minWidth: 200 }}
                multiline
                disabled={currentReport?.status === 'submitted'}
              />

              <TextField
                label="Hours"
                type="number"
                value={entry.hours}
                onChange={(e) =>
                  handleEntryChange(index, 'hours', parseFloat(e.target.value) || 0)
                }
                size="small"
                sx={{ width: 100 }}
                inputProps={{ min: 0, max: 24, step: 0.5 }}
                disabled={currentReport?.status === 'submitted'}
              />

              {entries.length > 1 && currentReport?.status !== 'submitted' && (
                <IconButton
                  onClick={() => handleRemoveEntry(index)}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              )}
            </Box>
          ))}

          {currentReport?.status !== 'submitted' && (
            <Button
              startIcon={<Add />}
              onClick={handleAddEntry}
              variant="outlined"
              size="small"
            >
              Add Entry
            </Button>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'var(--text-primary)' }}>
            Summary
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Write a summary of your day's work..."
            disabled={currentReport?.status === 'submitted'}
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
            <TableCell sx={{ color: 'var(--text-primary)' }}>Total Hours</TableCell>
            <TableCell sx={{ color: 'var(--text-primary)' }}>Entries</TableCell>
            <TableCell sx={{ color: 'var(--text-primary)' }}>Status</TableCell>
            <TableCell sx={{ color: 'var(--text-primary)' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showUser ? 6 : 5} align="center">
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
                <TableCell sx={{ color: 'var(--text-primary)' }}>{report.totalHours}h</TableCell>
                <TableCell sx={{ color: 'var(--text-primary)' }}>
                  {report.entries?.length || 0} entries
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

  const renderMyReports = () => (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderReportsList(myReports)}
          {myReportsTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
              <Button
                disabled={myReportsPage <= 1}
                onClick={() => setMyReportsPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>
                Page {myReportsPage} of {myReportsTotalPages}
              </Typography>
              <Button
                disabled={myReportsPage >= myReportsTotalPages}
                onClick={() => setMyReportsPage((p) => p + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );

  const renderTeamReports = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Filter by Employee"
          value={selectedEmployee}
          onChange={(e) => {
            setSelectedEmployee(e.target.value as number | '');
            setTeamReportsPage(1);
          }}
          sx={{ minWidth: 250 }}
          size="small"
        >
          <MenuItem value="">All Employees</MenuItem>
          {teamMembers.map((member) => (
            <MenuItem key={member.id} value={member.id}>
              {member.firstName} {member.lastName}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderReportsList(teamReports, true)}
          {teamReportsTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
              <Button
                disabled={teamReportsPage <= 1}
                onClick={() => setTeamReportsPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>
                Page {teamReportsPage} of {teamReportsTotalPages}
              </Typography>
              <Button
                disabled={teamReportsPage >= teamReportsTotalPages}
                onClick={() => setTeamReportsPage((p) => p + 1)}
              >
                Next
              </Button>
            </Box>
          )}
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

      {activeTab === 0 && !loading && renderTodayReport()}
      {activeTab === 0 && loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
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
                  Total Hours
                </Typography>
                <Typography sx={{ color: 'var(--text-primary)' }}>
                  {viewingReport.totalHours} hours
                </Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--text-secondary)' }}>
                Work Entries
              </Typography>
              <Paper sx={{ mb: 2, bgcolor: 'var(--background)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'var(--text-primary)' }}>Project</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)' }}>Task</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)' }}>Description</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)' }}>Hours</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingReport.entries?.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ color: 'var(--text-primary)' }}>
                          {entry.project?.name || '-'}
                          {entry.project?.projectCode && (
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                              {entry.project.projectCode}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)' }}>
                          {entry.task?.title || '-'}
                          {entry.task?.taskCode && (
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                              {entry.task.taskCode}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)' }}>{entry.description}</TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)' }}>{entry.hours}h</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              {viewingReport.summary && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--text-secondary)' }}>
                    Summary
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'var(--background)' }}>
                    <Typography sx={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {viewingReport.summary}
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
