import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { FormSchema } from '@/components/formRenderer/fields/types';
import { StatusBadge } from '@/components/StatusBadge';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { spacing } from '@/constants/styles';
import { useFormCounts } from '@/context/FormCountsContext';
import { DraftsStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  const navigation = useNavigation<
      NativeStackNavigationProp<DraftsStackParamList>
    >();
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
    navigation.navigate('FormScreen', {
      schema: form.schema,
      formType: form.formType,
      formName: form.name,
      data: form.data,
      draftId: form.id,
      readOnly: true,
    });
  };

  const renderItem = ({ item }: { item: SentForm }) => (
    <Card style={styles.item} onPress={() => handlePress(item)}>
      <Card.Title
        title={item.name}
        right={() => (
          <StatusBadge
            label={item.isSynced ? 'Synced' : 'Submitted'}
            color={item.isSynced ? '#5cb85c' : '#0a7ea4'}
          />
        )}
      />
      <Card.Content>
        <ThemedText>Form Type: {item.formType}</ThemedText>
        <ThemedText style={styles.dateText}>
          Submitted On: {new Date(item.updatedAt).toLocaleDateString()} {new Date(item.updatedAt).toLocaleTimeString()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  dateText: {
    marginBottom: spacing.sm,
  },
});
