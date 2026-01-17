// Daily Reports screen placeholder
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DailyReportsScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>Daily Reports</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.emptyContent}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Daily reports coming soon</Text>
          </Card.Content>
        </Card>
      </ScrollView>
      <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  content: { padding: 16 },
  emptyCard: { borderRadius: 12 },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
