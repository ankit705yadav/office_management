import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Block,
  PlayArrow,
  Warning,
  Approval,
} from '@mui/icons-material';
import { projectService, UserTaskReport, TaskReportsResponse, Project } from '../../services/project.service';

interface TaskReportPanelProps {
  projectId?: number;
}

const TaskReportPanel: React.FC<TaskReportPanelProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<UserTaskReport[]>([]);
  const [totals, setTotals] = useState<TaskReportsResponse['totals'] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadReports();
  }, [projectId, selectedProjectId]);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAllProjects({ status: 'active', limit: 100 });
      setProjects(response.items);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const filterProjectId = projectId || selectedProjectId || undefined;
      const data = await projectService.getTaskReports({
        projectId: filterProjectId ? Number(filterProjectId) : undefined,
      });
      setReports(data.reports);
      setTotals(data.totals);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionRate = (report: UserTaskReport) => {
    if (report.stats.total === 0) return 0;
    return Math.round(((report.stats.done + report.stats.approved) / report.stats.total) * 100);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filters */}
      {!projectId && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Project</InputLabel>
            <Select
              value={selectedProjectId}
              label="Filter by Project"
              onChange={(e) => setSelectedProjectId(e.target.value as number | '')}
            >
              <MenuItem value="">All Projects</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Summary Cards */}
      {totals && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">Total Tasks</Typography>
            <Typography variant="h5" fontWeight="bold">{totals.total}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">To Do</Typography>
            <Typography variant="h5" fontWeight="bold" color="info.main">{totals.todo}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">In Progress</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary.main">{totals.inProgress}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">Done</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">{totals.done}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">Approved</Typography>
            <Typography variant="h5" fontWeight="bold" color="secondary.main">{totals.approved}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">Blocked</Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main">{totals.blocked}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">Overdue</Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main">{totals.overdue}</Typography>
          </Paper>
        </Box>
      )}

      {/* Report Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="center">Total</TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Schedule fontSize="small" color="info" />
                  To Do
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <PlayArrow fontSize="small" color="primary" />
                  In Progress
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <CheckCircle fontSize="small" color="success" />
                  Done
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Approval fontSize="small" color="secondary" />
                  Approved
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Block fontSize="small" color="warning" />
                  Blocked
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Warning fontSize="small" color="error" />
                  Overdue
                </Box>
              </TableCell>
              <TableCell align="center">Completion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No task data found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const completionRate = getCompletionRate(report);
                return (
                  <TableRow key={report.user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={report.user.profileImageUrl}
                          sx={{ width: 32, height: 32 }}
                        >
                          {report.user.firstName[0]}{report.user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.user.firstName} {report.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {report.user.department?.name || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={report.stats.total} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="info.main">{report.stats.todo}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="primary.main">{report.stats.inProgress}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="success.main">{report.stats.done}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="secondary.main">{report.stats.approved}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="warning.main">{report.stats.blocked}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="error.main" fontWeight={report.stats.overdue > 0 ? 'bold' : 'normal'}>
                        {report.stats.overdue}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={completionRate}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          color={completionRate >= 80 ? 'success' : completionRate >= 50 ? 'primary' : 'warning'}
                        />
                        <Typography variant="caption" sx={{ minWidth: 35 }}>
                          {completionRate}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TaskReportPanel;
