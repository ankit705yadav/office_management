// Attendance screen - Check in/out, history, regularization, and team attendance

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
  TextInput,
  IconButton,
  Divider,
  Portal,
  Dialog,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { format, parseISO, subDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import attendanceService, {
  TodayAttendance,
  MonthlyAttendance,
  TeamAttendanceResponse,
  RegularizationFormData,
} from '../../services/attendance.service';
import { useAuth } from '../../contexts/AuthContext';
import {
  Attendance,
  AttendanceRegularization,
  AttendanceStatus,
  RegularizationStatus,
} from '../../types';

type TabValue = 'my' | 'regularization' | 'team';

export default function AttendanceScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  const [activeTab, setActiveTab] = useState<TabValue>('my');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // My Attendance state
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyAttendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Regularization state
  const [regularizationForm, setRegularizationForm] = useState<RegularizationFormData>({
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    checkInTime: '09:00',
    checkOutTime: '18:00',
    reason: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [submittingRegularization, setSubmittingRegularization] = useState(false);
  const [myRegularizations, setMyRegularizations] = useState<AttendanceRegularization[]>([]);
  const [regularizationPage, setRegularizationPage] = useState(1);
  const [hasMoreRegularizations, setHasMoreRegularizations] = useState(true);

  // Team Attendance state
  const [teamMonth, setTeamMonth] = useState(new Date().getMonth() + 1);
  const [teamYear, setTeamYear] = useState(new Date().getFullYear());
  const [teamAttendance, setTeamAttendance] = useState<Attendance[]>([]);
  const [teamPage, setTeamPage] = useState(1);
  const [teamTotal, setTeamTotal] = useState(0);
  const [hasMoreTeam, setHasMoreTeam] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingMoreTeam, setLoadingMoreTeam] = useState(false);
  const [pendingRegularizations, setPendingRegularizations] = useState<AttendanceRegularization[]>([]);

  // Remarks dialog state
  const [remarksDialogVisible, setRemarksDialogVisible] = useState(false);
  const [selectedRegularization, setSelectedRegularization] = useState<AttendanceRegularization | null>(null);
  const [remarksAction, setRemarksAction] = useState<'approved' | 'rejected'>('approved');
  const [remarks, setRemarks] = useState('');
  const [processingRegularization, setProcessingRegularization] = useState(false);

  // Load initial data
  const loadMyAttendanceData = useCallback(async (reset = false) => {
    try {
      const page = reset ? 1 : historyPage;
      const [todayData, monthlyData, historyData] = await Promise.all([
        attendanceService.getTodayAttendance(),
        attendanceService.getMonthlyAttendance(),
        attendanceService.getMyAttendance(page, 15),
      ]);
      setTodayAttendance(todayData);
      setMonthlyStats(monthlyData);

      if (reset) {
        setAttendanceHistory(historyData.items);
        setHistoryPage(1);
      } else {
        setAttendanceHistory((prev) =>
          page === 1 ? historyData.items : [...prev, ...historyData.items]
        );
      }
      setHasMoreHistory(historyData.pagination.page < historyData.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load attendance data',
      });
    }
  }, [historyPage]);

  const loadRegularizationData = useCallback(async (reset = false) => {
    try {
      const page = reset ? 1 : regularizationPage;
      const data = await attendanceService.getMyRegularizations(page, 15);

      if (reset) {
        setMyRegularizations(data.items);
        setRegularizationPage(1);

        // Load pending regularizations for managers/admins
        if (isManagerOrAdmin) {
          try {
            const pendingData = await attendanceService.getPendingRegularizations();
            setPendingRegularizations(Array.isArray(pendingData) ? pendingData : []);
          } catch (pendingError) {
            console.error('Failed to load pending regularizations:', pendingError);
            setPendingRegularizations([]);
          }
        }
      } else {
        setMyRegularizations((prev) =>
          page === 1 ? data.items : [...prev, ...data.items]
        );
      }
      setHasMoreRegularizations(data.pagination.page < data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load regularizations:', error);
    }
  }, [regularizationPage, isManagerOrAdmin]);

  const loadTeamAttendanceData = useCallback(async (reset = false) => {
    if (!isManagerOrAdmin) return;

    const page = reset ? 1 : teamPage;

    if (reset) {
      setLoadingTeam(true);
    } else {
      setLoadingMoreTeam(true);
    }

    try {
      const result = await attendanceService.getTeamAttendance(teamMonth, teamYear, page, 20);

      if (reset) {
        setTeamAttendance(result.attendance);
        setTeamPage(1);
      } else {
        setTeamAttendance((prev) => [...prev, ...result.attendance]);
      }

      setTeamTotal(result.pagination.total);
      setHasMoreTeam(result.pagination.page < result.pagination.totalPages);
    } catch (error: any) {
      console.error('Failed to load team attendance:', error);
      if (error.response?.status !== 404) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load team attendance',
        });
      }
      if (reset) {
        setTeamAttendance([]);
        setTeamTotal(0);
      }
    } finally {
      setLoadingTeam(false);
      setLoadingMoreTeam(false);
    }
  }, [isManagerOrAdmin, teamMonth, teamYear, teamPage]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadMyAttendanceData(true);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'regularization') {
      loadRegularizationData(true);
    } else if (activeTab === 'team' && isManagerOrAdmin) {
      loadTeamAttendanceData(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'team' && isManagerOrAdmin) {
      loadTeamAttendanceData(true);
    }
  }, [teamMonth, teamYear]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'my') {
      await loadMyAttendanceData(true);
    } else if (activeTab === 'regularization') {
      await loadRegularizationData(true);
    } else if (activeTab === 'team') {
      await loadTeamAttendanceData(true);
    }
    setRefreshing(false);
  };

  const handleLoadMoreTeam = async () => {
    if (loadingMoreTeam || !hasMoreTeam) return;
    const nextPage = teamPage + 1;
    setTeamPage(nextPage);
    setLoadingMoreTeam(true);
    try {
      const result = await attendanceService.getTeamAttendance(teamMonth, teamYear, nextPage, 20);
      setTeamAttendance((prev) => [...prev, ...result.attendance]);
      setHasMoreTeam(result.pagination.page < result.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load more team attendance:', error);
    } finally {
      setLoadingMoreTeam(false);
    }
  };

  const handlePrevMonth = () => {
    if (teamMonth === 1) {
      setTeamMonth(12);
      setTeamYear(teamYear - 1);
    } else {
      setTeamMonth(teamMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Don't allow going to future months
    if (teamYear === currentYear && teamMonth >= currentMonth) {
      return;
    }

    if (teamMonth === 12) {
      setTeamMonth(1);
      setTeamYear(teamYear + 1);
    } else {
      setTeamMonth(teamMonth + 1);
    }
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return teamMonth === now.getMonth() + 1 && teamYear === now.getFullYear();
  };

  const getMonthName = (month: number, year: number) => {
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMMM yyyy');
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const result = await attendanceService.checkIn();
      setTodayAttendance(result);
      Toast.show({
        type: 'success',
        text1: 'Checked In',
        text2: `Check-in time: ${formatTime(result.checkInTime)}`,
      });
      const monthlyData = await attendanceService.getMonthlyAttendance();
      setMonthlyStats(monthlyData);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Check-in Failed',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const result = await attendanceService.checkOut();
      setTodayAttendance(result);
      Toast.show({
        type: 'success',
        text1: 'Checked Out',
        text2: `Check-out time: ${formatTime(result.checkOutTime)}`,
      });
      const monthlyData = await attendanceService.getMonthlyAttendance();
      setMonthlyStats(monthlyData);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Check-out Failed',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadMoreHistory = async () => {
    if (loadingMore || !hasMoreHistory) return;
    setLoadingMore(true);
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    try {
      const historyData = await attendanceService.getMyAttendance(nextPage, 15);
      setAttendanceHistory((prev) => [...prev, ...historyData.items]);
      setHasMoreHistory(historyData.pagination.page < historyData.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load more history:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmitRegularization = async () => {
    if (!regularizationForm.reason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please provide a reason for regularization',
      });
      return;
    }

    setSubmittingRegularization(true);
    try {
      await attendanceService.requestRegularization(regularizationForm);
      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: 'Your regularization request has been submitted',
      });
      setRegularizationForm({
        date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
        checkInTime: '09:00',
        checkOutTime: '18:00',
        reason: '',
      });
      loadRegularizationData(true);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setSubmittingRegularization(false);
    }
  };

  const handleRegularizationAction = (
    regularization: AttendanceRegularization,
    action: 'approved' | 'rejected'
  ) => {
    setSelectedRegularization(regularization);
    setRemarksAction(action);
    setRemarks('');
    setRemarksDialogVisible(true);
  };

  const submitRegularizationAction = async () => {
    if (!selectedRegularization) return;

    setProcessingRegularization(true);
    try {
      if (remarksAction === 'approved') {
        await attendanceService.approveRegularization(selectedRegularization.id, remarks);
      } else {
        await attendanceService.rejectRegularization(selectedRegularization.id, remarks || 'Rejected');
      }
      Toast.show({
        type: 'success',
        text1: remarksAction === 'approved' ? 'Approved' : 'Rejected',
        text2: `Regularization request has been ${remarksAction}`,
      });
      setRemarksDialogVisible(false);
      loadTeamAttendanceData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setProcessingRegularization(false);
    }
  };

  // Helper functions
  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return '--:--';
    try {
      if (timeStr.includes('T')) {
        // Parse ISO string and convert to IST explicitly
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return '--:--';

        // Add IST offset (UTC+5:30) to get IST time
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(date.getTime() + istOffsetMs);

        const hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;

        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'hh:mm a');
    } catch {
      return timeStr;
    }
  };

  const formatHours = (hours?: number | string): string => {
    if (hours === undefined || hours === null || hours === '') {
      return '0.0 hrs';
    }
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
    if (isNaN(numHours)) {
      return '0.0 hrs';
    }
    return `${numHours.toFixed(1)} hrs`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return theme.colors.primary;
      case 'late':
        return '#F59E0B';
      case 'absent':
        return theme.colors.error;
      case 'half_day':
        return theme.colors.secondary;
      case 'on_leave':
        return '#8B5CF6';
      case 'holiday':
      case 'weekend':
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      present: 'Present',
      late: 'Late',
      absent: 'Absent',
      half_day: 'Half Day',
      on_leave: 'On Leave',
      holiday: 'Holiday',
      weekend: 'Weekend',
    };
    return labels[status] || status;
  };

  const getRegularizationStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'approved':
        return theme.colors.primary;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const isCheckedIn = !!todayAttendance?.checkInTime;
  const isCheckedOut = !!todayAttendance?.checkOutTime;

  const getStatusChip = () => {
    if (!todayAttendance) {
      return { label: 'Not Checked In', icon: 'clock-outline', color: theme.colors.surfaceVariant };
    }
    if (isCheckedOut) {
      return { label: 'Day Complete', icon: 'check-circle', color: theme.colors.primaryContainer };
    }
    if (isCheckedIn) {
      return { label: 'Checked In', icon: 'check-circle', color: theme.colors.secondaryContainer };
    }
    return { label: 'Not Checked In', icon: 'clock-outline', color: theme.colors.surfaceVariant };
  };

  const statusChip = getStatusChip();

  // Build tabs based on role
  const tabs = [
    { value: 'my' as TabValue, label: 'My Attendance' },
    { value: 'regularization' as TabValue, label: 'Regularization' },
    ...(isManagerOrAdmin
      ? [{ value: 'team' as TabValue, label: 'Team' }]
      : []),
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
          Loading attendance...
        </Text>
      </SafeAreaView>
    );
  }

  // Render Today's Status Card
  const renderTodayStatusCard = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ marginBottom: 16 }}>
          Today's Status
        </Text>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <MaterialCommunityIcons name="login" size={24} color={theme.colors.primary} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Check In
            </Text>
            <Text variant="titleMedium">{formatTime(todayAttendance?.checkInTime)}</Text>
          </View>

          <View style={styles.statusItem}>
            <MaterialCommunityIcons name="logout" size={24} color={theme.colors.secondary} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Check Out
            </Text>
            <Text variant="titleMedium">{formatTime(todayAttendance?.checkOutTime)}</Text>
          </View>

          <View style={styles.statusItem}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.tertiary} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Hours
            </Text>
            <Text variant="titleMedium">{formatHours(todayAttendance?.workHours)}</Text>
          </View>
        </View>

        <View style={styles.statusChipRow}>
          <Chip
            icon={statusChip.icon as any}
            mode="flat"
            style={{ backgroundColor: statusChip.color }}
          >
            {statusChip.label}
          </Chip>
          {todayAttendance?.isLate && (
            <Chip
              icon="alert"
              mode="flat"
              style={{ backgroundColor: theme.colors.errorContainer, marginLeft: 8 }}
              textStyle={{ color: theme.colors.error }}
            >
              Late
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  // Render Action Buttons
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <Button
        mode="contained"
        onPress={handleCheckIn}
        loading={actionLoading && !isCheckedIn}
        disabled={actionLoading || isCheckedIn}
        icon="login"
        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        contentStyle={styles.buttonContent}
      >
        Check In
      </Button>

      <Button
        mode="contained"
        onPress={handleCheckOut}
        loading={actionLoading && isCheckedIn && !isCheckedOut}
        disabled={actionLoading || !isCheckedIn || isCheckedOut}
        icon="logout"
        style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
        contentStyle={styles.buttonContent}
      >
        Check Out
      </Button>
    </View>
  );

  // Render This Month Stats (4 cards matching web layout)
  const renderMonthlySummaryCard = () => (
    <View style={styles.statsGrid}>
      <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Working Days
        </Text>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginTop: 8 }}>
          {monthlyStats?.workingDays ?? '--'}
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Present Days
        </Text>
        <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 8 }}>
          {monthlyStats?.presentDays ?? '--'}
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Attendance %
        </Text>
        <Text variant="headlineMedium" style={{ color: '#10B981', fontWeight: 'bold', marginTop: 8 }}>
          {monthlyStats?.attendancePercentage != null
            ? `${Number(monthlyStats.attendancePercentage).toFixed(2)}%`
            : '--%'}
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Total Hours
        </Text>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginTop: 8 }}>
          {monthlyStats?.totalHours != null
            ? `${Number(monthlyStats.totalHours).toFixed(0)}h`
            : '--'}
        </Text>
      </View>
    </View>
  );

  // Render Attendance History Item
  const renderAttendanceHistoryItem = ({ item }: { item: Attendance }) => {
    const dateObj = parseISO(item.date);
    const dayName = format(dateObj, 'EEE');
    const dateStr = format(dateObj, 'MMM d, yyyy');

    return (
      <View
        style={[
          styles.historyItem,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.historyLeft}>
          <Text variant="titleSmall">{dateStr}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {dayName}
          </Text>
        </View>
        <View style={styles.historyMiddle}>
          <Text variant="bodyMedium">
            {formatTime(item.checkInTime)} - {formatTime(item.checkOutTime)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatHours(item.workHours)}
          </Text>
        </View>
        <Chip
          mode="flat"
          compact
          style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
          textStyle={{ color: getStatusColor(item.status), fontSize: 11 }}
        >
          {getStatusLabel(item.status)}
        </Chip>
      </View>
    );
  };

  // Render My Attendance Tab
  const renderMyAttendanceTab = () => (
    <FlatList
      data={attendanceHistory}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderAttendanceHistoryItem}
      ListHeaderComponent={
        <>
          {renderTodayStatusCard()}
          {renderActionButtons()}
          {renderMonthlySummaryCard()}
          <Text variant="titleMedium" style={{ marginTop: 8, marginBottom: 12 }}>
            Attendance History
          </Text>
        </>
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator style={{ padding: 16 }} color={theme.colors.primary} />
        ) : null
      }
      ListEmptyComponent={
        <Text
          style={{ textAlign: 'center', padding: 24, color: theme.colors.onSurfaceVariant }}
        >
          No attendance records found
        </Text>
      }
      onEndReached={handleLoadMoreHistory}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.content}
    />
  );

  // Render Regularization Form
  const renderRegularizationForm = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ marginBottom: 16 }}>
          Request Regularization
        </Text>

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <TextInput
            label="Date"
            value={format(parseISO(regularizationForm.date), 'MMM d, yyyy')}
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
            style={styles.input}
            mode="outlined"
          />
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCheckInPicker(true)}>
            <TextInput
              label="Check In Time"
              value={regularizationForm.checkInTime}
              editable={false}
              right={<TextInput.Icon icon="clock-outline" />}
              style={styles.input}
              mode="outlined"
            />
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCheckOutPicker(true)}>
            <TextInput
              label="Check Out Time"
              value={regularizationForm.checkOutTime}
              editable={false}
              right={<TextInput.Icon icon="clock-outline" />}
              style={styles.input}
              mode="outlined"
            />
          </TouchableOpacity>
        </View>

        <TextInput
          label="Reason"
          value={regularizationForm.reason}
          onChangeText={(text) =>
            setRegularizationForm((prev) => ({ ...prev, reason: text }))
          }
          multiline
          numberOfLines={3}
          style={styles.input}
          mode="outlined"
        />

        <Button
          mode="contained"
          onPress={handleSubmitRegularization}
          loading={submittingRegularization}
          disabled={submittingRegularization}
          style={{ marginTop: 8 }}
        >
          Submit Request
        </Button>
      </Card.Content>
    </Card>
  );

  // Render Regularization Item
  const renderRegularizationItem = ({ item }: { item: AttendanceRegularization }) => {
    const dateObj = parseISO(item.date);
    const dateStr = format(dateObj, 'MMM d, yyyy');

    return (
      <View
        style={[
          styles.regularizationItem,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.regularizationHeader}>
          <Text variant="titleSmall">{dateStr}</Text>
          <Chip
            mode="flat"
            compact
            style={{ backgroundColor: `${getRegularizationStatusColor(item.status)}20` }}
            textStyle={{
              color: getRegularizationStatusColor(item.status),
              fontSize: 11,
              textTransform: 'capitalize',
            }}
          >
            {item.status}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={{ marginTop: 4 }}>
          {formatTime(item.requestedCheckIn)} - {formatTime(item.requestedCheckOut)}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
          numberOfLines={2}
        >
          {item.reason}
        </Text>
        {item.status === 'approved' && item.comments && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.primary, marginTop: 4, fontStyle: 'italic' }}
          >
            Approval note: {item.comments}
          </Text>
        )}
        {item.status === 'rejected' && item.comments && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.error, marginTop: 4, fontStyle: 'italic' }}
          >
            Rejection reason: {item.comments}
          </Text>
        )}
      </View>
    );
  };

  // Render Regularization Tab
  const renderRegularizationTab = () => (
    <FlatList
      data={myRegularizations}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderRegularizationItem}
      ListHeaderComponent={
        <>
          {/* Pending Regularizations for Managers/Admins */}
          {isManagerOrAdmin && pendingRegularizations.length > 0 && (
            <>
              <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                Pending Approvals ({pendingRegularizations.length})
              </Text>
              {pendingRegularizations.map(renderPendingRegularizationItem)}
              <Divider style={{ marginVertical: 16 }} />
            </>
          )}

          {renderRegularizationForm()}
          <Text variant="titleMedium" style={{ marginTop: 8, marginBottom: 12 }}>
            My Requests
          </Text>
        </>
      }
      ListEmptyComponent={
        <Text
          style={{ textAlign: 'center', padding: 24, color: theme.colors.onSurfaceVariant }}
        >
          No regularization requests found
        </Text>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.content}
    />
  );

  // Render Team Attendance Item
  const renderTeamAttendanceItem = ({ item }: { item: Attendance }) => {
    const dateObj = parseISO(item.date);
    const dateStr = format(dateObj, 'MMM d, yyyy');
    const userName = item.user
      ? `${item.user.firstName} ${item.user.lastName}`
      : 'Unknown User';

    return (
      <View
        style={[
          styles.teamMemberCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.teamMemberHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall">{userName}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {dateStr}
            </Text>
          </View>
          <Chip
            mode="flat"
            compact
            style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
            textStyle={{ color: getStatusColor(item.status), fontSize: 11 }}
          >
            {getStatusLabel(item.status)}
          </Chip>
        </View>

        <View style={styles.teamMemberDetails}>
          <Text variant="bodySmall">
            {formatTime(item.checkInTime)} → {formatTime(item.checkOutTime)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatHours(item.workHours)}
          </Text>
        </View>
      </View>
    );
  };

  // Render Pending Regularization Item for Team
  const renderPendingRegularizationItem = (item: AttendanceRegularization) => {
    const dateObj = parseISO(item.date);
    const dateStr = format(dateObj, 'MMM d, yyyy');
    const userName = item.user
      ? `${item.user.firstName} ${item.user.lastName}`
      : 'Unknown User';

    return (
      <View
        key={item.id}
        style={[
          styles.pendingRegularizationItem,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.pendingRegularizationHeader}>
          <View>
            <Text variant="titleSmall">{userName}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {dateStr}
            </Text>
          </View>
        </View>
        <Text variant="bodySmall" style={{ marginTop: 4 }}>
          {formatTime(item.requestedCheckIn)} - {formatTime(item.requestedCheckOut)}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
          numberOfLines={2}
        >
          {item.reason}
        </Text>
        <View style={styles.actionButtonsRow}>
          <Button
            mode="contained"
            compact
            onPress={() => handleRegularizationAction(item, 'approved')}
            style={{ flex: 1, marginRight: 8 }}
          >
            Approve
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => handleRegularizationAction(item, 'rejected')}
            style={{ flex: 1 }}
            textColor={theme.colors.error}
          >
            Reject
          </Button>
        </View>
      </View>
    );
  };

  // Render Month Selector Header
  const renderMonthSelector = () => (
    <View
      style={[styles.dateSelector, { backgroundColor: theme.colors.surface, marginBottom: 12 }]}
    >
      <IconButton icon="chevron-left" onPress={handlePrevMonth} />
      <View style={styles.dateSelectorCenter}>
        <Text variant="titleMedium">{getMonthName(teamMonth, teamYear)}</Text>
      </View>
      <IconButton
        icon="chevron-right"
        onPress={handleNextMonth}
        disabled={isCurrentMonth()}
      />
    </View>
  );

  // Render Team Attendance Tab
  const renderTeamAttendanceTab = () => (
    <FlatList
      data={teamAttendance}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={renderTeamAttendanceItem}
      ListHeaderComponent={
        <>
          {renderMonthSelector()}
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            Team Attendance ({teamTotal} records)
          </Text>
        </>
      }
      ListFooterComponent={
        loadingMoreTeam ? (
          <ActivityIndicator style={{ padding: 16 }} color={theme.colors.primary} />
        ) : null
      }
      ListEmptyComponent={
        loadingTeam ? (
          <ActivityIndicator style={{ padding: 24 }} color={theme.colors.primary} />
        ) : (
          <Text
            style={{ textAlign: 'center', padding: 24, color: theme.colors.onSurfaceVariant }}
          >
            No attendance records found for this month
          </Text>
        )
      }
      onEndReached={handleLoadMoreTeam}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.content}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
          Attendance
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          buttons={tabs.map((tab) => ({
            value: tab.value,
            label: tab.label,
          }))}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'my' && renderMyAttendanceTab()}
      {activeTab === 'regularization' && renderRegularizationTab()}
      {activeTab === 'team' && isManagerOrAdmin && renderTeamAttendanceTab()}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={parseISO(regularizationForm.date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={subDays(new Date(), 1)}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setRegularizationForm((prev) => ({
                ...prev,
                date: format(selectedDate, 'yyyy-MM-dd'),
              }));
            }
          }}
        />
      )}

      {/* Check In Time Picker Modal */}
      {showCheckInPicker && (
        <DateTimePicker
          value={(() => {
            const [h, m] = regularizationForm.checkInTime.split(':');
            const d = new Date();
            d.setHours(parseInt(h), parseInt(m), 0);
            return d;
          })()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowCheckInPicker(false);
            if (selectedDate) {
              setRegularizationForm((prev) => ({
                ...prev,
                checkInTime: format(selectedDate, 'HH:mm'),
              }));
            }
          }}
        />
      )}

      {/* Check Out Time Picker Modal */}
      {showCheckOutPicker && (
        <DateTimePicker
          value={(() => {
            const [h, m] = regularizationForm.checkOutTime.split(':');
            const d = new Date();
            d.setHours(parseInt(h), parseInt(m), 0);
            return d;
          })()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowCheckOutPicker(false);
            if (selectedDate) {
              setRegularizationForm((prev) => ({
                ...prev,
                checkOutTime: format(selectedDate, 'HH:mm'),
              }));
            }
          }}
        />
      )}

      {/* Remarks Dialog */}
      <Portal>
        <Dialog visible={remarksDialogVisible} onDismiss={() => setRemarksDialogVisible(false)}>
          <Dialog.Title>
            {remarksAction === 'approved' ? 'Approve' : 'Reject'} Regularization
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Remarks (optional)"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRemarksDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={submitRegularizationAction}
              loading={processingRegularization}
              disabled={processingRegularization}
            >
              {remarksAction === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  segmentedButtons: {
    width: '100%',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusChipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  historyLeft: {
    flex: 1,
  },
  historyMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
  },
  regularizationItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  regularizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
  },
  dateSelectorCenter: {
    flex: 1,
    alignItems: 'center',
  },
  teamMemberCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  teamMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamMemberDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pendingRegularizationItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  pendingRegularizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
});
