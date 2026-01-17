// Profile screen

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, Button, List, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
          Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={80}
              label={getInitials(user?.firstName, user?.lastName)}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <Text variant="headlineSmall" style={{ marginTop: 12, fontWeight: '600' }}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {user?.email}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                {user?.role?.toUpperCase()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <List.Item
            title="Email"
            description={user?.email}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <Divider />
          <List.Item
            title="Phone"
            description={user?.phone || 'Not set'}
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          <Divider />
          <List.Item
            title="Date of Joining"
            description={user?.dateOfJoining ? format(new Date(user.dateOfJoining), 'MMM dd, yyyy') : 'N/A'}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
          <Divider />
          <List.Item
            title="Department"
            description={user?.department?.name || 'Not assigned'}
            left={(props) => <List.Icon {...props} icon="office-building" />}
          />
        </Card>

        {/* Actions */}
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <List.Item
            title="Change Password"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to change password
            }}
          />
        </Card>

        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          style={styles.logoutButton}
          textColor={theme.colors.error}
        >
          Logout
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  content: { padding: 16 },
  profileCard: { borderRadius: 12, marginBottom: 16 },
  profileContent: { alignItems: 'center', paddingVertical: 24 },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  infoCard: { borderRadius: 12, marginBottom: 16 },
  logoutButton: { marginTop: 8, borderColor: 'transparent' },
});
