import React, { useEffect, useState } from 'react';
import { Avatar, CircularProgress, Chip, Tooltip } from '@mui/material';
import { EventBusy, Schedule, Person } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { dashboardService } from '@/services/dashboard.service';
import type { EmployeeOnLeave } from '@/types';

const EmployeesOnLeave: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeOnLeave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployeesOnLeave();
  }, []);

  const loadEmployeesOnLeave = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getEmployeesOnLeave();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees on leave:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLeaveType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex justify-center items-center h-[200px]">
          <CircularProgress size={32} sx={{ color: 'var(--accent-primary)' }} />
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return null;
  }

  const currentlyOnLeave = employees.filter((e) => e.isCurrentlyOnLeave);
  const upcomingLeaves = employees.filter((e) => !e.isCurrentlyOnLeave);

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
        >
          <EventBusy sx={{ fontSize: 18, color: '#EF4444' }} />
        </div>
        <h3
          className="text-base font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Team Leave Status
        </h3>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#EF4444',
          }}
        >
          {employees.length} total
        </span>
      </div>

      {/* Currently On Leave */}
      {currentlyOnLeave.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Person sx={{ fontSize: 16, color: '#EF4444' }} />
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Currently On Leave ({currentlyOnLeave.length})
            </span>
          </div>
          <div className="space-y-2">
            {currentlyOnLeave.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <Avatar
                  src={leave.employee.profileImageUrl}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#EF4444',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {leave.employee.firstName[0]}
                  {leave.employee.lastName[0]}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {leave.employee.firstName} {leave.employee.lastName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {leave.employee.department?.name || 'No Department'} •{' '}
                    <span className="capitalize">{leave.employee.role}</span>
                  </p>
                </div>
                <div className="text-right">
                  <Tooltip title={leave.reason}>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full cursor-help"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#EF4444',
                      }}
                    >
                      {formatLeaveType(leave.leaveType)}
                    </span>
                  </Tooltip>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {format(parseISO(leave.startDate), 'MMM dd')} -{' '}
                    {format(parseISO(leave.endDate), 'MMM dd')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Leaves */}
      {upcomingLeaves.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Schedule sx={{ fontSize: 16, color: '#F59E0B' }} />
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Upcoming Leaves ({upcomingLeaves.length})
            </span>
          </div>
          <div className="space-y-2">
            {upcomingLeaves.slice(0, 5).map((leave) => (
              <div
                key={leave.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <Avatar
                  src={leave.employee.profileImageUrl}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#F59E0B',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {leave.employee.firstName[0]}
                  {leave.employee.lastName[0]}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {leave.employee.firstName} {leave.employee.lastName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {leave.employee.department?.name || 'No Department'} •{' '}
                    <span className="capitalize">{leave.employee.role}</span>
                  </p>
                </div>
                <div className="text-right">
                  <Tooltip title={leave.reason}>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full cursor-help"
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#F59E0B',
                      }}
                    >
                      {formatLeaveType(leave.leaveType)}
                    </span>
                  </Tooltip>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {format(parseISO(leave.startDate), 'MMM dd')} -{' '}
                    {format(parseISO(leave.endDate), 'MMM dd')}
                  </p>
                </div>
              </div>
            ))}
            {upcomingLeaves.length > 5 && (
              <p
                className="text-xs text-center py-2"
                style={{ color: 'var(--text-muted)' }}
              >
                +{upcomingLeaves.length - 5} more upcoming leaves
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesOnLeave;
