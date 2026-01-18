// Projects screen - Task Management

import React, { useState, useEffect, useCallback } from 'react';
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
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
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
  Avatar,
  ProgressBar,
  Searchbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isAfter, isBefore } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { projectService } from '../../services/project.service';
import {
  Task,
  Project,
  ProjectStats,
  UserTaskReport,
  TaskReportsResponse,
  User,
  TaskStatus,
  TaskPriority,
  TaskAttachmentInput,
} from '../../types';

// Constants
const TASK_STATUSES = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'approved', label: 'Approved' },
];

const TASK_PRIORITIES = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// Status color mapping
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'todo':
      return '#6B7280';
    case 'in_progress':
      return '#3B82F6';
    case 'blocked':
      return '#F59E0B';
    case 'done':
      return '#10B981';
    case 'approved':
      return '#8B5CF6';
    default:
      return '#6B7280';
  }
};

// Priority color mapping
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low':
      return '#10B981';
    case 'medium':
      return '#3B82F6';
    case 'high':
      return '#F59E0B';
    case 'urgent':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

// Format status label
const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// Format priority label
const formatPriority = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

// Safe date format helper
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

// Project Picker Modal
const ProjectPickerModal = ({
  visible,
  onDismiss,
  onSelect,
  projects,
  selectedProjectId,
  loading,
  theme,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (project: Project | null) => void;
  projects: Project[];
  selectedProjectId: number | null;
  loading: boolean;
  theme: any;
}) => {
  const [search, setSearch] = useState('');

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
              Select Project
            </Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>

          <Searchbar
            placeholder="Search projects..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />

          <ScrollView style={{ maxHeight: 400 }}>
            {/* All Tasks option */}
            <TouchableOpacity
              style={[
                styles.projectPickerItem,
                selectedProjectId === null && { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={() => {
                onSelect(null);
                onDismiss();
              }}
            >
              <View style={styles.projectPickerItemContent}>
                <Text style={[styles.projectPickerName, { color: theme.colors.onSurface }]}>
                  All Tasks
                </Text>
                <Text style={[styles.projectPickerSubtext, { color: theme.colors.onSurfaceVariant }]}>
                  View tasks across all projects
                </Text>
              </View>
              {selectedProjectId === null && (
                <IconButton icon="check" size={20} iconColor={theme.colors.primary} />
              )}
            </TouchableOpacity>

            <Divider />

            {loading ? (
              <ActivityIndicator style={{ padding: 20 }} />
            ) : (
              filteredProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectPickerItem,
                    selectedProjectId === project.id && { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  onPress={() => {
                    onSelect(project);
                    onDismiss();
                  }}
                >
                  <View style={styles.projectPickerItemContent}>
                    <View style={styles.projectPickerNameRow}>
                      <Text style={[styles.projectPickerName, { color: theme.colors.onSurface }]}>
                        {project.name}
                      </Text>
                      <Chip
                        mode="flat"
                        textStyle={{ fontSize: 10 }}
                        style={{ backgroundColor: getStatusColor(project.status), height: 22 }}
                      >
                        <Text style={{ color: '#fff', fontSize: 10 }}>{formatStatus(project.status)}</Text>
                      </Chip>
                    </View>
                    {project.taskCounts && (
                      <Text style={[styles.projectPickerSubtext, { color: theme.colors.onSurfaceVariant }]}>
                        {project.taskCounts.todo + project.taskCounts.in_progress + project.taskCounts.blocked} active tasks
                      </Text>
                    )}
                  </View>
                  {selectedProjectId === project.id && (
                    <IconButton icon="check" size={20} iconColor={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
};

// Filter Picker Modal
const FilterPickerModal = ({
  visible,
  onDismiss,
  onSelect,
  title,
  options,
  selectedValue,
  theme,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (value: string) => void;
  title: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  theme: any;
}) => (
  <RNModal
    visible={visible}
    animationType="fade"
    transparent={true}
    onRequestClose={onDismiss}
  >
    <TouchableOpacity
      style={styles.pickerOverlay}
      activeOpacity={1}
      onPress={onDismiss}
    >
      <View style={[styles.pickerModal, { backgroundColor: theme.colors.surface }]}>
        <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: '600', color: theme.colors.onSurface }}>
          {title}
        </Text>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerItem,
              selectedValue === option.value && { backgroundColor: theme.colors.primaryContainer },
            ]}
            onPress={() => {
              onSelect(option.value);
              onDismiss();
            }}
          >
            <Text style={{ color: theme.colors.onSurface }}>{option.label}</Text>
            {selectedValue === option.value && (
              <IconButton icon="check" size={16} iconColor={theme.colors.primary} style={{ margin: 0 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  </RNModal>
);

// Task Card Component
const TaskCard = ({
  task,
  onPress,
  theme,
}: {
  task: Task;
  onPress: () => void;
  theme: any;
}) => {
  const isOverdue = task.isOverdue || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' && task.status !== 'approved');
  const statusColor = getStatusColor(task.status);
  const priorityColor = getPriorityColor(task.priority);
  const isCompleted = task.status === 'done' || task.status === 'approved';
  const isDark = theme.dark;

  // Theme-aware colors for overdue and warnings
  const overdueCardBg = isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2';
  const overdueBadgeBg = isDark ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2';
  const overdueTextColor = isDark ? '#F87171' : '#DC2626';
  const warningBadgeBg = isDark ? 'rgba(245, 158, 11, 0.25)' : '#FEF3C7';
  const warningTextColor = isDark ? '#FBBF24' : '#D97706';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.taskCard,
        {
          backgroundColor: isOverdue ? overdueCardBg : theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: isOverdue ? '#EF4444' : statusColor,
        },
      ]}
    >
      {/* Top Row: Task Code + Priority Badge */}
      <View style={styles.taskCardTopRow}>
        <View style={styles.taskCodeContainer}>
          {task.taskCode && (
            <Text style={[styles.taskCode, { color: theme.colors.onSurfaceVariant }]}>
              {task.taskCode}
            </Text>
          )}
          {task.project && (
            <View style={[styles.projectBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.projectBadgeText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                {task.project.name}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20`, borderColor: priorityColor }]}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {formatPriority(task.priority)}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text
        style={[
          styles.taskTitle,
          {
            color: theme.colors.onSurface,
            textDecorationLine: isCompleted ? 'line-through' : 'none',
            opacity: isCompleted ? 0.7 : 1,
          },
        ]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {/* Status + Warning Badges Row */}
      <View style={styles.taskBadgesRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{formatStatus(task.status)}</Text>
        </View>
        {task.assigneeOnLeave && (
          <View style={[styles.warningBadge, { backgroundColor: warningBadgeBg }]}>
            <IconButton icon="account-alert" size={12} iconColor={warningTextColor} style={{ margin: 0, padding: 0, width: 14, height: 14 }} />
            <Text style={[styles.warningBadgeText, { color: warningTextColor }]}>On Leave</Text>
          </View>
        )}
        {isOverdue && (
          <View style={[styles.warningBadge, { backgroundColor: overdueBadgeBg }]}>
            <IconButton icon="clock-alert-outline" size={12} iconColor={overdueTextColor} style={{ margin: 0, padding: 0, width: 14, height: 14 }} />
            <Text style={[styles.warningBadgeText, { color: overdueTextColor }]}>Overdue</Text>
          </View>
        )}
      </View>

      {/* Footer: Assignee + Meta Info */}
      <View style={[styles.taskCardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
        {/* Assignee */}
        <View style={styles.assigneeContainer}>
          {task.assignee ? (
            <View style={styles.assigneeRow}>
              {task.assignee.profileImageUrl ? (
                <Avatar.Image size={24} source={{ uri: task.assignee.profileImageUrl }} />
              ) : (
                <Avatar.Text
                  size={24}
                  label={`${task.assignee.firstName?.charAt(0) || ''}${task.assignee.lastName?.charAt(0) || ''}`}
                  style={{ backgroundColor: theme.colors.primary }}
                  labelStyle={{ fontSize: 10 }}
                />
              )}
              <Text style={[styles.assigneeName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {task.assignee.firstName} {task.assignee.lastName}
              </Text>
            </View>
          ) : (
            <View style={styles.assigneeRow}>
              <Avatar.Icon size={24} icon="account-outline" style={{ backgroundColor: theme.colors.surfaceVariant }} />
              <Text style={[styles.assigneeName, { color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }]}>
                Unassigned
              </Text>
            </View>
          )}
        </View>

        {/* Meta Info */}
        <View style={styles.taskMetaRow}>
          {task.estimatedHours !== undefined && task.estimatedHours !== null && task.estimatedHours > 0 && (
            <View style={styles.taskMetaItem}>
              <IconButton icon="clock-outline" size={14} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0, padding: 0, width: 16, height: 16 }} />
              <Text style={[styles.taskMetaText, { color: theme.colors.onSurfaceVariant }]}>{task.estimatedHours}h</Text>
            </View>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <View style={styles.taskMetaItem}>
              <IconButton icon="attachment" size={14} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0, padding: 0, width: 16, height: 16 }} />
              <Text style={[styles.taskMetaText, { color: theme.colors.onSurfaceVariant }]}>{task.attachments.length}</Text>
            </View>
          )}
          {task.commentCount !== undefined && task.commentCount > 0 && (
            <View style={styles.taskMetaItem}>
              <IconButton icon="comment-outline" size={14} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0, padding: 0, width: 16, height: 16 }} />
              <Text style={[styles.taskMetaText, { color: theme.colors.onSurfaceVariant }]}>{task.commentCount}</Text>
            </View>
          )}
          {task.dueDate && (
            <View style={[styles.dueDateBadge, { backgroundColor: isOverdue ? overdueBadgeBg : theme.colors.surfaceVariant }]}>
              <IconButton
                icon="calendar"
                size={12}
                iconColor={isOverdue ? overdueTextColor : theme.colors.onSurfaceVariant}
                style={{ margin: 0, padding: 0, width: 14, height: 14 }}
              />
              <Text style={[styles.dueDateText, { color: isOverdue ? overdueTextColor : theme.colors.onSurfaceVariant }]}>
                {safeFormatDate(task.dueDate, 'MMM dd')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Block Reason Modal
const BlockReasonModal = ({
  visible,
  onDismiss,
  onSubmit,
  submitting,
  theme,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (reason: string) => void;
  submitting: boolean;
  theme: any;
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  return (
    <RNModal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[styles.pickerModal, { backgroundColor: theme.colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: '600', color: theme.colors.onSurface }}>
              Block Reason
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12, fontSize: 13 }}>
              Please provide a reason for blocking this task:
            </Text>
            <TextInput
              mode="outlined"
              value={reason}
              onChangeText={setReason}
              placeholder="Enter block reason..."
              multiline
              numberOfLines={3}
              disabled={submitting}
              style={{ marginBottom: 16 }}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() => onSubmit(reason.trim())}
                loading={submitting}
                disabled={submitting || !reason.trim()}
                style={{ flex: 1 }}
              >
                Block Task
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </RNModal>
  );
};

// Task Detail Modal
const TaskDetailModal = ({
  visible,
  task,
  loading,
  onDismiss,
  onEdit,
  onDelete,
  onStatusChange,
  canManage,
  submitting,
  theme,
}: {
  visible: boolean;
  task: Task | null;
  loading: boolean;
  onDismiss: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string, blockReason?: string) => void;
  canManage: boolean;
  submitting: boolean;
  theme: any;
}) => {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const isDark = theme.dark;

  if (!task) return null;

  const isOverdue = task.isOverdue || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' && task.status !== 'approved');

  // Filter status options - employees can't set approved
  const statusOptions = TASK_STATUSES.filter((s) => s.value !== '' && (canManage || s.value !== 'approved'));

  const handleStatusSelect = (status: string) => {
    if (status === task.status) return;

    // If changing to blocked, show block reason modal
    if (status === 'blocked' && task.status !== 'blocked') {
      setPendingStatus(status);
      setShowBlockReasonModal(true);
    } else {
      onStatusChange(status);
    }
  };

  const handleBlockReasonSubmit = (reason: string) => {
    if (pendingStatus) {
      onStatusChange(pendingStatus, reason);
      setShowBlockReasonModal(false);
      setPendingStatus(null);
    }
  };

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.detailModalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface, flex: 1 }} numberOfLines={2}>
              {task.title}
            </Text>
            <IconButton icon="close" onPress={onDismiss} disabled={submitting} />
          </View>

          <Divider style={{ marginBottom: 12 }} />

          {/* Loading State */}
          {loading ? (
            <View style={styles.detailLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>Loading task details...</Text>
            </View>
          ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Task Code */}
            {task.taskCode && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Code:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>{task.taskCode}</Text>
              </View>
            )}

            {/* Project */}
            {task.project && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Project:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>{task.project.name}</Text>
              </View>
            )}

            {/* Status */}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Status:</Text>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => setShowStatusPicker(true)}
                disabled={submitting}
              >
                <Chip
                  mode="flat"
                  textStyle={{ fontSize: 12, color: '#fff' }}
                  style={{ backgroundColor: getStatusColor(task.status) }}
                >
                  {formatStatus(task.status)}
                </Chip>
                <IconButton icon="chevron-down" size={16} style={{ margin: 0 }} />
              </TouchableOpacity>
            </View>

            {/* Priority */}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Priority:</Text>
              <Chip
                mode="outlined"
                textStyle={{ fontSize: 12, color: getPriorityColor(task.priority) }}
                style={{ borderColor: getPriorityColor(task.priority) }}
              >
                {formatPriority(task.priority)}
              </Chip>
            </View>

            {/* Assignee */}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Assignee:</Text>
              <View style={styles.assigneeDetailRow}>
                {task.assignee ? (
                  <>
                    {task.assignee.profileImageUrl ? (
                      <Avatar.Image size={24} source={{ uri: task.assignee.profileImageUrl }} />
                    ) : (
                      <Avatar.Text
                        size={24}
                        label={`${task.assignee.firstName?.charAt(0) || ''}${task.assignee.lastName?.charAt(0) || ''}`}
                      />
                    )}
                    <Text style={[styles.detailValue, { color: theme.colors.onSurface, marginLeft: 8 }]}>
                      {task.assignee.firstName} {task.assignee.lastName}
                    </Text>
                    {task.assigneeOnLeave && (
                      <Chip
                        mode="flat"
                        textStyle={{ fontSize: 10, color: '#fff' }}
                        style={{ backgroundColor: '#F59E0B', height: 22, marginLeft: 8 }}
                      >
                        On Leave
                      </Chip>
                    )}
                  </>
                ) : (
                  <Text style={[styles.detailValue, { color: theme.colors.onSurfaceVariant }]}>Unassigned</Text>
                )}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Due Date:</Text>
              <Text style={[styles.detailValue, { color: isOverdue ? '#EF4444' : theme.colors.onSurface }]}>
                {isOverdue && '! '}
                {task.dueDate ? safeFormatDate(task.dueDate, 'MMM dd, yyyy') : '-'}
              </Text>
            </View>

            {/* Estimated Hours */}
            {task.estimatedHours !== undefined && task.estimatedHours !== null && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Est. Hours:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>{task.estimatedHours}h</Text>
              </View>
            )}

            {/* Description */}
            {task.description && (
              <View style={styles.descriptionSection}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant, marginBottom: 8 }]}>
                  Description:
                </Text>
                <Text style={[styles.descriptionText, { color: theme.colors.onSurface }]}>
                  {task.description}
                </Text>
              </View>
            )}

            {/* Block Reason */}
            {task.status === 'blocked' && task.blockReason && (
              <View style={[styles.blockReasonSection, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                <Text style={{ color: isDark ? '#FBBF24' : '#92400E', fontWeight: '600', marginBottom: 4 }}>Block Reason:</Text>
                <Text style={{ color: isDark ? '#FCD34D' : '#92400E' }}>{task.blockReason}</Text>
              </View>
            )}

            {/* Attachments Section */}
            {task.attachments && task.attachments.length > 0 && (
              <View style={styles.attachmentsSection}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant, marginBottom: 8 }]}>
                  Attachments ({task.attachments.length})
                </Text>
                {task.attachments.map((attachment) => (
                  <View
                    key={attachment.id}
                    style={[styles.attachmentItem, { backgroundColor: theme.colors.surfaceVariant }]}
                  >
                    <TouchableOpacity
                      style={styles.attachmentContent}
                      onPress={() => Linking.openURL(attachment.linkUrl)}
                    >
                      <IconButton
                        icon="link-variant"
                        size={18}
                        iconColor={theme.colors.primary}
                        style={{ margin: 0, marginRight: 4 }}
                      />
                      <View style={styles.attachmentTextContainer}>
                        <Text
                          style={[styles.attachmentTitle, { color: theme.colors.onSurface }]}
                          numberOfLines={1}
                        >
                          {attachment.linkTitle}
                        </Text>
                        <Text
                          style={[styles.attachmentUrl, { color: theme.colors.onSurfaceVariant }]}
                          numberOfLines={1}
                        >
                          {attachment.linkUrl}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <IconButton
                      icon="content-copy"
                      size={18}
                      iconColor={theme.colors.onSurfaceVariant}
                      onPress={async () => {
                        await Clipboard.setStringAsync(attachment.linkUrl);
                        Alert.alert('Copied', 'Link copied to clipboard');
                      }}
                      style={{ margin: 0 }}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Comments Count */}
            {task.commentCount !== undefined && task.commentCount > 0 && (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <IconButton icon="comment-outline" size={16} style={{ margin: 0 }} />
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    {task.commentCount} comment{task.commentCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
          )}

          {/* Actions */}
          {canManage && !loading && (
            <>
              <Divider style={{ marginVertical: 12 }} />
              <View style={styles.detailActions}>
                <Button
                  mode="outlined"
                  icon="pencil"
                  onPress={onEdit}
                  disabled={submitting}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Edit
                </Button>
                <Button
                  mode="outlined"
                  icon="delete"
                  onPress={onDelete}
                  disabled={submitting}
                  textColor="#EF4444"
                  style={{ borderColor: '#EF4444' }}
                >
                  Delete
                </Button>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Status Picker Modal */}
      <FilterPickerModal
        visible={showStatusPicker}
        onDismiss={() => setShowStatusPicker(false)}
        onSelect={handleStatusSelect}
        title="Update Status"
        options={statusOptions}
        selectedValue={task.status}
        theme={theme}
      />

      {/* Block Reason Modal */}
      <BlockReasonModal
        visible={showBlockReasonModal}
        onDismiss={() => {
          setShowBlockReasonModal(false);
          setPendingStatus(null);
        }}
        onSubmit={handleBlockReasonSubmit}
        submitting={submitting}
        theme={theme}
      />
    </RNModal>
  );
};

// Task Form Modal
const TaskFormModal = ({
  visible,
  task,
  projects,
  onDismiss,
  onSubmit,
  submitting,
  theme,
}: {
  visible: boolean;
  task: Task | null;
  projects: Project[];
  onDismiss: () => void;
  onSubmit: (data: any) => void;
  submitting: boolean;
  theme: any;
}) => {
  const [projectId, setProjectId] = useState<number | null>(task?.projectId || null);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [assigneeId, setAssigneeId] = useState<number | null>(task?.assigneeId || null);
  const [dueDate, setDueDate] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null);
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours?.toString() || '');
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachmentInput[]>(
    task?.attachments?.map((a) => ({ linkTitle: a.linkTitle, linkUrl: a.linkUrl })) || []
  );
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);

  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const isEditing = !!task;

  // Status options for form - blocked only available when editing
  const formStatusOptions = TASK_STATUSES.filter((s) =>
    s.value !== '' && (isEditing || s.value !== 'blocked')
  );

  useEffect(() => {
    if (visible) {
      setProjectId(task?.projectId || null);
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setStatus(task?.status || 'todo');
      setPriority(task?.priority || 'medium');
      setAssigneeId(task?.assigneeId || null);
      setDueDate(task?.dueDate ? new Date(task.dueDate) : null);
      setEstimatedHours(task?.estimatedHours?.toString() || '');
      setTags(task?.tags || []);
      setTagInput('');
      setAttachments(
        task?.attachments?.map((a) => ({ linkTitle: a.linkTitle, linkUrl: a.linkUrl })) || []
      );
      setAttachmentTitle('');
      setAttachmentUrl('');
      setShowAttachmentForm(false);
    }
  }, [visible, task]);

  const loadUsers = async (search?: string) => {
    try {
      setLoadingUsers(true);
      const data = await projectService.getUsers({ search, limit: 50 });
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showAssigneePicker) {
      loadUsers();
    }
  }, [showAssigneePicker]);

  // Tags handlers
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Attachments handlers
  const handleAddAttachment = () => {
    const trimmedTitle = attachmentTitle.trim();
    const trimmedUrl = attachmentUrl.trim();

    if (!trimmedTitle || !trimmedUrl) {
      Alert.alert('Error', 'Please enter both title and URL');
      return;
    }

    // Basic URL validation
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      Alert.alert('Error', 'Please enter a valid URL (starting with http:// or https://)');
      return;
    }

    setAttachments([...attachments, { linkTitle: trimmedTitle, linkUrl: trimmedUrl }]);
    setAttachmentTitle('');
    setAttachmentUrl('');
    setShowAttachmentForm(false);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!projectId) {
      Alert.alert('Error', 'Please select a project');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    onSubmit({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      status: isEditing ? status : 'todo',
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedAssignee = (users || []).find((u) => u.id === assigneeId) || (task?.assignee as User | undefined);

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardView}
        >
          <View style={[styles.formModalContainer, { backgroundColor: theme.colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                  {isEditing ? 'Edit Task' : 'Create Task'}
                </Text>
                <IconButton icon="close" onPress={onDismiss} disabled={submitting} />
              </View>

              <Divider style={{ marginBottom: 16 }} />

              {/* Project */}
              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>
                Project *
              </Text>
              <TouchableOpacity
                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
                onPress={() => setShowProjectPicker(true)}
                disabled={submitting || isEditing}
              >
                <Text style={{ color: selectedProject ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                  {selectedProject?.name || 'Select project'}
                </Text>
              </TouchableOpacity>

              {/* Title */}
              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Title *
              </Text>
              <TextInput
                mode="outlined"
                value={title}
                onChangeText={setTitle}
                placeholder="Task title"
                disabled={submitting}
              />

              {/* Description */}
              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Description
              </Text>
              <TextInput
                mode="outlined"
                value={description}
                onChangeText={setDescription}
                placeholder="Task description"
                multiline
                numberOfLines={3}
                disabled={submitting}
              />

              {/* Status (Edit mode only) */}
              {isEditing && (
                <>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                    Status
                  </Text>
                  <TouchableOpacity
                    style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
                    onPress={() => setShowStatusPicker(true)}
                    disabled={submitting}
                  >
                    <Chip
                      mode="flat"
                      textStyle={{ color: '#fff', fontSize: 12 }}
                      style={{ backgroundColor: getStatusColor(status) }}
                    >
                      {formatStatus(status)}
                    </Chip>
                  </TouchableOpacity>
                </>
              )}

              {/* Priority */}
              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Priority
              </Text>
              <TouchableOpacity
                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
                onPress={() => setShowPriorityPicker(true)}
                disabled={submitting}
              >
                <Chip
                  mode="outlined"
                  textStyle={{ color: getPriorityColor(priority) }}
                  style={{ borderColor: getPriorityColor(priority) }}
                >
                  {formatPriority(priority)}
                </Chip>
              </TouchableOpacity>

              {/* Assignee */}
              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Assignee
              </Text>
              <TouchableOpacity
                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
                onPress={() => setShowAssigneePicker(true)}
                disabled={submitting}
              >
                {selectedAssignee ? (
                  <View style={styles.assigneeRow}>
                    <Avatar.Text
                      size={24}
                      label={`${selectedAssignee.firstName?.charAt(0) || ''}${selectedAssignee.lastName?.charAt(0) || ''}`}
                    />
                    <Text style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                      {selectedAssignee.firstName} {selectedAssignee.lastName}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>Select assignee</Text>
                )}
              </TouchableOpacity>

              {/* Due Date */}
              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Due Date
              </Text>
              <TouchableOpacity
                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
                onPress={() => setShowDatePicker(true)}
                disabled={submitting}
              >
                <Text style={{ color: dueDate ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                  {dueDate ? format(dueDate, 'MMMM dd, yyyy') : 'Select due date'}
                </Text>
                {dueDate && (
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => setDueDate(null)}
                    style={{ margin: 0 }}
                  />
                )}
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setDueDate(date);
                  }}
                />
              )}

              {/* Estimated Hours */}
              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Estimated Hours
              </Text>
              <TextInput
                mode="outlined"
                value={estimatedHours}
                onChangeText={setEstimatedHours}
                placeholder="e.g., 4"
                keyboardType="decimal-pad"
                disabled={submitting}
              />

              {/* Tags */}
              <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Tags
              </Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  mode="outlined"
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add a tag..."
                  style={{ flex: 1 }}
                  disabled={submitting}
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                />
                <IconButton
                  icon="plus"
                  mode="contained"
                  size={20}
                  onPress={handleAddTag}
                  disabled={submitting || !tagInput.trim()}
                  style={{ marginLeft: 8 }}
                />
              </View>
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={`${tag}-${index}`}
                      mode="outlined"
                      onClose={() => handleRemoveTag(tag)}
                      style={styles.tagChip}
                      textStyle={{ fontSize: 12 }}
                      disabled={submitting}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}

              {/* Attachments */}
              <View style={styles.attachmentsSectionHeader}>
                <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                  Attachment Links
                </Text>
                <Button
                  mode="text"
                  compact
                  icon="plus"
                  onPress={() => setShowAttachmentForm(!showAttachmentForm)}
                  disabled={submitting}
                >
                  Add
                </Button>
              </View>

              {showAttachmentForm && (
                <View style={[styles.attachmentFormContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <TextInput
                    mode="outlined"
                    value={attachmentTitle}
                    onChangeText={setAttachmentTitle}
                    placeholder="Link title (e.g., Figma Design)"
                    style={{ marginBottom: 8 }}
                    disabled={submitting}
                  />
                  <TextInput
                    mode="outlined"
                    value={attachmentUrl}
                    onChangeText={setAttachmentUrl}
                    placeholder="URL (https://...)"
                    keyboardType="url"
                    autoCapitalize="none"
                    style={{ marginBottom: 8 }}
                    disabled={submitting}
                  />
                  <View style={styles.attachmentFormActions}>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => {
                        setShowAttachmentForm(false);
                        setAttachmentTitle('');
                        setAttachmentUrl('');
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      compact
                      onPress={handleAddAttachment}
                      disabled={submitting || !attachmentTitle.trim() || !attachmentUrl.trim()}
                    >
                      Add Link
                    </Button>
                  </View>
                </View>
              )}

              {attachments.length > 0 && (
                <View style={styles.attachmentsList}>
                  {attachments.map((attachment, index) => (
                    <View
                      key={`${attachment.linkUrl}-${index}`}
                      style={[styles.attachmentItemForm, { backgroundColor: theme.colors.surfaceVariant }]}
                    >
                      <View style={styles.attachmentItemContent}>
                        <IconButton
                          icon="link-variant"
                          size={16}
                          iconColor={theme.colors.primary}
                          style={{ margin: 0 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.attachmentItemTitle, { color: theme.colors.onSurface }]}
                            numberOfLines={1}
                          >
                            {attachment.linkTitle}
                          </Text>
                          <Text
                            style={[styles.attachmentItemUrl, { color: theme.colors.onSurfaceVariant }]}
                            numberOfLines={1}
                          >
                            {attachment.linkUrl}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.attachmentItemActions}>
                        <IconButton
                          icon="content-copy"
                          size={16}
                          iconColor={theme.colors.onSurfaceVariant}
                          onPress={async () => {
                            await Clipboard.setStringAsync(attachment.linkUrl);
                            Alert.alert('Copied', 'Link copied to clipboard');
                          }}
                          style={{ margin: 0 }}
                          disabled={submitting}
                        />
                        <IconButton
                          icon="close"
                          size={16}
                          iconColor="#EF4444"
                          onPress={() => handleRemoveAttachment(index)}
                          style={{ margin: 0 }}
                          disabled={submitting}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={onDismiss}
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
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Project Picker */}
      <ProjectPickerModal
        visible={showProjectPicker}
        onDismiss={() => setShowProjectPicker(false)}
        onSelect={(project) => setProjectId(project?.id || null)}
        projects={projects.filter((p) => p.status === 'active')}
        selectedProjectId={projectId}
        loading={false}
        theme={theme}
      />

      {/* Status Picker */}
      <FilterPickerModal
        visible={showStatusPicker}
        onDismiss={() => setShowStatusPicker(false)}
        onSelect={(val) => setStatus(val as TaskStatus)}
        title="Select Status"
        options={formStatusOptions}
        selectedValue={status}
        theme={theme}
      />

      {/* Priority Picker */}
      <FilterPickerModal
        visible={showPriorityPicker}
        onDismiss={() => setShowPriorityPicker(false)}
        onSelect={(val) => setPriority(val)}
        title="Select Priority"
        options={TASK_PRIORITIES.filter((p) => p.value !== '')}
        selectedValue={priority}
        theme={theme}
      />

      {/* Assignee Picker */}
      <RNModal
        visible={showAssigneePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssigneePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                Select Assignee
              </Text>
              <IconButton icon="close" onPress={() => setShowAssigneePicker(false)} />
            </View>

            <Searchbar
              placeholder="Search users..."
              value={userSearch}
              onChangeText={(text) => {
                setUserSearch(text);
                loadUsers(text);
              }}
              style={styles.searchInput}
            />

            <ScrollView style={{ maxHeight: 400 }}>
              {/* Unassigned option */}
              <TouchableOpacity
                style={[
                  styles.projectPickerItem,
                  assigneeId === null && { backgroundColor: theme.colors.primaryContainer },
                ]}
                onPress={() => {
                  setAssigneeId(null);
                  setShowAssigneePicker(false);
                }}
              >
                <Text style={{ color: theme.colors.onSurface }}>Unassigned</Text>
                {assigneeId === null && (
                  <IconButton icon="check" size={20} iconColor={theme.colors.primary} />
                )}
              </TouchableOpacity>

              <Divider />

              {loadingUsers ? (
                <ActivityIndicator style={{ padding: 20 }} />
              ) : (
                users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.projectPickerItem,
                      assigneeId === user.id && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                    onPress={() => {
                      setAssigneeId(user.id);
                      setShowAssigneePicker(false);
                    }}
                  >
                    <View style={styles.assigneeRow}>
                      <Avatar.Text
                        size={32}
                        label={`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`}
                      />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ color: theme.colors.onSurface }}>
                          {user.firstName} {user.lastName}
                        </Text>
                        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                          {user.email}
                        </Text>
                      </View>
                    </View>
                    {assigneeId === user.id && (
                      <IconButton icon="check" size={20} iconColor={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </RNModal>
    </RNModal>
  );
};

// Employee Report Item
const EmployeeReportItem = ({
  report,
  theme,
}: {
  report: UserTaskReport;
  theme: any;
}) => {
  const completedCount = report.stats.done + report.stats.approved;
  const progress = report.stats.total > 0 ? completedCount / report.stats.total : 0;

  return (
    <Card style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.reportHeader}>
          <View style={styles.assigneeRow}>
            {report.user.profileImageUrl ? (
              <Avatar.Image size={40} source={{ uri: report.user.profileImageUrl }} />
            ) : (
              <Avatar.Text
                size={40}
                label={`${report.user.firstName?.charAt(0) || ''}${report.user.lastName?.charAt(0) || ''}`}
              />
            )}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.reportUserName, { color: theme.colors.onSurface }]}>
                {report.user.firstName} {report.user.lastName}
              </Text>
              <Text style={[styles.reportUserEmail, { color: theme.colors.onSurfaceVariant }]}>
                {report.user.email}
              </Text>
              {report.user.department && (
                <Text style={[styles.reportDepartment, { color: theme.colors.onSurfaceVariant }]}>
                  {report.user.department.name}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>Completion</Text>
            <Text style={{ fontSize: 12, color: theme.colors.onSurface, fontWeight: '600' }}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color={progress >= 0.7 ? '#10B981' : progress >= 0.4 ? '#F59E0B' : '#EF4444'}
            style={{ height: 6, borderRadius: 3 }}
          />
        </View>

        {/* Stats Grid */}
        <View style={styles.reportStatsGrid}>
          <View style={styles.reportStatItem}>
            <Text style={[styles.reportStatValue, { color: theme.colors.onSurface }]}>{report.stats.total}</Text>
            <Text style={[styles.reportStatLabel, { color: theme.colors.onSurfaceVariant }]}>Total</Text>
          </View>
          <View style={styles.reportStatItem}>
            <Text style={[styles.reportStatValue, { color: '#6B7280' }]}>{report.stats.todo}</Text>
            <Text style={[styles.reportStatLabel, { color: theme.colors.onSurfaceVariant }]}>To Do</Text>
          </View>
          <View style={styles.reportStatItem}>
            <Text style={[styles.reportStatValue, { color: '#3B82F6' }]}>{report.stats.inProgress}</Text>
            <Text style={[styles.reportStatLabel, { color: theme.colors.onSurfaceVariant }]}>In Progress</Text>
          </View>
          <View style={styles.reportStatItem}>
            <Text style={[styles.reportStatValue, { color: '#10B981' }]}>{report.stats.done + report.stats.approved}</Text>
            <Text style={[styles.reportStatLabel, { color: theme.colors.onSurfaceVariant }]}>Done</Text>
          </View>
          <View style={styles.reportStatItem}>
            <Text style={[styles.reportStatValue, { color: '#F59E0B' }]}>{report.stats.blocked}</Text>
            <Text style={[styles.reportStatLabel, { color: theme.colors.onSurfaceVariant }]}>Blocked</Text>
          </View>
          <View style={styles.reportStatItem}>
            <Text style={[styles.reportStatValue, { color: '#EF4444' }]}>{report.stats.overdue}</Text>
            <Text style={[styles.reportStatLabel, { color: theme.colors.onSurfaceVariant }]}>Overdue</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

// Main Screen Component
export default function ProjectsScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'tasks' | 'reports'>('tasks');
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Task list state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskPage, setTaskPage] = useState(1);
  const [hasMoreTasks, setHasMoreTasks] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Filter modals
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  // Task modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reports state
  const [reports, setReports] = useState<TaskReportsResponse | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);

  const LIMIT = 20;
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  // Load stats
  const loadStats = async () => {
    try {
      const data = await projectService.getProjectStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Load projects
  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await projectService.getProjects({ limit: 100 });
      setProjects(response.items);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Load tasks
  const loadTasks = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (loadingTasks && append) return;

      try {
        setLoadingTasks(true);
        const response = await projectService.getTasks({
          page,
          limit: LIMIT,
          projectId: selectedProjectId || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          myTasks: myTasksOnly || undefined,
          overdue: overdueOnly || undefined,
          search: searchQuery || undefined,
        });

        if (append) {
          setTasks((prev) => [...prev, ...response.items]);
        } else {
          setTasks(response.items);
        }

        setTaskPage(page);
        setHasMoreTasks(page < response.pagination.totalPages);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        if (!append) {
          setTasks([]);
        }
      } finally {
        setLoadingTasks(false);
      }
    },
    [selectedProjectId, statusFilter, priorityFilter, myTasksOnly, overdueOnly, searchQuery]
  );

  // Load reports
  const loadReports = async () => {
    if (!isManager) return;

    try {
      setLoadingReports(true);
      const data = await projectService.getTaskReports({
        projectId: selectedProjectId || undefined,
      });
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStats();
    loadProjects();
    loadTasks(1);
  }, []);

  // Reload tasks when filters change
  useEffect(() => {
    loadTasks(1);
  }, [selectedProjectId, statusFilter, priorityFilter, myTasksOnly, overdueOnly]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load reports when tab changes
  useEffect(() => {
    if (activeTab === 'reports' && !reports && isManager) {
      loadReports();
    }
  }, [activeTab]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadStats(),
      loadProjects(),
      activeTab === 'tasks' ? loadTasks(1) : loadReports(),
    ]);
    setRefreshing(false);
  };

  // Load more tasks
  const loadMoreTasks = () => {
    if (hasMoreTasks && !loadingTasks) {
      loadTasks(taskPage + 1, true);
    }
  };

  // Task status change
  const handleStatusChange = async (status: string, blockReason?: string) => {
    if (!selectedTask) return;

    try {
      setSubmitting(true);
      await projectService.updateTaskStatus(selectedTask.id, status, blockReason);
      setSelectedTask({ ...selectedTask, status: status as TaskStatus, blockReason: blockReason || null });
      loadTasks(1);
      loadStats();
      Alert.alert('Success', 'Task status updated');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update status';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Create/Update task
  const handleTaskSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      if (editingTask) {
        await projectService.updateTask(editingTask.id, data);
        Alert.alert('Success', 'Task updated');
      } else {
        await projectService.createTask(data);
        Alert.alert('Success', 'Task created');
      }
      setShowTaskForm(false);
      setEditingTask(null);
      loadTasks(1);
      loadStats();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save task';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete task
  const handleDeleteTask = () => {
    if (!selectedTask) return;

    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmitting(true);
            await projectService.deleteTask(selectedTask.id);
            Alert.alert('Success', 'Task deleted');
            setShowTaskDetail(false);
            setSelectedTask(null);
            loadTasks(1);
            loadStats();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete task');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  // Open task detail
  const openTaskDetail = async (task: Task) => {
    // Show modal immediately with loading state
    setSelectedTask(task);
    setShowTaskDetail(true);
    setLoadingTaskDetail(true);

    try {
      const fullTask = await projectService.getTaskById(task.id);
      setSelectedTask(fullTask);
    } catch (error) {
      // Keep the basic task data if fetch fails
      console.error('Failed to load task details:', error);
    } finally {
      setLoadingTaskDetail(false);
    }
  };

  // Open task form for editing
  const openEditForm = () => {
    setEditingTask(selectedTask);
    setShowTaskDetail(false);
    setShowTaskForm(true);
  };

  // Get selected project name
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Footer loading component
  const FooterLoading = () => {
    if (!loadingTasks) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  // Active filters count
  const activeFiltersCount = [statusFilter, priorityFilter, myTasksOnly, overdueOnly].filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerTitleRow}>
          <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
            Projects
          </Text>
          {isManager && (
            <IconButton
              icon="plus"
              mode="contained"
              size={20}
              onPress={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
            />
          )}
        </View>

        {/* Project Picker Button */}
        <TouchableOpacity
          style={[styles.projectPickerButton, { borderColor: theme.colors.outline }]}
          onPress={() => setShowProjectPicker(true)}
        >
          <IconButton icon="folder-outline" size={20} style={{ margin: 0 }} />
          <Text style={{ color: theme.colors.onSurface, flex: 1 }} numberOfLines={1}>
            {selectedProject?.name || 'All Tasks'}
          </Text>
          <IconButton icon="chevron-down" size={20} style={{ margin: 0 }} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScrollEndDrag={() => {
          if (activeTab === 'tasks') {
            loadMoreTasks();
          }
        }}
      >
        {/* Stats Section */}
        <View style={styles.statsRow}>
          <StatCard
            title="Active Projects"
            value={stats?.projectsByStatus?.active || 0}
            color={theme.colors.primary}
            theme={theme}
          />
          <StatCard
            title="My Tasks"
            value={stats?.myTasks || 0}
            color="#3B82F6"
            theme={theme}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Overdue"
            value={stats?.overdueTasks || 0}
            color="#EF4444"
            theme={theme}
          />
          <StatCard
            title="Due This Week"
            value={stats?.tasksDueThisWeek || 0}
            color="#F59E0B"
            theme={theme}
          />
        </View>

        {/* Tabs */}
        {isManager ? (
          <SegmentedButtons
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'tasks' | 'reports')}
            buttons={[
              { value: 'tasks', label: 'Tasks' },
              { value: 'reports', label: 'Reports' },
            ]}
            style={styles.tabButtons}
          />
        ) : (
          <View style={{ height: 16 }} />
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <>
            {/* Filter Section */}
            <View style={styles.filterSection}>
              <Searchbar
                placeholder="Search tasks..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchBar}
              />

              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterChip, statusFilter && { backgroundColor: theme.colors.primaryContainer }]}
                  onPress={() => setShowStatusPicker(true)}
                >
                  <Text style={{ color: statusFilter ? theme.colors.primary : theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    {statusFilter ? formatStatus(statusFilter) : 'Status'}
                  </Text>
                  <IconButton icon="chevron-down" size={14} style={{ margin: 0 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, priorityFilter && { backgroundColor: theme.colors.primaryContainer }]}
                  onPress={() => setShowPriorityPicker(true)}
                >
                  <Text style={{ color: priorityFilter ? theme.colors.primary : theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    {priorityFilter ? formatPriority(priorityFilter) : 'Priority'}
                  </Text>
                  <IconButton icon="chevron-down" size={14} style={{ margin: 0 }} />
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleItem}>
                  <Text style={{ color: theme.colors.onSurface, fontSize: 13 }}>My Tasks</Text>
                  <Switch value={myTasksOnly} onValueChange={setMyTasksOnly} />
                </View>
                <View style={styles.toggleItem}>
                  <Text style={{ color: theme.colors.onSurface, fontSize: 13 }}>Overdue</Text>
                  <Switch value={overdueOnly} onValueChange={setOverdueOnly} />
                </View>
              </View>

              {activeFiltersCount > 0 && (
                <Button
                  mode="text"
                  compact
                  onPress={() => {
                    setStatusFilter('');
                    setPriorityFilter('');
                    setMyTasksOnly(false);
                    setOverdueOnly(false);
                    setSearchQuery('');
                  }}
                >
                  Clear filters ({activeFiltersCount})
                </Button>
              )}
            </View>

            {/* Task List */}
            {tasks.length === 0 && !loadingTasks ? (
              <View style={styles.emptySection}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>No tasks found</Text>
              </View>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={() => openTaskDetail(task)}
                  theme={theme}
                />
              ))
            )}

            <FooterLoading />
          </>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && isManager && (
          <>
            {/* Summary Cards */}
            {reports && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryCardsScroll}>
                <View style={styles.summaryCardsRow}>
                  <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>{reports.totals.total}</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Total</Text>
                  </View>
                  <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.summaryValue, { color: '#6B7280' }]}>{reports.totals.todo}</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>To Do</Text>
                  </View>
                  <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>{reports.totals.inProgress}</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>In Progress</Text>
                  </View>
                  <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>{reports.totals.done + reports.totals.approved}</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Done</Text>
                  </View>
                  <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{reports.totals.blocked}</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Blocked</Text>
                  </View>
                  <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{reports.totals.overdue}</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Overdue</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Employee Reports */}
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface, marginTop: 16 }]}>
              Employee Breakdown
            </Text>

            {loadingReports ? (
              <ActivityIndicator style={{ padding: 40 }} />
            ) : reports?.reports.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>No employee data available</Text>
              </View>
            ) : (
              reports?.reports.map((report) => (
                <EmployeeReportItem key={report.user.id} report={report} theme={theme} />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <ProjectPickerModal
        visible={showProjectPicker}
        onDismiss={() => setShowProjectPicker(false)}
        onSelect={(project) => setSelectedProjectId(project?.id || null)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        loading={loadingProjects}
        theme={theme}
      />

      <FilterPickerModal
        visible={showStatusPicker}
        onDismiss={() => setShowStatusPicker(false)}
        onSelect={setStatusFilter}
        title="Filter by Status"
        options={TASK_STATUSES}
        selectedValue={statusFilter}
        theme={theme}
      />

      <FilterPickerModal
        visible={showPriorityPicker}
        onDismiss={() => setShowPriorityPicker(false)}
        onSelect={setPriorityFilter}
        title="Filter by Priority"
        options={TASK_PRIORITIES}
        selectedValue={priorityFilter}
        theme={theme}
      />

      <TaskDetailModal
        visible={showTaskDetail}
        task={selectedTask}
        loading={loadingTaskDetail}
        onDismiss={() => {
          setShowTaskDetail(false);
          setSelectedTask(null);
        }}
        onEdit={openEditForm}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
        canManage={isManager}
        submitting={submitting}
        theme={theme}
      />

      <TaskFormModal
        visible={showTaskForm}
        task={editingTask}
        projects={projects}
        onDismiss={() => {
          setShowTaskForm(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabButtons: {
    marginVertical: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
    elevation: 0,
  },
  searchInput: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  taskCode: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  projectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 120,
  },
  projectBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 10,
  },
  taskBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  warningBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  assigneeContainer: {
    flex: 1,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeName: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    maxWidth: 120,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  taskMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  dueDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptySection: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
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
  pickerModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  detailModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  detailLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  projectPickerItemContent: {
    flex: 1,
  },
  projectPickerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  projectPickerName: {
    fontSize: 15,
    fontWeight: '500',
  },
  projectPickerSubtext: {
    fontSize: 12,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 90,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  descriptionSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  blockReasonSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  attachmentsSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  attachmentTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentUrl: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailActions: {
    flexDirection: 'row',
  },
  reportCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  reportHeader: {
    marginBottom: 12,
  },
  reportUserName: {
    fontSize: 15,
    fontWeight: '600',
  },
  reportUserEmail: {
    fontSize: 12,
  },
  reportDepartment: {
    fontSize: 11,
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reportStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  reportStatItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reportStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportStatLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  summaryCardsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  summaryCard: {
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  // Tags styles
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    marginBottom: 0,
  },
  // Attachment form styles
  attachmentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachmentFormContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  attachmentFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  attachmentsList: {
    marginTop: 8,
  },
  attachmentItemForm: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentItemTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  attachmentItemUrl: {
    fontSize: 11,
  },
  attachmentItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
