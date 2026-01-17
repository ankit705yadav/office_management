// Entry point - Redirects based on authentication status

import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]}>
        <ActivityIndicator size="large" color="#3d9be9" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(dashboard)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
