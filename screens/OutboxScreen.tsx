import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { spacing } from '@/constants/styles';
import { StatusBadge } from '@/components/StatusBadge';
import {
  getAllOutbox,
  syncOutbox,
  type OutboxForm,
} from '@/services/outboxService';
import { useFormCounts } from '@/context/FormCountsContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function OutboxScreen() {
  const [forms, setForms] = useState<OutboxForm[]>([]);
  const { setCounts } = useFormCounts();
  const isOnline = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);

  const loadOutbox = useCallback(async () => {
    const data = await getAllOutbox();
    setForms(data);
    setCounts((c) => ({ ...c, outbox: data.length }));
  }, [setCounts]);

  const handleSync = async () => {
    await syncOutbox();
    await loadOutbox();
  };

  useEffect(() => {
    if (isOnline && wasOffline) {
      syncOutbox().then(loadOutbox);
    }
    setWasOffline(!isOnline);
  }, [isOnline]);

  useFocusEffect(
    useCallback(() => {
      loadOutbox();
    }, [loadOutbox]),
  );

  const renderItem = ({ item }: { item: OutboxForm }) => (
    <Card style={styles.item}>
      <Card.Title title={item.name} />
      <Card.Content>
        <ThemedText style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>
        {item.syncedAt && (
          <ThemedText style={styles.dateText}>
            Last synced at {new Date(item.syncedAt).toLocaleDateString()}
          </ThemedText>
        )}
        <StatusBadge
          label={item.syncError ? 'Failed' : 'Pending'}
          icon={item.syncError ? '❌' : '🔄'}
          color={item.syncError ? '#d9534f' : '#f0ad4e'}
        />
        <Button mode="contained" onPress={handleSync} style={styles.button}>
          Sync Now
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {!isOnline && (
        <ThemedText style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>
          You are offline.
        </ThemedText>
      )}
      <FlatList
        data={forms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          forms.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText>No forms in outbox.</ThemedText>
          </ThemedView>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
  dateText: {
    marginBottom: spacing.sm,
  },
});
