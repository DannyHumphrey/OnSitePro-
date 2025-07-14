import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StatusBadge } from '@/components/StatusBadge';
import type { FormSchema } from '@/components/formRenderer/fields/types';
import { useFormCounts } from '@/context/FormCountsContext';

export type SentForm = {
  id: string;
  name: string;
  formType: string;
  schema: FormSchema;
  data: Record<string, any>;
  updatedAt: string;
  isSynced?: boolean;
  syncedAt?: string;
};

export default function SentScreen() {
  const navigation = useNavigation();
  const [forms, setForms] = useState<SentForm[]>([]);
  const { setCounts } = useFormCounts();

  const loadSentForms = useCallback(async () => {
    try {
      const indexRaw = await AsyncStorage.getItem('sent:index');
      const ids = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
      const result: SentForm[] = [];
      for (const id of ids) {
        const item = await AsyncStorage.getItem(`sent:${id}`);
        if (item) {
          result.push(JSON.parse(item) as SentForm);
        }
      }
      setForms(result);
      setCounts((c) => ({ ...c, sent: result.length }));
    } catch (err) {
      console.log('Error loading sent forms:', err);
    }
  }, [setCounts]);

  useFocusEffect(
    useCallback(() => {
      loadSentForms();
    }, [loadSentForms])
  );

  const handlePress = (form: SentForm) => {
    navigation.navigate('DraftsTab', {
      screen: 'FormScreen',
      params: {
        schema: form.schema,
        formType: form.formType,
        formName: form.name,
        data: form.data,
        readOnly: true,
      },
    });
  };

  const renderItem = ({ item }: { item: SentForm }) => (
    <TouchableOpacity style={styles.item} onPress={() => handlePress(item)}>
      <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
      <ThemedText>{item.formType}</ThemedText>
      <ThemedText style={styles.dateText}>
        Submitted {new Date(item.updatedAt).toLocaleDateString()}
      </ThemedText>
      {item.syncedAt && (
        <ThemedText style={styles.dateText}>
          Last synced at {new Date(item.syncedAt).toLocaleDateString()}
        </ThemedText>
      )}
      <StatusBadge
        label={item.isSynced ? 'Synced' : 'Submitted'}
        icon={item.isSynced ? '✅' : '🟢'}
        color={item.isSynced ? '#5cb85c' : '#0a7ea4'}
      />
    </TouchableOpacity>
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
            <ThemedText>No sent forms.</ThemedText>
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
});
