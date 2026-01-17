// Leaves screen placeholder

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LeavesScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
          Leave Management
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Leave Balance */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Leave Balance
        </Text>
        <View style={styles.balanceRow}>
          <Card style={[styles.balanceCard, { backgroundColor: theme.colors.primaryContainer }]}>
            <Card.Content style={styles.balanceContent}>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>--</Text>
              <Text variant="bodySmall">Sick</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.balanceCard, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Card.Content style={styles.balanceContent}>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>--</Text>
              <Text variant="bodySmall">Casual</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.balanceCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <Card.Content style={styles.balanceContent}>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>--</Text>
              <Text variant="bodySmall">Earned</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Leave Requests */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          My Requests
        </Text>
        <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.emptyContent}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No leave requests yet
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          // TODO: Open apply leave form
        }}
      />
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
  sectionTitle: { marginBottom: 12, fontWeight: '600' },
  balanceRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  balanceCard: { flex: 1, borderRadius: 12 },
  balanceContent: { alignItems: 'center', paddingVertical: 12 },
  emptyCard: { borderRadius: 12 },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
