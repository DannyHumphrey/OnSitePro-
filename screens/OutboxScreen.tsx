import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import {
  getAllOutbox,
  syncOutbox,
  type OutboxForm,
} from '@/services/outboxService';

export default function OutboxScreen() {
  const [forms, setForms] = useState<OutboxForm[]>([]);

  const loadOutbox = useCallback(async () => {
    const data = await getAllOutbox();
    setForms(data);
  }, []);

  const handleSync = async () => {
    await syncOutbox();
    await loadOutbox();
  };

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
