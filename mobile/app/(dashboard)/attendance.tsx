// Attendance screen - Check in/out and history

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

export default function AttendanceScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = async () => {
    setLoading(true);
    // TODO: Implement actual check-in API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCheckedIn(true);
    setLoading(false);
    Toast.show({
      type: 'success',
      text1: 'Checked In',
      text2: `Check-in time: ${format(new Date(), 'hh:mm a')}`,
    });
  };

  const handleCheckOut = async () => {
    setLoading(true);
    // TODO: Implement actual check-out API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCheckedIn(false);
    setLoading(false);
    Toast.show({
      type: 'success',
      text1: 'Checked Out',
      text2: `Check-out time: ${format(new Date(), 'hh:mm a')}`,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
          Attendance
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Today's Status Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              Today's Status
            </Text>

            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <MaterialCommunityIcons
                  name="login"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Check In
                </Text>
                <Text variant="titleMedium">
                  {checkedIn ? format(new Date(), 'hh:mm a') : '--:--'}
                </Text>
              </View>

              <View style={styles.statusItem}>
                <MaterialCommunityIcons
                  name="logout"
                  size={24}
                  color={theme.colors.secondary}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Check Out
                </Text>
                <Text variant="titleMedium">--:--</Text>
              </View>

              <View style={styles.statusItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color={theme.colors.tertiary}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Hours
                </Text>
                <Text variant="titleMedium">0.0 hrs</Text>
              </View>
            </View>

            <View style={styles.statusChip}>
              <Chip
                icon={checkedIn ? 'check-circle' : 'clock-outline'}
                mode="flat"
                style={{
                  backgroundColor: checkedIn
                    ? theme.colors.secondaryContainer
                    : theme.colors.surfaceVariant,
                }}
              >
                {checkedIn ? 'Checked In' : 'Not Checked In'}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleCheckIn}
            loading={loading && !checkedIn}
            disabled={loading || checkedIn}
            icon="login"
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.buttonContent}
          >
            Check In
          </Button>

          <Button
            mode="contained"
            onPress={handleCheckOut}
            loading={loading && checkedIn}
            disabled={loading || !checkedIn}
            icon="logout"
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            contentStyle={styles.buttonContent}
          >
            Check Out
          </Button>
        </View>

        {/* Monthly Summary */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              This Month
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  --
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Present
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
                  --
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Absent
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.tertiary, fontWeight: 'bold' }}>
                  --%
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Attendance
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusChip: {
    alignItems: 'center',
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
});
