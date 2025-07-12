import { useCallback, useState } from 'react';
import { StyleSheet, Pressable, FlatList, Button, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllDrafts, type DraftForm } from '@/services/draftService';

export default function DraftsScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList>
  >();
  const colorScheme = useColorScheme() ?? 'light';
  const [drafts, setDrafts] = useState<DraftForm[]>([]);

  const loadDrafts = useCallback(async () => {
    const data = await getAllDrafts();
    setDrafts(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [loadDrafts]),
  );

  const handleResume = (draft: DraftForm) => {
    navigation.navigate('Form', {
      schema: draft.schema,
      formType: draft.formType,
      formName: draft.name,
      data: draft.data,
      draftId: draft.id,
    });
  };

  const renderItem = ({ item }: { item: DraftForm }) => (
    <View style={styles.draftItem}>
      <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
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
        onPress={() => navigation.navigate('CreateForm')}
        accessibilityLabel="Create New Form">
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
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
  dateText: {
    marginBottom: 8,
  },
});
