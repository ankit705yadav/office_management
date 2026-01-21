// Daily Reports screen - Daily Report Management

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
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { dailyReportService, TeamMember } from '../../services/dailyReport.service';
import { DailyReport } from '../../types';

// Helper function to safely format dates
const safeFormatDate = (dateStr: string | undefined | null, formatStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = parseISO(dateStr);
    if (isNaN(date.getTime())) return '-';
    return format(date, formatStr);
  } catch {
    return '-';
  }
};

// Generate date options for past 7 days
const generateDateOptions = () => {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 8; i++) {
    const date = subDays(today, i);
    options.push({
      value: format(date, 'yyyy-MM-dd'),
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : format(date, 'EEE, MMM dd'),
    });
  }
  return options;
};

// Report Card Component
const ReportCard = ({
  report,
  onView,
  showEmployee,
  theme,
}: {
  report: DailyReport;
  onView: () => void;
  showEmployee: boolean;
  theme: any;
}) => {
  const statusColor = report.status === 'submitted' ? '#10B981' : '#F59E0B';

  return (
    <Card style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        {/* Employee Name (for team reports) */}
        {showEmployee && report.user && (
          <Text style={[styles.employeeName, { color: theme.colors.primary }]}>
            {report.user.firstName} {report.user.lastName}
          </Text>
        )}

        <View style={styles.reportCardHeader}>
          <Text style={[styles.reportDate, { color: theme.colors.onSurface }]}>
            {safeFormatDate(report.reportDate, 'EEE, MMM dd, yyyy')}
          </Text>
          <Chip
            mode="flat"
            textStyle={{ fontSize: 11, color: '#fff' }}
            style={{ backgroundColor: statusColor }}
          >
            {report.status === 'submitted' ? 'Submitted' : 'Draft'}
          </Chip>
        </View>

        <Text
          style={[styles.reportTitle, { color: theme.colors.onSurface }]}
          numberOfLines={2}
        >
          {report.title}
        </Text>

        {report.description && (
          <Text
            style={[styles.reportDescription, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {report.description}
          </Text>
        )}

        <View style={styles.reportCardFooter}>
          <Text style={[styles.reportTimestamp, { color: theme.colors.onSurfaceVariant }]}>
            {report.status === 'submitted' && report.submittedAt
              ? `Submitted: ${safeFormatDate(report.submittedAt, 'MMM dd, h:mm a')}`
              : `Updated: ${safeFormatDate(report.updatedAt, 'MMM dd, h:mm a')}`}
          </Text>
          <IconButton
            icon="eye"
            size={20}
            onPress={onView}
            mode="contained-tonal"
          />
        </View>
      </Card.Content>
    </Card>
  );
};

// View Report Modal Component
const ViewReportModal = ({
  visible,
  report,
  onDismiss,
  theme,
}: {
  visible: boolean;
  report: DailyReport | null;
  onDismiss: () => void;
  theme: any;
}) => {
  const statusColor = report?.status === 'submitted' ? '#10B981' : '#F59E0B';

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.viewModalContainer, { backgroundColor: theme.colors.surface }]}>
          {report ? (
            <>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface, flex: 1 }}>
                  {safeFormatDate(report.reportDate, 'EEEE, MMMM dd, yyyy')}
                </Text>
                <IconButton icon="close" onPress={onDismiss} />
              </View>

              <Divider style={{ marginBottom: 16 }} />

              <ScrollView
                style={styles.viewModalContent}
                contentContainerStyle={styles.viewModalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Employee info */}
                {report.user && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Submitted by:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                      {report.user.firstName} {report.user.lastName}
                    </Text>
                  </View>
                )}

                {report.user?.email && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Email:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                      {report.user.email}
                    </Text>
                  </View>
                )}

                {/* Status */}
                <View style={[styles.detailRow, { alignItems: 'center' }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Status:
                  </Text>
                  <Chip
                    mode="flat"
                    textStyle={{ fontSize: 12, color: '#fff' }}
                    style={{ backgroundColor: statusColor }}
                  >
                    {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                  </Chip>
                </View>

                {report.status === 'submitted' && report.submittedAt && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Submitted at:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                      {safeFormatDate(report.submittedAt, 'MMM dd, yyyy h:mm a')}
                    </Text>
                  </View>
                )}

                <Divider style={{ marginVertical: 16 }} />

                {/* Title */}
                <Text style={[styles.viewModalSectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                  Title
                </Text>
                <Text style={[styles.viewModalTitle, { color: theme.colors.onSurface }]}>
                  {report.title}
                </Text>

                {/* Description */}
                {report.description ? (
                  <>
                    <Text style={[styles.viewModalSectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                      Description
                    </Text>
                    <Text style={[styles.viewModalDescription, { color: theme.colors.onSurface }]}>
                      {report.description}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.viewModalSectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                      Description
                    </Text>
                    <Text style={[styles.viewModalDescription, { color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }]}>
                      No description provided
                    </Text>
                  </>
                )}
              </ScrollView>

              <Button
                mode="contained"
                onPress={onDismiss}
                style={styles.closeButton}
              >
                Close
              </Button>
            </>
          ) : (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
};

export default function DailyReportsScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'today' | 'my' | 'team'>('today');

  // Today's Report state
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentReport, setCurrentReport] = useState<DailyReport | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [todayLoading, setTodayLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // My Reports state
  const [myReports, setMyReports] = useState<DailyReport[]>([]);
  const [myReportsPagination, setMyReportsPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [myReportsLoading, setMyReportsLoading] = useState(false);
  const [myReportsRefreshing, setMyReportsRefreshing] = useState(false);

  // Team Reports state
  const [teamReports, setTeamReports] = useState<DailyReport[]>([]);
  const [teamReportsPagination, setTeamReportsPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [teamReportsLoading, setTeamReportsLoading] = useState(false);
  const [teamReportsRefreshing, setTeamReportsRefreshing] = useState(false);

  // View Modal state
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  // Date Picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Employee Filter state
  const [showEmployeeFilter, setShowEmployeeFilter] = useState(false);

  const dateOptions = generateDateOptions();
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isSubmitted = currentReport?.status === 'submitted';

  // Load report for selected date
  const loadReportByDate = useCallback(async () => {
    setTodayLoading(true);
    try {
      const report = await dailyReportService.getReportByDate(selectedDate);
      setCurrentReport(report);
      if (report) {
        setTitle(report.title);
        setDescription(report.description || '');
      } else {
        setTitle('');
        setDescription('');
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      setCurrentReport(null);
      setTitle('');
      setDescription('');
    } finally {
      setTodayLoading(false);
    }
  }, [selectedDate]);

  // Load my reports
  const loadMyReports = async (page: number = 1, append: boolean = false) => {
    if (myReportsLoading && append) return;

    try {
      setMyReportsLoading(true);
      const response = await dailyReportService.getMyReports({ page, limit: 20 });

      if (append) {
        setMyReports(prev => [...prev, ...response.reports]);
      } else {
        setMyReports(response.reports);
      }

      setMyReportsPagination({
        ...response.pagination,
        page,
      });
    } catch (error) {
      console.error('Failed to load my reports:', error);
      if (!append) {
        setMyReports([]);
      }
    } finally {
      setMyReportsLoading(false);
      setMyReportsRefreshing(false);
    }
  };

  // Load team reports
  const loadTeamReports = async (page: number = 1, append: boolean = false) => {
    if (teamReportsLoading && append) return;

    try {
      setTeamReportsLoading(true);
      const filters: any = { page, limit: 20 };
      if (selectedEmployee) {
        filters.employeeId = selectedEmployee;
      }

      const response = await dailyReportService.getTeamReports(filters);

      if (append) {
        setTeamReports(prev => [...prev, ...response.reports]);
      } else {
        setTeamReports(response.reports);
      }

      setTeamReportsPagination({
        ...response.pagination,
        page,
      });
    } catch (error) {
      console.error('Failed to load team reports:', error);
      if (!append) {
        setTeamReports([]);
      }
    } finally {
      setTeamReportsLoading(false);
      setTeamReportsRefreshing(false);
    }
  };

  // Load team members
  const loadTeamMembers = async () => {
    try {
      const members = await dailyReportService.getTeamMembers();
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadReportByDate();
  }, [loadReportByDate]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'my' && myReports.length === 0) {
      loadMyReports(1);
    } else if (activeTab === 'team' && isManager) {
      if (teamReports.length === 0) {
        loadTeamReports(1);
      }
      if (teamMembers.length === 0) {
        loadTeamMembers();
      }
    }
  }, [activeTab]);

  // Reload team reports when employee filter changes
  useEffect(() => {
    if (activeTab === 'team' && isManager) {
      loadTeamReports(1);
    }
  }, [selectedEmployee]);

  // Save draft handler
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const report = await dailyReportService.createOrUpdateReport({
        reportDate: selectedDate,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setCurrentReport(report);
      Alert.alert('Success', 'Report saved as draft');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save report';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  // Submit report handler
  const handleSubmitReport = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title before submitting');
      return;
    }

    // First save the report if there are changes
    if (!currentReport || title !== currentReport.title || description !== (currentReport.description || '')) {
      setSaving(true);
      try {
        const report = await dailyReportService.createOrUpdateReport({
          reportDate: selectedDate,
          title: title.trim(),
          description: description.trim() || undefined,
        });
        setCurrentReport(report);

        // Now submit
        setSubmitting(true);
        const submittedReport = await dailyReportService.submitReport(report.id);
        setCurrentReport(submittedReport);
        Alert.alert('Success', 'Report submitted successfully');
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Failed to save and submit report';
        Alert.alert('Error', message);
      } finally {
        setSaving(false);
        setSubmitting(false);
      }
    } else if (currentReport) {
      setSubmitting(true);
      try {
        const submittedReport = await dailyReportService.submitReport(currentReport.id);
        setCurrentReport(submittedReport);
        Alert.alert('Success', 'Report submitted successfully');
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Failed to submit report';
        Alert.alert('Error', message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // View report handler
  const handleViewReport = (report: DailyReport) => {
    setSelectedReport(report);
    setViewModalVisible(true);
  };

  // Refresh handlers
  const handleRefreshMyReports = () => {
    setMyReportsRefreshing(true);
    loadMyReports(1);
  };

  const handleRefreshTeamReports = () => {
    setTeamReportsRefreshing(true);
    loadTeamReports(1);
  };

  // Load more handlers
  const handleLoadMoreMyReports = () => {
    if (myReportsPagination.page < myReportsPagination.totalPages && !myReportsLoading) {
      loadMyReports(myReportsPagination.page + 1, true);
    }
  };

  const handleLoadMoreTeamReports = () => {
    if (teamReportsPagination.page < teamReportsPagination.totalPages && !teamReportsLoading) {
      loadTeamReports(teamReportsPagination.page + 1, true);
    }
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

  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <View style={styles.emptySection}>
      <Text style={{ color: theme.colors.onSurfaceVariant }}>{message}</Text>
    </View>
  );

  // Render Today's Report tab
  const renderTodayReport = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Date Picker */}
      <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>
        Report Date
      </Text>
      <Menu
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        anchor={
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: theme.colors.onSurface }}>
              {dateOptions.find(d => d.value === selectedDate)?.label || format(parseISO(selectedDate), 'EEE, MMM dd')}
            </Text>
            <IconButton icon="chevron-down" size={20} style={{ margin: 0 }} />
          </TouchableOpacity>
        }
        contentStyle={{ backgroundColor: theme.colors.surface }}
      >
        {dateOptions.map((option) => (
          <Menu.Item
            key={option.value}
            onPress={() => {
              setSelectedDate(option.value);
              setShowDatePicker(false);
            }}
            title={option.label}
            titleStyle={{
              color: option.value === selectedDate ? theme.colors.primary : theme.colors.onSurface,
              fontWeight: option.value === selectedDate ? '600' : '400',
            }}
          />
        ))}
      </Menu>

      {todayLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          {/* Status Banner */}
          {currentReport && (
            <View style={[
              styles.statusBanner,
              { backgroundColor: isSubmitted ? '#10B981' : '#F59E0B' }
            ]}>
              <Text style={styles.statusBannerText}>
                Status: {isSubmitted ? 'Submitted' : 'Draft'}
              </Text>
              {isSubmitted && currentReport.submittedAt && (
                <Text style={styles.statusBannerSubtext}>
                  Submitted at {safeFormatDate(currentReport.submittedAt, 'MMM dd, h:mm a')}
                </Text>
              )}
            </View>
          )}

          {/* Title Input */}
          <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
            Title *
          </Text>
          <TextInput
            mode="outlined"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter report title"
            disabled={isSubmitted || saving || submitting}
            style={styles.textInput}
          />

          {/* Description Input */}
          <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
            Description
          </Text>
          <TextInput
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter report description (optional)"
            multiline
            numberOfLines={6}
            disabled={isSubmitted || saving || submitting}
            style={[styles.textInput, styles.textArea]}
          />

          {/* Action Buttons */}
          {!isSubmitted && (
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={handleSaveDraft}
                loading={saving && !submitting}
                disabled={saving || submitting}
                style={{ flex: 1, marginRight: 8 }}
              >
                Save Draft
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmitReport}
                loading={submitting}
                disabled={saving || submitting}
                style={{ flex: 1 }}
              >
                Submit Report
              </Button>
            </View>
          )}

          {isSubmitted && (
            <View style={styles.submittedInfo}>
              <IconButton icon="lock" size={20} iconColor={theme.colors.onSurfaceVariant} />
              <Text style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                This report has been submitted and cannot be edited.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  // Render My Reports tab
  const renderMyReports = () => (
    <FlatList
      data={myReports}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ReportCard
          report={item}
          onView={() => handleViewReport(item)}
          showEmployee={false}
          theme={theme}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={myReportsRefreshing}
          onRefresh={handleRefreshMyReports}
        />
      }
      onEndReached={handleLoadMoreMyReports}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        !myReportsLoading ? <EmptyState message="No reports found" /> : null
      }
      ListFooterComponent={<FooterLoading loading={myReportsLoading && myReports.length > 0} />}
    />
  );

  // Render Team Reports tab
  const renderTeamReports = () => (
    <View style={{ flex: 1 }}>
      {/* Employee Filter */}
      <View style={styles.filterContainer}>
        <Menu
          visible={showEmployeeFilter}
          onDismiss={() => setShowEmployeeFilter(false)}
          anchor={
            <TouchableOpacity
              style={[styles.filterButton, { borderColor: theme.colors.outline }]}
              onPress={() => setShowEmployeeFilter(true)}
            >
              <Text style={{ color: theme.colors.onSurface }}>
                {selectedEmployee
                  ? teamMembers.find(m => m.id === selectedEmployee)
                    ? `${teamMembers.find(m => m.id === selectedEmployee)?.firstName} ${teamMembers.find(m => m.id === selectedEmployee)?.lastName}`
                    : 'All Employees'
                  : 'All Employees'}
              </Text>
              <IconButton icon="chevron-down" size={20} style={{ margin: 0 }} />
            </TouchableOpacity>
          }
          contentStyle={{ backgroundColor: theme.colors.surface, maxHeight: 300 }}
        >
          <Menu.Item
            onPress={() => {
              setSelectedEmployee(null);
              setShowEmployeeFilter(false);
            }}
            title="All Employees"
            titleStyle={{
              color: selectedEmployee === null ? theme.colors.primary : theme.colors.onSurface,
              fontWeight: selectedEmployee === null ? '600' : '400',
            }}
          />
          <Divider />
          {teamMembers.map((member) => (
            <Menu.Item
              key={member.id}
              onPress={() => {
                setSelectedEmployee(member.id);
                setShowEmployeeFilter(false);
              }}
              title={`${member.firstName} ${member.lastName}`}
              titleStyle={{
                color: selectedEmployee === member.id ? theme.colors.primary : theme.colors.onSurface,
                fontWeight: selectedEmployee === member.id ? '600' : '400',
              }}
            />
          ))}
        </Menu>
      </View>

      <FlatList
        data={teamReports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onView={() => handleViewReport(item)}
            showEmployee={true}
            theme={theme}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={teamReportsRefreshing}
            onRefresh={handleRefreshTeamReports}
          />
        }
        onEndReached={handleLoadMoreTeamReports}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !teamReportsLoading ? <EmptyState message="No team reports found" /> : null
        }
        ListFooterComponent={<FooterLoading loading={teamReportsLoading && teamReports.length > 0} />}
      />
    </View>
  );

  // Get tab buttons based on user role
  const getTabButtons = () => {
    const buttons = [
      { value: 'today', label: "Today's Report" },
      { value: 'my', label: 'My Reports' },
    ];
    if (isManager) {
      buttons.push({ value: 'team', label: 'Team Reports' });
    }
    return buttons;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
          Daily Reports
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'today' | 'my' | 'team')}
          buttons={getTabButtons()}
          style={styles.tabButtons}
        />
      </View>

      {/* Tab Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {activeTab === 'today' && renderTodayReport()}
        {activeTab === 'my' && renderMyReports()}
        {activeTab === 'team' && isManager && renderTeamReports()}
      </KeyboardAvoidingView>

      {/* View Report Modal */}
      <ViewReportModal
        visible={viewModalVisible}
        report={selectedReport}
        onDismiss={() => {
          setViewModalVisible(false);
          setSelectedReport(null);
        }}
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
  tabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabButtons: {
    marginBottom: 8,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 14,
    paddingVertical: 6,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  textArea: {
    minHeight: 120,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  statusBannerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statusBannerSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
  },
  submittedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  reportCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  reportCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  reportTimestamp: {
    fontSize: 12,
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 14,
    paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  viewModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '85%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewModalContent: {
    flexGrow: 1,
    flexShrink: 1,
  },
  viewModalScrollContent: {
    paddingBottom: 16,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 100,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
  },
  viewModalSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  viewModalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewModalDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  closeButton: {
    marginTop: 16,
  },
});
