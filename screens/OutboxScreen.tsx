import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
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
    <View style={styles.item}>
      <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
      <ThemedText style={styles.dateText}>
        {new Date(item.createdAt).toLocaleDateString()}
      </ThemedText>
      <ThemedText style={styles.status}>Ready to sync</ThemedText>
      <Button title="Sync Now" onPress={handleSync} />
    </View>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    gap: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  dateText: {
    marginBottom: 8,
  },
  status: {
    marginBottom: 8,
  },
});
