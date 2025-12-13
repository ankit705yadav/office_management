import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  EventAvailable,
  Pending,
  Cake,
  WorkHistory,
  CalendarMonth,
  TrendingUp,
  Groups,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/services/dashboard.service';
import StatCard from '@/components/cards/StatCard';
import LeaveCalendar from '@/components/calendar/LeaveCalendar';
import EmployeesOnLeave from '@/components/dashboard/EmployeesOnLeave';
import type { DashboardStats, Birthday, WorkAnniversary } from '@/types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [anniversaries, setAnniversaries] = useState<WorkAnniversary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, birthdaysData, anniversariesData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getBirthdays(5),
        dashboardService.getAnniversaries(5),
      ]);

      setStats(statsData);
      setBirthdays(birthdaysData);
      setAnniversaries(anniversariesData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Calculate totals
  const totalLeaveBalance = stats?.user.leaveBalance
    ? Number(stats.user.leaveBalance.sickLeave) +
      Number(stats.user.leaveBalance.casualLeave) +
      Number(stats.user.leaveBalance.earnedLeave) +
      Number(stats.user.leaveBalance.compOff)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Leave Balance */}
        <StatCard
          title="Leave Balance"
          value={totalLeaveBalance.toFixed(1)}
          subtitle="days"
          trend={10}
          icon={<EventAvailable sx={{ fontSize: 16, color: '#3B82F6' }} />}
          iconBgColor="rgba(59, 130, 246, 0.15)"
        />

        {/* Pending Requests */}
        <StatCard
          title="Pending Requests"
          value={stats?.leaves.pending || 0}
          subtitle="awaiting"
          trend={stats?.leaves.pending ? -20 : 0}
          icon={<Pending sx={{ fontSize: 16, color: '#F59E0B' }} />}
          iconBgColor="rgba(245, 158, 11, 0.15)"
        />

        {/* Approved Leaves */}
        <StatCard
          title="Approved Leaves"
          value={stats?.leaves.approved || 0}
          subtitle="this month"
          icon={<CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />}
          iconBgColor="rgba(16, 185, 129, 0.15)"
        />

        {/* Pending Approvals (Manager/Admin) */}
        {user?.role !== 'employee' && stats?.approvals && (
          <StatCard
            title="Pending Approvals"
            value={stats.approvals.pending}
            subtitle="action"
            trend={30}
            icon={<TrendingUp sx={{ fontSize: 16, color: '#EF4444' }} />}
            iconBgColor="rgba(239, 68, 68, 0.15)"
          />
        )}

        {/* Total Employees (Admin) */}
        {user?.role === 'admin' && stats?.admin && (
          <StatCard
            title="Employees"
            value={stats.admin.totalEmployees}
            subtitle="active"
            trend={5}
            icon={<Groups sx={{ fontSize: 16, color: '#8B5CF6' }} />}
            iconBgColor="rgba(139, 92, 246, 0.15)"
          />
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leave Balance Breakdown */}
        <div
          className="rounded-xl p-5"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <h3
            className="text-base font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Leave Balance Breakdown
          </h3>
          {stats?.user.leaveBalance ? (
            <div className="space-y-2">
              {[
                { label: 'Sick Leave', value: stats.user.leaveBalance.sickLeave, color: '#EF4444' },
                { label: 'Casual Leave', value: stats.user.leaveBalance.casualLeave, color: '#F59E0B' },
                { label: 'Earned Leave', value: stats.user.leaveBalance.earnedLeave, color: '#10B981' },
                { label: 'Comp Off', value: stats.user.leaveBalance.compOff, color: '#8B5CF6' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="text-base font-semibold"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No leave balance data</p>
          )}
        </div>

        {/* Upcoming Birthdays */}
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
              style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)' }}
            >
              <Cake sx={{ fontSize: 18, color: '#EC4899' }} />
            </div>
            <h3
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Upcoming Birthdays
            </h3>
          </div>
          {birthdays.length > 0 ? (
            <div className="space-y-2">
              {birthdays.map((birthday) => (
                <div
                  key={birthday.id}
                  className="flex items-center gap-3 p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: '#EC4899',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {birthday.firstName[0]}
                    {birthday.lastName[0]}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {birthday.firstName} {birthday.lastName}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {format(new Date(birthday.dateOfBirth), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              No upcoming birthdays this month
            </p>
          )}
        </div>

        {/* Work Anniversaries */}
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
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
            >
              <WorkHistory sx={{ fontSize: 18, color: '#6366F1' }} />
            </div>
            <h3
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Work Anniversaries
            </h3>
          </div>
          {anniversaries.length > 0 ? (
            <div className="space-y-2">
              {anniversaries.map((anniversary) => (
                <div
                  key={anniversary.id}
                  className="flex items-center gap-3 p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: '#6366F1',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {anniversary.firstName[0]}
                    {anniversary.lastName[0]}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {anniversary.firstName} {anniversary.lastName}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {anniversary.yearsOfService}{' '}
                      {anniversary.yearsOfService === 1 ? 'year' : 'years'} •{' '}
                      {format(new Date(anniversary.dateOfJoining), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              No work anniversaries this month
            </p>
          )}
        </div>
      </div>

      {/* Employees On Leave (Manager/Admin only) */}
      {user?.role !== 'employee' && <EmployeesOnLeave />}

      {/* Leave & Holiday Calendar */}
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
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
          >
            <CalendarMonth sx={{ fontSize: 18, color: '#3B82F6' }} />
          </div>
          <h3
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Leave & Holiday Calendar
          </h3>
        </div>
        <LeaveCalendar />
      </div>

      {/* Quick Actions */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <h3
          className="text-base font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/leaves')}
            className="btn-primary flex items-center gap-2"
          >
            <EventAvailable sx={{ fontSize: 18 }} />
            Apply for Leave
          </button>
          <button
            onClick={() => navigate('/holidays')}
            className="btn-secondary flex items-center gap-2"
          >
            <CalendarMonth sx={{ fontSize: 18 }} />
            View Holidays
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className="btn-ghost flex items-center gap-2"
          >
            <WorkHistory sx={{ fontSize: 18 }} />
            Mark Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
