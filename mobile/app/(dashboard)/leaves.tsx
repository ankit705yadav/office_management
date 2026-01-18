// Leaves screen - Leave Management

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Modal as RNModal,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  Chip,
  SegmentedButtons,
  TextInput,
  ActivityIndicator,
  IconButton,
  Divider,
  Switch,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, eachDayOfInterval, isSunday } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { leaveService } from '../../services/leave.service';
import { LeaveBalance, LeaveRequest } from '../../types';

// Leave type options for picker
const LEAVE_TYPES = [
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'casual_leave', label: 'Casual Leave' },
  { value: 'earned_leave', label: 'Earned Leave' },
  { value: 'comp_off', label: 'Comp Off' },
  { value: 'paternity_maternity', label: 'Paternity Leave' },
];

// Helper function to count days excluding Sundays
const countDaysExcludingSundays = (startDate: Date, endDate: Date): number => {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }
  if (startDate > endDate) {
    return 0;
  }
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(day => !isSunday(day)).length;
};

// Helper function to format leave type for display
const formatLeaveType = (type: string): string => {
  const found = LEAVE_TYPES.find(t => t.value === type);
  return found?.label || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#F59E0B';
    case 'approved':
      return '#10B981';
    case 'rejected':
      return '#EF4444';
    case 'cancelled':
      return '#6B7280';
    default:
      return '#6B7280';
  }
};

// Helper function to safely format dates
const safeFormatDate = (dateStr: string | undefined | null, formatStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return format(date, formatStr);
  } catch {
    return '-';
  }
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  color,
  theme,
}: {
  title: string;
  value: string | number;
  color: string;
  theme: any;
}) => (
  <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
    <Text style={[styles.statTitle, { color }]}>{title}</Text>
    <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{value}</Text>
  </View>
);

// Leave Card Component
const LeaveCard = ({
  leave,
  onCancel,
  onApprove,
  onReject,
  canCancel,
  canManage,
  showEmployee,
  theme,
}: {
  leave: LeaveRequest;
  onCancel: () => void;
  onApprove: () => void;
  onReject: () => void;
  canCancel: boolean;
  canManage: boolean;
  showEmployee: boolean;
  theme: any;
}) => {
  const statusColor = getStatusColor(leave.status);

  return (
    <Card style={[styles.leaveCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        {/* Employee Name (for team leaves) */}
        {showEmployee && leave.user && (
          <Text style={[styles.employeeName, { color: theme.colors.primary }]}>
            {leave.user.firstName} {leave.user.lastName}
          </Text>
        )}

        <View style={styles.leaveCardHeader}>
          <Chip
            mode="outlined"
            textStyle={{ fontSize: 12 }}
            style={[styles.typeChip, { borderColor: theme.colors.primary }]}
          >
            {formatLeaveType(leave.leaveType)}
          </Chip>
          <Chip
            mode="flat"
            textStyle={{ fontSize: 11, color: '#fff' }}
            style={{ backgroundColor: statusColor }}
          >
            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
          </Chip>
        </View>

        <Text style={[styles.leaveDates, { color: theme.colors.onSurface }]}>
          {safeFormatDate(leave.startDate, 'MMM dd')} -{' '}
          {safeFormatDate(leave.endDate, 'MMM dd, yyyy')}
        </Text>

        <Text style={[styles.leaveDays, { color: theme.colors.onSurfaceVariant }]}>
          {leave.daysCount} day{leave.daysCount !== 1 ? 's' : ''}
          {leave.isHalfDay && (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {' '}({leave.halfDaySession === 'first_half' ? 'Morning' : 'Afternoon'})
            </Text>
          )}
        </Text>

        {leave.reason && (
          <Text
            style={[styles.leaveReason, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            Reason: {leave.reason}
          </Text>
        )}

        <View style={styles.leaveCardFooter}>
          <Text style={[styles.leaveAppliedDate, { color: theme.colors.onSurfaceVariant }]}>
            Applied: {safeFormatDate(leave.createdAt, 'MMM dd, yyyy')}
          </Text>
          <View style={styles.actionButtons}>
            {canManage && (
              <>
                <Button
                  mode="contained"
                  compact
                  onPress={onApprove}
                  buttonColor="#10B981"
                  textColor="#fff"
                  style={styles.actionButton}
                >
                  Approve
                </Button>
                <Button
                  mode="outlined"
                  compact
                  onPress={onReject}
                  textColor="#EF4444"
                  style={[styles.actionButton, { borderColor: '#EF4444' }]}
                >
                  Reject
                </Button>
              </>
            )}
            {canCancel && (
              <Button
                mode="outlined"
                compact
                onPress={onCancel}
                textColor="#EF4444"
                style={[styles.actionButton, { borderColor: '#EF4444' }]}
              >
                Cancel
              </Button>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

// Approve/Reject Modal Component
const ApproveRejectModal = ({
  visible,
  leave,
  onDismiss,
  onApprove,
  onReject,
  submitting,
  theme,
}: {
  visible: boolean;
  leave: LeaveRequest | null;
  onDismiss: () => void;
  onApprove: (comments: string) => void;
  onReject: (comments: string) => void;
  submitting: boolean;
  theme: any;
}) => {
  const [comments, setComments] = useState('');

  const handleApprove = () => {
    onApprove(comments);
    setComments('');
  };

  const handleReject = () => {
    if (!comments.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }
    onReject(comments);
    setComments('');
  };

  const handleDismiss = () => {
    setComments('');
    onDismiss();
  };

  if (!leave) return null;

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.approveModalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
              Review Leave Request
            </Text>
            <IconButton icon="close" onPress={handleDismiss} disabled={submitting} />
          </View>

          <Divider style={{ marginBottom: 16 }} />

          {/* Leave Details */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Employee:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {leave.user?.firstName} {leave.user?.lastName}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Leave Type:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {formatLeaveType(leave.leaveType)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Duration:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {safeFormatDate(leave.startDate, 'MMM dd')} - {safeFormatDate(leave.endDate, 'MMM dd, yyyy')} ({leave.daysCount} days)
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Reason:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {leave.reason}
            </Text>
          </View>

          <Divider style={{ marginVertical: 16 }} />

          {/* Comments Input */}
          <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>
            Comments (required for rejection)
          </Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={3}
            value={comments}
            onChangeText={setComments}
            placeholder="Add your comments here..."
            disabled={submitting}
            style={{ marginBottom: 16 }}
          />

          {/* Actions */}
          <View style={styles.approveModalActions}>
            <Button
              mode="outlined"
              onPress={handleDismiss}
              disabled={submitting}
              style={{ flex: 1, marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button
              mode="outlined"
              onPress={handleReject}
              disabled={submitting}
              textColor="#EF4444"
              style={{ flex: 1, marginRight: 8, borderColor: '#EF4444' }}
            >
              Reject
            </Button>
            <Button
              mode="contained"
              onPress={handleApprove}
              loading={submitting}
              disabled={submitting}
              buttonColor="#10B981"
              style={{ flex: 1 }}
            >
              Approve
            </Button>
          </View>
        </View>
      </View>
    </RNModal>
  );
};

// Apply Leave Modal Component
const ApplyLeaveModal = ({
  visible,
  onDismiss,
  onSubmit,
  submitting,
  theme,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: any) => void;
  submitting: boolean;
  theme: any;
}) => {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<'first_half' | 'second_half'>('first_half');
  const [documentUrl, setDocumentUrl] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showLeaveTypePicker, setShowLeaveTypePicker] = useState(false);

  const daysCount = isHalfDay ? 0.5 : countDaysExcludingSundays(startDate, endDate);

  const resetForm = () => {
    setLeaveType('');
    setStartDate(new Date());
    setEndDate(new Date());
    setReason('');
    setIsHalfDay(false);
    setHalfDaySession('first_half');
    setDocumentUrl('');
  };

  const handleSubmit = () => {
    if (!leaveType) {
      Alert.alert('Error', 'Please select leave type');
      return;
    }
    if (!reason || reason.length < 10) {
      Alert.alert('Error', 'Please provide a reason (minimum 10 characters)');
      return;
    }

    onSubmit({
      leaveType,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: isHalfDay ? format(startDate, 'yyyy-MM-dd') : format(endDate, 'yyyy-MM-dd'),
      reason,
      isHalfDay,
      halfDaySession: isHalfDay ? halfDaySession : undefined,
      documentUrl: documentUrl.trim() || undefined,
    });
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardView}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                  Apply for Leave
                </Text>
                <IconButton icon="close" onPress={handleDismiss} disabled={submitting} />
              </View>

              <Divider style={{ marginBottom: 16 }} />

              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>
                Leave Type *
              </Text>
              <TouchableOpacity
                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
                onPress={() => setShowLeaveTypePicker(true)}
                disabled={submitting}
              >
                <Text style={{ color: leaveType ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                  {leaveType ? formatLeaveType(leaveType) : 'Select leave type'}
                </Text>
              </TouchableOpacity>

              <RNModal
                visible={showLeaveTypePicker}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowLeaveTypePicker(false)}
              >
                <TouchableOpacity
                  style={styles.pickerOverlay}
                  activeOpacity={1}
                  onPress={() => setShowLeaveTypePicker(false)}
                >
                  <View style={[styles.pickerModal, { backgroundColor: theme.colors.surface }]}>
                    <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: '600', color: theme.colors.onSurface }}>
                      Select Leave Type
                    </Text>
                    {LEAVE_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.pickerItem,
                          leaveType === type.value && { backgroundColor: theme.colors.primaryContainer },
                        ]}
                        onPress={() => {
                          setLeaveType(type.value);
                          setShowLeaveTypePicker(false);
                        }}
                      >
                        <Text style={{ color: theme.colors.onSurface }}>{type.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </RNModal>

              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Start Date *
              </Text>
              <TouchableOpacity
                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
                onPress={() => setShowStartPicker(true)}
                disabled={submitting}
              >
                <Text style={{ color: theme.colors.onSurface }}>
                  {format(startDate, 'MMMM dd, yyyy')}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (date) {
                      setStartDate(date);
                      if (date > endDate) {
                        setEndDate(date);
                      }
                    }
                  }}
                />
              )}

              <View style={styles.switchRow}>
                <Text style={{ color: theme.colors.onSurface }}>Half-day leave</Text>
                <Switch
                  value={isHalfDay}
                  onValueChange={(val) => {
                    setIsHalfDay(val);
                    if (val) {
                      setEndDate(startDate);
                    }
                  }}
                  disabled={submitting}
                />
              </View>

              {isHalfDay && (
                <SegmentedButtons
                  value={halfDaySession}
                  onValueChange={(val) => setHalfDaySession(val as 'first_half' | 'second_half')}
                  buttons={[
                    { value: 'first_half', label: 'Morning' },
                    { value: 'second_half', label: 'Afternoon' },
                  ]}
                  style={{ marginBottom: 16 }}
                />
              )}

              {!isHalfDay && (
                <>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>
                    End Date *
                  </Text>
                  <TouchableOpacity
                    style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
                    onPress={() => setShowEndPicker(true)}
                    disabled={submitting}
                  >
                    <Text style={{ color: theme.colors.onSurface }}>
                      {format(endDate, 'MMMM dd, yyyy')}
                    </Text>
                  </TouchableOpacity>
                  {showEndPicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      minimumDate={startDate}
                      onChange={(event, date) => {
                        setShowEndPicker(Platform.OS === 'ios');
                        if (date) {
                          setEndDate(date);
                        }
                      }}
                    />
                  )}
                </>
              )}

              {daysCount > 0 && (
                <View style={[styles.daysCountBanner, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={{ color: theme.colors.onPrimaryContainer }}>
                    Total days: <Text style={{ fontWeight: 'bold' }}>{daysCount}</Text>
                  </Text>
                </View>
              )}

              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Reason * (min 10 characters)
              </Text>
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={setReason}
                placeholder="Please provide a detailed reason for your leave request"
                disabled={submitting}
                style={styles.textArea}
              />

              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Supporting Document Link (Optional)
              </Text>
              <TextInput
                mode="outlined"
                value={documentUrl}
                onChangeText={setDocumentUrl}
                placeholder="https://drive.google.com/..."
                disabled={submitting}
                left={<TextInput.Icon icon="link" />}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={handleDismiss}
                  disabled={submitting}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  Submit
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

export default function LeavesScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  // State
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  // Current Leaves
  const [currentLeaves, setCurrentLeaves] = useState<LeaveRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCurrent, setHasMoreCurrent] = useState(true);
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  // History Leaves
  const [historyLeaves, setHistoryLeaves] = useState<LeaveRequest[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);

  const LIMIT = 20;
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  // Load balance
  const loadBalance = async () => {
    try {
      const data = await leaveService.getBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  // Load current leaves
  const loadCurrentLeaves = async (page: number = 1, append: boolean = false) => {
    if (loadingCurrent && append) return;

    try {
      setLoadingCurrent(true);
      const response = await leaveService.getLeaveRequests({ page, limit: LIMIT });

      if (append) {
        setCurrentLeaves(prev => [...prev, ...response.items]);
      } else {
        setCurrentLeaves(response.items);
      }

      setCurrentPage(page);
      setHasMoreCurrent(page < response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load current leaves:', error);
      if (!append) {
        setCurrentLeaves([]);
      }
    } finally {
      setLoadingCurrent(false);
    }
  };

  // Load history leaves
  const loadHistoryLeaves = async (page: number = 1, append: boolean = false) => {
    if (loadingHistory && append) return;

    try {
      setLoadingHistory(true);
      const response = await leaveService.getLeaveHistory({ page, limit: LIMIT });

      if (append) {
        setHistoryLeaves(prev => [...prev, ...response.items]);
      } else {
        setHistoryLeaves(response.items);
      }

      setHistoryPage(page);
      setHasMoreHistory(page < response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load history leaves:', error);
      if (!append) {
        setHistoryLeaves([]);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadBalance();
    loadCurrentLeaves(1);
  }, []);

  // Load history when tab changes
  useEffect(() => {
    if (activeTab === 'history' && historyLeaves.length === 0) {
      loadHistoryLeaves(1);
    }
  }, [activeTab]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadBalance(),
      activeTab === 'current' ? loadCurrentLeaves(1) : loadHistoryLeaves(1),
    ]);
    setRefreshing(false);
  };

  // Load more for current leaves
  const loadMoreCurrent = () => {
    if (hasMoreCurrent && !loadingCurrent) {
      loadCurrentLeaves(currentPage + 1, true);
    }
  };

  // Load more for history
  const loadMoreHistory = () => {
    if (hasMoreHistory && !loadingHistory) {
      loadHistoryLeaves(historyPage + 1, true);
    }
  };

  // Apply leave
  const handleApplyLeave = async (data: any) => {
    try {
      setSubmitting(true);
      await leaveService.applyLeave(data);
      Alert.alert('Success', 'Leave request submitted successfully');
      setShowApplyModal(false);
      loadCurrentLeaves(1);
      loadBalance();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to submit leave request';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel leave
  const handleCancelLeave = (leaveId: number) => {
    Alert.alert(
      'Cancel Leave',
      'Are you sure you want to cancel this leave request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveService.cancelLeave(leaveId);
              Alert.alert('Success', 'Leave request cancelled');
              loadCurrentLeaves(1);
              loadBalance();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel leave request');
            }
          },
        },
      ]
    );
  };

  // Approve leave
  const handleApproveLeave = async (comments: string) => {
    if (!selectedLeave) return;

    try {
      setSubmitting(true);
      await leaveService.approveLeave(selectedLeave.id, comments);
      Alert.alert('Success', 'Leave approved successfully');
      setShowApproveModal(false);
      setSelectedLeave(null);
      loadCurrentLeaves(1);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to approve leave';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Reject leave
  const handleRejectLeave = async (comments: string) => {
    if (!selectedLeave) return;

    try {
      setSubmitting(true);
      await leaveService.rejectLeave(selectedLeave.id, comments);
      Alert.alert('Success', 'Leave rejected');
      setShowApproveModal(false);
      setSelectedLeave(null);
      loadCurrentLeaves(1);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to reject leave';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open approve/reject modal
  const openApproveModal = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setShowApproveModal(true);
  };

  // Can cancel check
  const canCancelLeave = (leave: LeaveRequest) => {
    return (
      leave.userId === user?.id &&
      (leave.status === 'pending' || leave.status === 'approved')
    );
  };

  // Can manage check (for managers/admins)
  const canManageLeave = (leave: LeaveRequest) => {
    return (
      isManager &&
      leave.status === 'pending' &&
      leave.userId !== user?.id
    );
  };

  // Separate my leaves and team leaves
  const myLeaves = currentLeaves.filter(l => l.userId === user?.id);
  const teamLeaves = currentLeaves.filter(l => l.userId !== user?.id);

  // Calculate stats
  const totalAvailable = balance
    ? Number(balance.sickLeave ?? 0) +
      Number(balance.casualLeave ?? 0) +
      Number(balance.earnedLeave ?? 0) +
      Number(balance.compOff ?? 0)
    : 0;

  const leaveStats = {
    pending: myLeaves.filter(l => l.status === 'pending').length,
    approved: myLeaves.filter(l => l.status === 'approved').length,
    rejected: myLeaves.filter(l => l.status === 'rejected').length,
  };

  // Footer loading component
  const FooterLoading = ({ loading }: { loading: boolean }) => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  // Render current leaves content
  const renderCurrentLeaves = () => (
    <>
      {/* My Leaves Section */}
      <Text variant="titleMedium" style={[styles.sectionHeader, { color: theme.colors.onSurface }]}>
        My Leaves
      </Text>
      {myLeaves.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>No leave requests</Text>
        </View>
      ) : (
        myLeaves.map((leave) => (
          <LeaveCard
            key={leave.id}
            leave={leave}
            onCancel={() => handleCancelLeave(leave.id)}
            onApprove={() => {}}
            onReject={() => {}}
            canCancel={canCancelLeave(leave)}
            canManage={false}
            showEmployee={false}
            theme={theme}
          />
        ))
      )}

      {/* Team Leaves Section (for managers/admins) */}
      {isManager && (
        <>
          <Text variant="titleMedium" style={[styles.sectionHeader, { color: theme.colors.onSurface, marginTop: 24 }]}>
            Team Leave Requests
          </Text>
          {teamLeaves.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>No team leave requests</Text>
            </View>
          ) : (
            teamLeaves.map((leave) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                onCancel={() => {}}
                onApprove={() => openApproveModal(leave)}
                onReject={() => openApproveModal(leave)}
                canCancel={false}
                canManage={canManageLeave(leave)}
                showEmployee={true}
                theme={theme}
              />
            ))
          )}
        </>
      )}
    </>
  );

  // Render history content
  const renderHistoryContent = () => (
    <>
      {historyLeaves.length === 0 && !loadingHistory ? (
        <View style={styles.emptySection}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>No leave history</Text>
        </View>
      ) : (
        historyLeaves.map((leave) => (
          <LeaveCard
            key={leave.id}
            leave={leave}
            onCancel={() => {}}
            onApprove={() => {}}
            onReject={() => {}}
            canCancel={false}
            canManage={false}
            showEmployee={false}
            theme={theme}
          />
        ))
      )}
      <FooterLoading loading={loadingHistory} />
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
          Leave Management
        </Text>
        <Button
          mode="contained"
          compact
          icon="plus"
          onPress={() => setShowApplyModal(true)}
        >
          Apply
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScrollEndDrag={() => {
          if (activeTab === 'current') {
            loadMoreCurrent();
          } else {
            loadMoreHistory();
          }
        }}
      >
        {/* Stats Section */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Leave Balance
        </Text>

        {/* Row 1: 4 cards */}
        <View style={styles.statsRow}>
          <StatCard
            title="Total Available"
            value={totalAvailable.toFixed(1)}
            color={theme.colors.primary}
            theme={theme}
          />
          <StatCard
            title="Casual"
            value={Number(balance?.casualLeave ?? 0).toFixed(1)}
            color="#F59E0B"
            theme={theme}
          />
          <StatCard
            title="Sick"
            value={Number(balance?.sickLeave ?? 0).toFixed(1)}
            color="#EF4444"
            theme={theme}
          />
          <StatCard
            title="Earned"
            value={Number(balance?.earnedLeave ?? 0).toFixed(1)}
            color="#3B82F6"
            theme={theme}
          />
        </View>

        {/* Row 2: 3 cards */}
        <View style={styles.statsRow}>
          <StatCard
            title="Pending"
            value={leaveStats.pending}
            color="#F59E0B"
            theme={theme}
          />
          <StatCard
            title="Approved"
            value={leaveStats.approved}
            color="#10B981"
            theme={theme}
          />
          <StatCard
            title="Rejected"
            value={leaveStats.rejected}
            color="#EF4444"
            theme={theme}
          />
        </View>

        {/* Tabs */}
        <SegmentedButtons
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'current' | 'history')}
          buttons={[
            { value: 'current', label: 'Current Leaves' },
            { value: 'history', label: 'Leave History' },
          ]}
          style={styles.tabButtons}
        />

        {/* Content based on active tab */}
        {activeTab === 'current' ? renderCurrentLeaves() : renderHistoryContent()}

        {activeTab === 'current' && <FooterLoading loading={loadingCurrent} />}
      </ScrollView>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        visible={showApplyModal}
        onDismiss={() => setShowApplyModal(false)}
        onSubmit={handleApplyLeave}
        submitting={submitting}
        theme={theme}
      />

      {/* Approve/Reject Modal */}
      <ApproveRejectModal
        visible={showApproveModal}
        leave={selectedLeave}
        onDismiss={() => {
          setShowApproveModal(false);
          setSelectedLeave(null);
        }}
        onApprove={handleApproveLeave}
        onReject={handleRejectLeave}
        submitting={submitting}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    minWidth: 70,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabButtons: {
    marginVertical: 16,
  },
  leaveCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  leaveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeChip: {
    height: 28,
  },
  leaveDates: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  leaveDays: {
    fontSize: 13,
    marginBottom: 8,
  },
  leaveReason: {
    fontSize: 13,
    marginBottom: 8,
  },
  leaveCardFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  leaveAppliedDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  emptySection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    marginBottom: 12,
  },
  footerLoading: {
    padding: 16,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    maxHeight: '90%',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  approveModalContainer: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 4,
  },
  pickerModal: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pickerItem: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  daysCountBanner: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  textArea: {
    maxHeight: 120,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 8,
  },
  approveModalActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 90,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
  },
});
