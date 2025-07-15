import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { Card, FAB, IconButton, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { spacing } from '@/constants/styles';
import { useFormCounts } from '@/context/FormCountsContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DraftsStackParamList } from '@/navigation/types';
import {
  getAllDrafts,
  getDraftById,
  type DraftForm,
} from '@/services/draftService';
import { deleteLocalPhoto } from '@/services/photoService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function DraftsScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<DraftsStackParamList>
  >();
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = useTheme();
  const [drafts, setDrafts] = useState<DraftForm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [filterBy, setFilterBy] = useState('All');
  const { setCounts } = useFormCounts();

  const loadDrafts = useCallback(async () => {
    const data = await getAllDrafts();
    setDrafts(data);
    setCounts((c) => ({ ...c, drafts: data.length }));
  }, [setCounts]);

  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [loadDrafts]),
  );

  const handleResume = (draft: DraftForm) => {
    navigation.navigate('FormScreen', {
      schema: draft.schema,
      formType: draft.formType,
      formName: draft.name,
      data: draft.data,
      draftId: draft.id,
    });
  };

  const collectImageUris = (obj: any): string[] => {
    if (!obj) return [];
    if (typeof obj === 'string') {
      return obj.startsWith(FileSystem.documentDirectory) ? [obj] : [];
    }
    if (Array.isArray(obj)) {
      return obj.flatMap((i) => collectImageUris(i));
    }
    if (typeof obj === 'object') {
      return Object.values(obj).flatMap((v) => collectImageUris(v));
    }
    return [];
  };

  const handleDelete = async (id: string) => {
    try {
      const draft = await getDraftById(id);
      if (draft) {
        const uris = collectImageUris(draft.data);
        await Promise.all(uris.map((u) => deleteLocalPhoto(u)));
      }

      await AsyncStorage.removeItem(`drafts:${id}`);
      await AsyncStorage.removeItem(`draft:${id}`);
      const indexRaw = await AsyncStorage.getItem('drafts:index');
      const index = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
      const newIndex = index.filter((d) => d !== id);
      await AsyncStorage.setItem('drafts:index', JSON.stringify(newIndex));
      await loadDrafts();
    } catch (err) {
      console.log('Error deleting draft:', err);
      Alert.alert('Error', 'Failed to delete draft.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(id) },
    ]);
  };

  const filteredDrafts = drafts.filter((d) => {
    const q = searchQuery.toLowerCase();
    const address =
      typeof d.data?.address === 'string'
        ? d.data.address.toLowerCase()
        : '';
    const matchesQuery =
      d.name.toLowerCase().includes(q) ||
      d.formType.toLowerCase().includes(q) ||
      address.includes(q);
    const matchesFilter = filterBy === 'All' || d.formType === filterBy;
    return matchesQuery && matchesFilter;
  });

  const sortedDrafts = [...filteredDrafts].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.createdAt.localeCompare(b.createdAt);
      case 'az':
        return a.name.localeCompare(b.name);
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });

  const renderItem = ({ item }: { item: DraftForm }) => (
    <Card style={styles.draftItem} onPress={() => handleResume(item)}>
      <Card.Title
        title={item.name}
        right={() => (
          <View style={styles.editButtons}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleResume(item)}
              accessibilityLabel="Edit"
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => confirmDelete(item.id)}
              accessibilityLabel="Delete Draft"
            />
          </View>
        )}
      />
      <Card.Content>
        <ThemedText>Form Type: {item.formType}</ThemedText>
        <ThemedText style={styles.dateText}>
          Date Created: {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
        </ThemedText>
      </Card.Content>
    </Card>
  );

  const formTypes = Array.from(new Set(drafts.map((d) => d.formType)));

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.controls}>
        <TextInput
          mode="outlined"
          style={styles.searchInput}
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={sortedDrafts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          sortedDrafts.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText>No drafts found.</ThemedText>
          </ThemedView>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateFormScreen')}
        accessibilityLabel="Create New Form"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  controls: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    marginBottom: spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  listContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftItem: {
    marginBottom: spacing.sm,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  dateText: {
    marginBottom: 8,
  },
});
