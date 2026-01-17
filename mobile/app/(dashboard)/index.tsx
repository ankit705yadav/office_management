// Dashboard home screen

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Avatar,
  IconButton,
  Divider,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';

export default function DashboardScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh dashboard data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

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

        {/* Stats Cards */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Overview
        </Text>
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                --
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Leave Balance
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="headlineMedium" style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>
                --
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Pending Tasks
              </Text>
            </Card.Content>
          </Card>
        </View>

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
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <>
              <Divider />
              <MenuItem
                icon="account-group"
                title="Clients"
                onPress={() => router.push('/(dashboard)/clients')}
                theme={theme}
              />
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Divider />
              <MenuItem
                icon="account-multiple"
                title="Employees"
                onPress={() => router.push('/(dashboard)/employees')}
                theme={theme}
              />
            </>
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
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
});
