// Payments screen placeholder
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentsScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>Payments</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.emptyContent}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Payments feature coming soon</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  content: { padding: 16 },
  emptyCard: { borderRadius: 12 },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
});
