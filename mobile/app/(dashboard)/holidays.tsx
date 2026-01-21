// Holidays screen - Holiday Calendar

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal as RNModal,
  Switch,
  Text as RNText,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  Chip,
  TextInput,
  ActivityIndicator,
  IconButton,
  Divider,
  FAB,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { holidayService, CreateHolidayRequest, HolidayStats } from '../../services/holiday.service';
import { Holiday } from '../../types';

// Colors
const COLORS = {
  mandatory: '#10B981',
  optional: '#3B82F6',
  today: '#8B5CF6', // Purple to distinguish from optional (blue)
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  color,
  theme,
}: {
  title: string;
  value: number;
  color: string;
  theme: any;
}) => (
  <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: theme.colors.onSurfaceVariant }]}>{title}</Text>
  </View>
);

// Calendar Day Component
const CalendarDay = ({
  date,
  holiday,
  isCurrentMonth,
  isToday,
  theme,
  onPress,
}: {
  date: Date;
  holiday?: Holiday;
  isCurrentMonth: boolean;
  isToday: boolean;
  theme: any;
  onPress?: () => void;
}) => {
  const hasHoliday = !!holiday;
  const bgColor = hasHoliday
    ? holiday.isOptional
      ? COLORS.optional
      : COLORS.mandatory
    : isToday
    ? COLORS.today
    : theme.colors.surfaceVariant;
  const textColor = hasHoliday || isToday ? '#fff' : theme.colors.onSurface;

  return (
    <TouchableOpacity
      style={[
        styles.calendarDay,
        {
          backgroundColor: bgColor,
          opacity: isCurrentMonth ? 1 : 0.3,
          borderWidth: isToday && !hasHoliday ? 2 : 1,
          borderColor: isToday ? COLORS.today : theme.colors.outline + '20',
        },
      ]}
      onPress={hasHoliday ? onPress : undefined}
      activeOpacity={hasHoliday ? 0.7 : 1}
      disabled={!hasHoliday}
    >
      <Text style={[styles.dayNumber, { color: textColor, fontWeight: isToday ? 'bold' : 'normal' }]}>
        {format(date, 'd')}
      </Text>
      {hasHoliday && (
        <Text style={styles.holidayName} numberOfLines={2}>
          {holiday.name}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Holiday List Item Component
const HolidayListItem = ({
  holiday,
  onDelete,
  canDelete,
  theme,
}: {
  holiday: Holiday;
  onDelete: () => void;
  canDelete: boolean;
  theme: any;
}) => {
  const iconColor = holiday.isOptional ? COLORS.optional : COLORS.mandatory;

  return (
    <View style={[styles.holidayItem, { borderBottomColor: theme.colors.outline + '30' }]}>
      <View style={styles.holidayItemLeft}>
        <IconButton
          icon="calendar"
          size={24}
          iconColor={iconColor}
          style={{ margin: 0 }}
        />
        <View style={styles.holidayItemContent}>
          <View style={styles.holidayItemHeader}>
            <Text style={[styles.holidayItemName, { color: theme.colors.onSurface }]}>
              {holiday.name}
            </Text>
            {holiday.isOptional && (
              <View style={[styles.optionalBadge, { backgroundColor: COLORS.optional }]}>
                <RNText style={styles.optionalBadgeText}>Optional</RNText>
              </View>
            )}
          </View>
          <Text style={[styles.holidayItemDate, { color: COLORS.optional }]}>
            {format(parseISO(holiday.date), 'EEEE, MMMM dd')}
          </Text>
          {holiday.description && (
            <Text style={[styles.holidayItemDesc, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              {holiday.description}
            </Text>
          )}
        </View>
      </View>
      {canDelete && (
        <IconButton
          icon="delete-outline"
          size={20}
          iconColor="#EF4444"
          onPress={onDelete}
        />
      )}
    </View>
  );
};

// Add Holiday Modal
const AddHolidayModal = ({
  visible,
  onDismiss,
  onSubmit,
  submitting,
  theme,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: CreateHolidayRequest) => void;
  submitting: boolean;
  theme: any;
}) => {
  const [formData, setFormData] = useState<CreateHolidayRequest>({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    isOptional: false,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setFormData({
        name: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        isOptional: false,
      });
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Holiday name is required');
      return;
    }
    if (!formData.date) {
      Alert.alert('Error', 'Date is required');
      return;
    }
    onSubmit(formData);
  };

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
                  Add New Holiday
                </Text>
                <IconButton icon="close" onPress={onDismiss} disabled={submitting} />
              </View>

              <Divider style={{ marginBottom: 16 }} />

              <TextInput
                mode="outlined"
                label="Holiday Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                disabled={submitting}
                placeholder="e.g., Independence Day"
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Date * (YYYY-MM-DD)"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                disabled={submitting}
                placeholder="2026-01-26"
                style={styles.formInput}
                right={<TextInput.Icon icon="calendar" />}
              />

              <TextInput
                mode="outlined"
                label="Description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                disabled={submitting}
                placeholder="Brief description (optional)"
                style={styles.formInput}
              />

              <View style={styles.switchRow}>
                <Text style={{ color: theme.colors.onSurface }}>Optional Holiday</Text>
                <Switch
                  value={formData.isOptional}
                  onValueChange={(value) => setFormData({ ...formData, isOptional: value })}
                  disabled={submitting}
                  trackColor={{ false: theme.colors.surfaceVariant, true: COLORS.optional + '80' }}
                  thumbColor={formData.isOptional ? COLORS.optional : '#f4f3f4'}
                />
              </View>

              <View style={styles.formActions}>
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
                  Create
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

// Main Holidays Screen
export default function HolidaysScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  // State
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [stats, setStats] = useState<HolidayStats>({ total: 0, mandatory: 0, optional: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Year and month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Permissions
  const isAdmin = user?.role === 'admin';

  // Year options
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);

  // Load holidays
  const loadHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const response = await holidayService.getHolidays({ year: selectedYear });
      setHolidays(response.holidays);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load holidays:', error);
      Alert.alert('Error', 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  // Initial load and reload when year changes
  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHolidays();
    setRefreshing(false);
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Get holiday for a specific date
  const getHolidayForDate = useCallback(
    (date: Date): Holiday | undefined => {
      return holidays.find((h) => isSameDay(parseISO(h.date), date));
    },
    [holidays]
  );

  // Holidays in current month
  const currentMonthHolidays = useMemo(() => {
    return holidays
      .filter((h) => isSameMonth(parseISO(h.date), currentMonth))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidays, currentMonth]);

  // Handle add holiday
  const handleAddHoliday = async (data: CreateHolidayRequest) => {
    try {
      setSubmitting(true);
      await holidayService.createHoliday(data);
      Alert.alert('Success', 'Holiday created successfully');
      setShowAddModal(false);
      loadHolidays();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create holiday';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete holiday
  const handleDeleteHoliday = (holiday: Holiday) => {
    Alert.alert(
      'Delete Holiday',
      `Are you sure you want to delete "${holiday.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await holidayService.deleteHoliday(holiday.id);
              Alert.alert('Success', 'Holiday deleted successfully');
              loadHolidays();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete holiday');
            }
          },
        },
      ]
    );
  };

  // Show holiday details
  const handleShowHoliday = (holiday: Holiday) => {
    Alert.alert(
      holiday.name,
      `${format(parseISO(holiday.date), 'EEEE, MMMM dd, yyyy')}\n${holiday.isOptional ? '(Optional Holiday)' : '(Mandatory Holiday)'}\n\n${holiday.description || 'No description'}`
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
          Holiday Calendar
        </Text>
        <Menu
          visible={showYearPicker}
          onDismiss={() => setShowYearPicker(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowYearPicker(true)}
              icon="calendar"
              compact
            >
              {selectedYear}
            </Button>
          }
        >
          {years.map((year) => (
            <Menu.Item
              key={year}
              onPress={() => {
                setSelectedYear(year);
                setShowYearPicker(false);
              }}
              title={year.toString()}
              leadingIcon={year === selectedYear ? 'check' : undefined}
            />
          ))}
        </Menu>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <StatCard title="Total" value={stats.total} color={theme.colors.primary} theme={theme} />
            <StatCard title="Mandatory" value={stats.mandatory} color={COLORS.mandatory} theme={theme} />
            <StatCard title="Optional" value={stats.optional} color={COLORS.optional} theme={theme} />
          </View>

          {/* Calendar */}
          <Card style={[styles.calendarCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              {/* Month Navigation */}
              <View style={styles.monthNav}>
                <IconButton
                  icon="chevron-left"
                  size={24}
                  onPress={handlePrevMonth}
                />
                <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.primary }}>
                  {format(currentMonth, 'MMMM yyyy')}
                </Text>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  onPress={handleNextMonth}
                />
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS.mandatory }]} />
                  <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>Mandatory</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS.optional }]} />
                  <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>Optional</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS.today, borderWidth: 2, borderColor: COLORS.today }]} />
                  <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>Today</Text>
                </View>
              </View>

              {/* Weekday Headers */}
              <View style={styles.weekDaysRow}>
                {weekDays.map((day) => (
                  <Text key={day} style={[styles.weekDayText, { color: theme.colors.onSurfaceVariant }]}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((date, index) => (
                  <CalendarDay
                    key={index}
                    date={date}
                    holiday={getHolidayForDate(date)}
                    isCurrentMonth={isSameMonth(date, currentMonth)}
                    isToday={isSameDay(date, new Date())}
                    theme={theme}
                    onPress={() => {
                      const holiday = getHolidayForDate(date);
                      if (holiday) handleShowHoliday(holiday);
                    }}
                  />
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Current Month Holidays */}
          <Card style={[styles.listCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.primary, marginBottom: 12 }}>
                Holidays in {format(currentMonth, 'MMMM yyyy')}
              </Text>

              {currentMonthHolidays.length === 0 ? (
                <View style={styles.emptyList}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    No holidays in this month
                  </Text>
                </View>
              ) : (
                currentMonthHolidays.map((holiday) => (
                  <HolidayListItem
                    key={holiday.id}
                    holiday={holiday}
                    onDelete={() => handleDeleteHoliday(holiday)}
                    canDelete={isAdmin}
                    theme={theme}
                  />
                ))
              )}
            </Card.Content>
          </Card>

          {/* Complete Holiday List */}
          <Card style={[styles.listCard, { backgroundColor: theme.colors.surface, marginBottom: 80 }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.primary, marginBottom: 12 }}>
                Complete Holiday List {selectedYear}
              </Text>

              {holidays.length === 0 ? (
                <View style={styles.emptyList}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    No holidays found for {selectedYear}
                  </Text>
                </View>
              ) : (
                holidays.map((holiday) => (
                  <HolidayListItem
                    key={holiday.id}
                    holiday={holiday}
                    onDelete={() => handleDeleteHoliday(holiday)}
                    canDelete={isAdmin}
                    theme={theme}
                  />
                ))
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      )}

      {/* FAB for Add Holiday (Admin only) */}
      {isAdmin && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowAddModal(true)}
          color="#fff"
        />
      )}

      {/* Add Holiday Modal */}
      <AddHolidayModal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        onSubmit={handleAddHoliday}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 11,
    marginTop: 4,
  },
  // Calendar Card
  calendarCard: {
    borderRadius: 12,
    marginBottom: 12,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
    borderRadius: 4,
    marginBottom: 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 12,
  },
  holidayName: {
    fontSize: 7,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 9,
  },
  // List Card
  listCard: {
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyList: {
    padding: 24,
    alignItems: 'center',
  },
  holidayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  holidayItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  holidayItemContent: {
    flex: 1,
    marginLeft: 4,
  },
  holidayItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  holidayItemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  optionalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  holidayItemDate: {
    fontSize: 13,
    marginTop: 2,
  },
  holidayItemDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    maxHeight: '90%',
  },
  formModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formInput: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
  },
});
