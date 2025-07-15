import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/StatusBadge';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { spacing } from '@/constants/styles';
import { useFormCounts } from '@/context/FormCountsContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  getAllOutbox,
  syncOutbox,
  type OutboxForm,
} from '@/services/outboxService';

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
      <Card.Title title={item.name} 
      right={() => (
          <View style={styles.editButtons}>
            <StatusBadge
              label={item.syncError ? 'Failed' : 'Pending'}
              color={item.syncError ? '#d9534f' : '#f0ad4e'}
            />
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleSync()}
              accessibilityLabel="Edit"
            />
          </View>
        )}/>
      <Card.Content>
        <ThemedText style={styles.dateText}>
          Date Created: {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>
        {item.syncedAt && (
          <ThemedText style={styles.dateText}>
            Last synced at {new Date(item.syncedAt).toLocaleDateString()}
          </ThemedText>
        )}
        
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
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
});
