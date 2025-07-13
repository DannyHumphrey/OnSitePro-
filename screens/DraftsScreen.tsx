import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DraftsStackParamList } from '@/navigation/types';
import {
  getAllDrafts,
  getDraftById,
  type DraftForm,
} from '@/services/draftService';
import { deleteLocalPhoto } from '@/services/photoService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFormCounts } from '@/context/FormCountsContext';

export default function DraftsScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<DraftsStackParamList>
  >();
  const colorScheme = useColorScheme() ?? 'light';
  const [drafts, setDrafts] = useState<DraftForm[]>([]);
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

  const renderItem = ({ item }: { item: DraftForm }) => (
    <View style={styles.draftItem}>
      <View style={styles.draftHeader}>
        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
        <Pressable
          onPress={() => confirmDelete(item.id)}
          accessibilityLabel="Delete Draft"
          style={styles.deleteButton}>
          <MaterialIcons
            name="delete"
            size={20}
            color={Colors[colorScheme].tint}
          />
        </Pressable>
      </View>
      <ThemedText style={styles.dateText}>
        {new Date(item.createdAt).toLocaleDateString()}
      </ThemedText>
      <Button title="Resume" onPress={() => handleResume(item)} />
    </View>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={drafts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          drafts.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText>No drafts found.</ThemedText>
          </ThemedView>
        }
      />
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: Colors[colorScheme].tint,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => navigation.navigate('CreateFormScreen')}
        accessibilityLabel="Create New Form">
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftItem: {
    gap: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 4,
  },
  dateText: {
    marginBottom: 8,
  },
});
