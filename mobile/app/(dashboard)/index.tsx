// Dashboard home screen

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Avatar,
  IconButton,
  Divider,
  Button,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
} from 'date-fns';
import dashboardService from '../../services/dashboard.service';
import projectService from '../../services/project.service';
import holidayService from '../../services/holiday.service';
import leaveService from '../../services/leave.service';
import {
  DashboardStats,
  Birthday,
  WorkAnniversary,
  EmployeeOnLeave,
  LeaveBalance,
  Task,
  Holiday,
  LeaveRequest,
} from '../../types';

export default function DashboardScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useAppTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [anniversaries, setAnniversaries] = useState<WorkAnniversary[]>([]);
  const [employeesOnLeave, setEmployeesOnLeave] = useState<EmployeeOnLeave[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const loadDashboardData = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const [
        statsData,
        birthdaysData,
        anniversariesData,
        leaveData,
        tasksData,
        holidaysData,
        myLeavesData,
      ] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getBirthdays(5),
        dashboardService.getAnniversaries(5),
        isManagerOrAdmin ? dashboardService.getEmployeesOnLeave() : Promise.resolve([]),
        projectService.getMyTasks(10),
        holidayService.getHolidays(currentYear),
        leaveService.getMyLeaves(100),
      ]);

      setStats(statsData);
      setBirthdays(birthdaysData);
      setAnniversaries(anniversariesData);
      setEmployeesOnLeave(leaveData);
      // Filter for pending tasks (todo or in_progress)
      const pending = (tasksData.items || []).filter(
        (t) => t.status === 'todo' || t.status === 'in_progress'
      );
      setPendingTasks(pending.slice(0, 5));
      setHolidays(holidaysData);
      setMyLeaves(myLeavesData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [isManagerOrAdmin]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const formatLeaveValue = (value: number | string | undefined): string => {
    const num = Number(value || 0);
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  const getTotalLeaveBalance = (balance?: LeaveBalance | null): string => {
    if (!balance) return '0';
    const total =
      Number(balance.sickLeave || 0) +
      Number(balance.casualLeave || 0) +
      Number(balance.earnedLeave || 0) +
      Number(balance.compOff || 0) +
      Number(balance.paternityMaternity || 0);
    return Number.isInteger(total) ? total.toString() : total.toFixed(1);
  };

  const formatBirthday = (dateOfBirth: string): string => {
    try {
      const date = parseISO(dateOfBirth);
      return format(date, 'MMM d');
    } catch {
      return '--';
    }
  };

  const formatLeaveDate = (dateStr: string): string => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return '--';
    }
  };

  const getLeaveTypeColor = (leaveType: string): string => {
    const colors: Record<string, string> = {
      sick: '#EF4444',
      casual: '#F59E0B',
      earned: '#10B981',
      comp_off: '#8B5CF6',
      paternity: '#3B82F6',
      maternity: '#EC4899',
    };
    return colors[leaveType] || theme.colors.primary;
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      urgent: '#DC2626',
      high: '#F97316',
      medium: '#3B82F6',
      low: '#22C55E',
    };
    return colors[priority] || theme.colors.primary;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      todo: '#6B7280',
      in_progress: '#3B82F6',
      done: '#22C55E',
      blocked: '#DC2626',
    };
    return colors[status] || theme.colors.primary;
  };

  const formatDueDate = (dueDate?: string): { text: string; isOverdue: boolean } => {
    if (!dueDate) return { text: 'No due date', isOverdue: false };
    try {
      const date = parseISO(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isOverdue = isBefore(date, today);
      return { text: format(date, 'MMM d'), isOverdue };
    } catch {
      return { text: '--', isOverdue: false };
    }
  };

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    const startDay = getDay(start);
    // Add empty slots for days before the month starts
    const emptySlots = Array(startDay).fill(null);
    return [...emptySlots, ...days];
  }, [calendarMonth]);

  const getCalendarEvents = useCallback(
    (date: Date) => {
      const events: { type: 'holiday' | 'leave'; data: Holiday | LeaveRequest }[] = [];

      // Check holidays
      holidays.forEach((holiday) => {
        try {
          const holidayDate = parseISO(holiday.date);
          if (isSameDay(holidayDate, date)) {
            events.push({ type: 'holiday', data: holiday });
          }
        } catch {
          // Skip invalid dates
        }
      });

      // Check leaves
      myLeaves.forEach((leave) => {
        try {
          const startDate = parseISO(leave.startDate);
          const endDate = parseISO(leave.endDate);
          if (date >= startDate && date <= endDate) {
            events.push({ type: 'leave', data: leave });
          }
        } catch {
          // Skip invalid dates
        }
      });

      return events;
    },
    [holidays, myLeaves]
  );

  const getDateIndicator = useCallback(
    (date: Date) => {
      const events = getCalendarEvents(date);
      const hasHoliday = events.some((e) => e.type === 'holiday');
      const hasApprovedLeave = events.some(
        (e) => e.type === 'leave' && (e.data as LeaveRequest).status === 'approved'
      );
      const hasPendingLeave = events.some(
        (e) => e.type === 'leave' && (e.data as LeaveRequest).status === 'pending'
      );
      const hasOptionalHoliday = events.some(
        (e) => e.type === 'holiday' && (e.data as Holiday).isOptional
      );

      if (hasHoliday && !hasOptionalHoliday) return '#DC2626'; // Red for mandatory holiday
      if (hasApprovedLeave) return '#22C55E'; // Green for approved leave
      if (hasPendingLeave || hasOptionalHoliday) return '#F97316'; // Orange for pending/optional
      return null;
    },
    [getCalendarEvents]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  const leaveBalance = stats?.user?.leaveBalance;
  const currentOnLeave = employeesOnLeave.filter((e) => e.isCurrentlyOnLeave);
  const upcomingLeaves = employeesOnLeave.filter((e) => !e.isCurrentlyOnLeave);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerLeft}>
          <Avatar.Text
            size={40}
            label={getInitials(user?.firstName, user?.lastName)}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <View style={styles.headerText}>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>
              Hi, {user?.firstName}!
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {format(new Date(), 'EEEE, MMM d')}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon={isDark ? 'weather-sunny' : 'weather-night'}
            size={22}
            onPress={toggleTheme}
          />
          <IconButton
            icon="bell-outline"
            size={22}
            onPress={() => {
              // TODO: Navigate to notifications
            }}
          />
          <IconButton icon="logout" size={22} onPress={handleLogout} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards - Horizontal Scroll */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Overview
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <Card style={[styles.statCardHorizontal, { backgroundColor: theme.colors.primaryContainer }]}>
            <Card.Content>
              <MaterialCommunityIcons name="calendar-account" size={24} color={theme.colors.primary} />
              <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 8 }}>
                {getTotalLeaveBalance(leaveBalance)}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                Leave Balance
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCardHorizontal, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Card.Content>
              <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.secondary} />
              <Text variant="headlineMedium" style={{ color: theme.colors.secondary, fontWeight: 'bold', marginTop: 8 }}>
                {stats?.leaves?.pending || 0}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
                Pending Requests
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCardHorizontal, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <Card.Content>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color={theme.colors.tertiary} />
              <Text variant="headlineMedium" style={{ color: theme.colors.tertiary, fontWeight: 'bold', marginTop: 8 }}>
                {stats?.leaves?.approved || 0}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onTertiaryContainer }}>
                Approved (Month)
              </Text>
            </Card.Content>
          </Card>

          {isManagerOrAdmin && (
            <Card style={[styles.statCardHorizontal, { backgroundColor: '#FEF3C7' }]}>
              <Card.Content>
                <MaterialCommunityIcons name="account-check-outline" size={24} color="#D97706" />
                <Text variant="headlineMedium" style={{ color: '#D97706', fontWeight: 'bold', marginTop: 8 }}>
                  {stats?.approvals?.pending || 0}
                </Text>
                <Text variant="bodySmall" style={{ color: '#92400E' }}>
                  Pending Approvals
                </Text>
              </Card.Content>
            </Card>
          )}

          {isAdmin && (
            <Card style={[styles.statCardHorizontal, { backgroundColor: '#DBEAFE' }]}>
              <Card.Content>
                <MaterialCommunityIcons name="account-group" size={24} color="#2563EB" />
                <Text variant="headlineMedium" style={{ color: '#2563EB', fontWeight: 'bold', marginTop: 8 }}>
                  {stats?.admin?.totalEmployees || 0}
                </Text>
                <Text variant="bodySmall" style={{ color: '#1E40AF' }}>
                  Total Employees
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        {/* Leave Balance Breakdown */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Leave Balance
        </Text>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.leaveBalanceRow}>
              <View style={styles.leaveBalanceItem}>
                <View style={[styles.leaveIndicator, { backgroundColor: '#EF4444' }]} />
                <View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Sick Leave</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '600' }}>{formatLeaveValue(leaveBalance?.sickLeave)}</Text>
                </View>
              </View>
              <View style={styles.leaveBalanceItem}>
                <View style={[styles.leaveIndicator, { backgroundColor: '#F59E0B' }]} />
                <View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Casual Leave</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '600' }}>{formatLeaveValue(leaveBalance?.casualLeave)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.leaveBalanceRow, { marginTop: 16 }]}>
              <View style={styles.leaveBalanceItem}>
                <View style={[styles.leaveIndicator, { backgroundColor: '#10B981' }]} />
                <View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Earned Leave</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '600' }}>{formatLeaveValue(leaveBalance?.earnedLeave)}</Text>
                </View>
              </View>
              <View style={styles.leaveBalanceItem}>
                <View style={[styles.leaveIndicator, { backgroundColor: '#8B5CF6' }]} />
                <View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Comp Off</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '600' }}>{formatLeaveValue(leaveBalance?.compOff)}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          <Card
            style={[styles.actionCard, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={() => router.push('/(dashboard)/attendance')}
          >
            <Card.Content style={styles.actionContent}>
              <MaterialCommunityIcons
                name="clock-check-outline"
                size={28}
                color={theme.colors.primary}
              />
              <Text variant="labelMedium" style={{ marginTop: 8 }}>
                Check In
              </Text>
            </Card.Content>
          </Card>

          <Card
            style={[styles.actionCard, { backgroundColor: theme.colors.secondaryContainer }]}
            onPress={() => router.push('/(dashboard)/leaves')}
          >
            <Card.Content style={styles.actionContent}>
              <MaterialCommunityIcons
                name="calendar-plus"
                size={28}
                color={theme.colors.secondary}
              />
              <Text variant="labelMedium" style={{ marginTop: 8 }}>
                Apply Leave
              </Text>
            </Card.Content>
          </Card>

          <Card
            style={[styles.actionCard, { backgroundColor: theme.colors.tertiaryContainer }]}
            onPress={() => router.push('/(dashboard)/daily-reports')}
          >
            <Card.Content style={styles.actionContent}>
              <MaterialCommunityIcons
                name="file-document-edit-outline"
                size={28}
                color={theme.colors.tertiary}
              />
              <Text variant="labelMedium" style={{ marginTop: 8 }}>
                Daily Report
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* My Pending Tasks */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          My Pending Tasks
        </Text>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {pendingTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="checkbox-marked-circle-outline"
                  size={40}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
                >
                  No pending tasks
                </Text>
              </View>
            ) : (
              pendingTasks.map((task, index) => {
                const dueInfo = formatDueDate(task.dueDate);
                return (
                  <View key={task.id}>
                    <TouchableOpacity
                      style={styles.taskItem}
                      onPress={() => router.push('/(dashboard)/projects')}
                    >
                      <View
                        style={[
                          styles.taskPriorityBar,
                          { backgroundColor: getPriorityColor(task.priority) },
                        ]}
                      />
                      <View style={styles.taskContent}>
                        <Text variant="bodyLarge" style={{ fontWeight: '500' }} numberOfLines={1}>
                          {task.title}
                        </Text>
                        <View style={styles.taskMeta}>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {task.project?.name || 'No project'}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={{
                              color: dueInfo.isOverdue ? '#DC2626' : theme.colors.onSurfaceVariant,
                            }}
                          >
                            {' · '}
                            {dueInfo.isOverdue ? 'Overdue: ' : 'Due: '}
                            {dueInfo.text}
                          </Text>
                        </View>
                        <View style={styles.taskBadges}>
                          <View
                            style={[
                              styles.taskStatusBadge,
                              { backgroundColor: getStatusColor(task.status) + '20' },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                color: getStatusColor(task.status),
                                fontWeight: '600',
                              }}
                            >
                              {task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.taskStatusBadge,
                              { backgroundColor: getPriorityColor(task.priority) + '20' },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                color: getPriorityColor(task.priority),
                                fontWeight: '600',
                              }}
                            >
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {index < pendingTasks.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                  </View>
                );
              })
            )}
          </Card.Content>
        </Card>

        {/* Leave & Holiday Calendar */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Calendar
        </Text>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <IconButton
                icon="chevron-left"
                size={20}
                onPress={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              />
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {format(calendarMonth, 'MMMM yyyy')}
              </Text>
              <IconButton
                icon="chevron-right"
                size={20}
                onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              />
              <Button
                mode="text"
                compact
                onPress={() => {
                  setCalendarMonth(new Date());
                  setSelectedDate(new Date());
                }}
              >
                Today
              </Button>
            </View>

            {/* Weekday Headers */}
            <View style={styles.calendarWeekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text
                  key={day}
                  variant="labelSmall"
                  style={[styles.calendarWeekDay, { color: theme.colors.onSurfaceVariant }]}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.calendarDay} />;
                }

                const indicator = getDateIndicator(date);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);

                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[
                      styles.calendarDay,
                      isSelected && {
                        backgroundColor: theme.colors.primaryContainer,
                        borderRadius: 8,
                      },
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      variant="bodyMedium"
                      style={[
                        isTodayDate && { fontWeight: 'bold', color: theme.colors.primary },
                        isSelected && { color: theme.colors.onPrimaryContainer },
                      ]}
                    >
                      {format(date, 'd')}
                    </Text>
                    {indicator && (
                      <View style={[styles.calendarIndicator, { backgroundColor: indicator }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                <Text variant="labelSmall">Holiday</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                <Text variant="labelSmall">Approved</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                <Text variant="labelSmall">Pending</Text>
              </View>
            </View>

            {/* Selected Date Events */}
            {selectedDate && (
              <View style={styles.selectedDateEvents}>
                <Divider style={{ marginVertical: 12 }} />
                <Text variant="labelLarge" style={{ marginBottom: 8 }}>
                  {format(selectedDate, 'EEEE, MMMM d')}
                </Text>
                {(() => {
                  const events = getCalendarEvents(selectedDate);
                  if (events.length === 0) {
                    return (
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        No events on this day
                      </Text>
                    );
                  }
                  return events.map((event, idx) => (
                    <View key={idx} style={styles.eventItem}>
                      <View
                        style={[
                          styles.eventDot,
                          {
                            backgroundColor:
                              event.type === 'holiday'
                                ? (event.data as Holiday).isOptional
                                  ? '#F97316'
                                  : '#DC2626'
                                : (event.data as LeaveRequest).status === 'approved'
                                  ? '#22C55E'
                                  : '#F97316',
                          },
                        ]}
                      />
                      <Text variant="bodySmall">
                        {event.type === 'holiday'
                          ? `${(event.data as Holiday).name}${(event.data as Holiday).isOptional ? ' (Optional)' : ''}`
                          : `${(event.data as LeaveRequest).leaveType.replace('_', ' ')} Leave (${(event.data as LeaveRequest).status})`}
                      </Text>
                    </View>
                  ));
                })()}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Upcoming Birthdays */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Upcoming Birthdays
        </Text>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {birthdays.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="cake-variant-outline"
                  size={40}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
                >
                  No upcoming birthdays
                </Text>
              </View>
            ) : (
              birthdays.map((birthday, index) => (
                <View key={birthday.id}>
                  <View style={styles.listItem}>
                    <Avatar.Text
                      size={40}
                      label={getInitials(birthday.firstName, birthday.lastName)}
                      style={{ backgroundColor: theme.colors.primaryContainer }}
                      labelStyle={{ color: theme.colors.primary }}
                    />
                    <View style={styles.listItemText}>
                      <Text variant="bodyLarge" style={{ fontWeight: '500' }}>
                        {birthday.firstName} {birthday.lastName}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {birthday.department?.name || 'No department'}
                      </Text>
                    </View>
                    <Chip
                      icon="cake-variant"
                      compact
                      style={{ backgroundColor: theme.colors.primaryContainer }}
                      textStyle={{ color: theme.colors.primary, fontSize: 12 }}
                    >
                      {formatBirthday(birthday.dateOfBirth)}
                    </Chip>
                  </View>
                  {index < birthdays.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Work Anniversaries */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Work Anniversaries
        </Text>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {anniversaries.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="star-outline"
                  size={40}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
                >
                  No upcoming work anniversaries
                </Text>
              </View>
            ) : (
              anniversaries.map((anniversary, index) => (
                <View key={anniversary.id}>
                  <View style={styles.listItem}>
                    <Avatar.Text
                      size={40}
                      label={getInitials(anniversary.firstName, anniversary.lastName)}
                      style={{ backgroundColor: theme.colors.secondaryContainer }}
                      labelStyle={{ color: theme.colors.secondary }}
                    />
                    <View style={styles.listItemText}>
                      <Text variant="bodyLarge" style={{ fontWeight: '500' }}>
                        {anniversary.firstName} {anniversary.lastName}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {anniversary.department?.name || 'No department'}
                      </Text>
                    </View>
                    <Chip
                      icon="star"
                      compact
                      style={{ backgroundColor: theme.colors.secondaryContainer }}
                      textStyle={{ color: theme.colors.secondary, fontSize: 12 }}
                    >
                      {anniversary.yearsOfService} {anniversary.yearsOfService === 1 ? 'year' : 'years'}
                    </Chip>
                  </View>
                  {index < anniversaries.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Team Leave Status (Manager/Admin only) */}
        {isManagerOrAdmin && (currentOnLeave.length > 0 || upcomingLeaves.length > 0) && (
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Team Leave Status
            </Text>
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                {currentOnLeave.length > 0 && (
                  <View>
                    <Text variant="labelLarge" style={{ color: theme.colors.error, marginBottom: 12 }}>
                      Currently on Leave
                    </Text>
                    {currentOnLeave.map((leave, index) => (
                      <View key={leave.id}>
                        <View style={styles.leaveListItem}>
                          <Avatar.Text
                            size={36}
                            label={getInitials(leave.employee.firstName, leave.employee.lastName)}
                            style={{ backgroundColor: theme.colors.errorContainer }}
                            labelStyle={{ color: theme.colors.error }}
                          />
                          <View style={styles.listItemText}>
                            <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                              {leave.employee.firstName} {leave.employee.lastName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View
                                style={[
                                  styles.leaveTypeBadge,
                                  { backgroundColor: getLeaveTypeColor(leave.leaveType) + '20' },
                                ]}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    color: getLeaveTypeColor(leave.leaveType),
                                    fontWeight: '600',
                                  }}
                                >
                                  {leave.leaveType.replace('_', ' ').toUpperCase()}
                                </Text>
                              </View>
                              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                {formatLeaveDate(leave.startDate)} - {formatLeaveDate(leave.endDate)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {index < currentOnLeave.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                      </View>
                    ))}
                  </View>
                )}

                {currentOnLeave.length > 0 && upcomingLeaves.length > 0 && (
                  <Divider style={{ marginVertical: 16 }} />
                )}

                {upcomingLeaves.length > 0 && (
                  <View>
                    <Text variant="labelLarge" style={{ color: theme.colors.primary, marginBottom: 12 }}>
                      Upcoming Leaves (Next 30 days)
                    </Text>
                    {upcomingLeaves.slice(0, 5).map((leave, index) => (
                      <View key={leave.id}>
                        <View style={styles.leaveListItem}>
                          <Avatar.Text
                            size={36}
                            label={getInitials(leave.employee.firstName, leave.employee.lastName)}
                            style={{ backgroundColor: theme.colors.surfaceVariant }}
                            labelStyle={{ color: theme.colors.onSurfaceVariant }}
                          />
                          <View style={styles.listItemText}>
                            <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                              {leave.employee.firstName} {leave.employee.lastName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View
                                style={[
                                  styles.leaveTypeBadge,
                                  { backgroundColor: getLeaveTypeColor(leave.leaveType) + '20' },
                                ]}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    color: getLeaveTypeColor(leave.leaveType),
                                    fontWeight: '600',
                                  }}
                                >
                                  {leave.leaveType.replace('_', ' ').toUpperCase()}
                                </Text>
                              </View>
                              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                {formatLeaveDate(leave.startDate)} - {formatLeaveDate(leave.endDate)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {index < Math.min(upcomingLeaves.length, 5) - 1 && (
                          <Divider style={{ marginVertical: 8 }} />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Menu Items */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          More
        </Text>
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <MenuItem
            icon="calendar-month"
            title="Holidays"
            onPress={() => router.push('/(dashboard)/holidays')}
            theme={theme}
          />
          <Divider />
          <MenuItem
            icon="cash"
            title="Payments"
            onPress={() => router.push('/(dashboard)/payments')}
            theme={theme}
          />
          {(user?.role === 'admin' || user?.role === 'manager') && <Divider />}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <MenuItem
              icon="account-group"
              title="Clients"
              onPress={() => router.push('/(dashboard)/clients')}
              theme={theme}
            />
          )}
          {user?.role === 'admin' && <Divider />}
          {user?.role === 'admin' && (
            <MenuItem
              icon="account-multiple"
              title="Employees"
              onPress={() => router.push('/(dashboard)/employees')}
              theme={theme}
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MenuItemProps {
  icon: string;
  title: string;
  onPress: () => void;
  theme: any;
}

function MenuItem({ icon, title, onPress, theme }: MenuItemProps) {
  return (
    <View style={styles.menuItem}>
      <Button
        mode="text"
        icon={icon}
        onPress={onPress}
        contentStyle={styles.menuItemContent}
        style={styles.menuItemButton}
      >
        {title}
      </Button>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={theme.colors.onSurfaceVariant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  statsScroll: {
    paddingBottom: 8,
    gap: 12,
  },
  statCardHorizontal: {
    borderRadius: 12,
    minWidth: 140,
    marginRight: 4,
  },
  card: {
    borderRadius: 12,
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
  },
  leaveBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  leaveBalanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  leaveIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  listItemText: {
    flex: 1,
    marginLeft: 12,
  },
  leaveListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  leaveTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  menuItemContent: {
    justifyContent: 'flex-start',
  },
  menuItemButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  taskItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  taskPriorityBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  taskStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedDateEvents: {
    marginTop: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
