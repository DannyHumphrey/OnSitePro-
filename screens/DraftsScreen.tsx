import { useAvailableForms } from "@/hooks/useAvailableForms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { Card, FAB, IconButton, Portal, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { spacing } from "@/constants/styles";
import { useFormCounts } from "@/context/FormCountsContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { RootStackParamList } from "@/navigation/types";
import { getAllDrafts, getDraftById } from "@/services/draftService";
import { createInstanceSmart } from "@/services/offlineHelpers/instanceSmart";
import { LocalInstanceMeta } from "@/services/offlineHelpers/types";
import { deleteLocalPhoto } from "@/services/photoService";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export default function DraftsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [drafts, setDrafts] = useState<LocalInstanceMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { setCounts } = useFormCounts();
  const [fabOpen, setFabOpen] = useState(false);
  const [screenFocused, setScreenFocused] = useState(false);
  const forms = useAvailableForms();
  const isOnline = useNetworkStatus();

  const loadDrafts = useCallback(async () => {
    const data = await getAllDrafts();
    setDrafts(data);
    setCounts((c) => ({ ...c, drafts: data.length }));
  }, [setCounts]);

  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [loadDrafts])
  );

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => {
        setScreenFocused(false);
      };
    }, [])
  );

  const handleResume = (draft: LocalInstanceMeta) => {
    navigation.navigate("FormInstance", { id: draft.id });
  };

  const collectImageUris = (obj: any): string[] => {
    if (!obj) return [];
    if (typeof obj === "string" && FileSystem.documentDirectory) {
      return obj.startsWith(FileSystem.documentDirectory) ? [obj] : [];
    }
    if (Array.isArray(obj)) {
      return obj.flatMap((i) => collectImageUris(i));
    }
    if (typeof obj === "object") {
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
      const indexRaw = await AsyncStorage.getItem("drafts:index");
      const index = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
      const newIndex = index.filter((d) => d !== id);
      await AsyncStorage.setItem("drafts:index", JSON.stringify(newIndex));
      await loadDrafts();
    } catch (err) {
      console.log("Error deleting draft:", err);
      Alert.alert("Error", "Failed to delete draft.");
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete Draft", "Are you sure you want to delete this draft?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(id) },
    ]);
  };

  const renderItem = ({ item }: { item: LocalInstanceMeta }) => (
    <Card style={styles.draftItem} onPress={() => handleResume(item)}>
      <Card.Title
        title={item.formType}
        right={() => (
          <View style={styles.editButtons}>
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
        <ThemedText style={styles.dateText}>
          Date Created: {new Date(item.createdAt).toLocaleDateString()}{" "}
          {new Date(item.createdAt).toLocaleTimeString()}
        </ThemedText>
      </Card.Content>
    </Card>
  );

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
      {screenFocused && (
        <Portal>
          <FAB.Group
            testID="fab-group-create"
            open={fabOpen}
            visible={screenFocused}
            icon={fabOpen ? "close" : "plus"}
            actions={forms.map((f) => ({
              icon: f.icon || "file-plus",
              label: f.label,
              onPress: async () => {
                setFabOpen(false);
                try {
                  const created = await createInstanceSmart(
                    f.formType,
                    f.version,
                    {},
                    isOnline
                  );
                  navigation.navigate("FormInstance", { id: created.id });
                } catch {
                  Alert.alert("Error", "Failed to create form instance");
                }
              },
              accessibilityLabel: `Add ${f.label}`,
              testID: `fab-action-${f.key}`,
              small: false,
            }))}
            onStateChange={({ open }) => setFabOpen(open)}
            onPress={() => {}}
            // Use container style, not fabStyle
            style={styles.fabGroup}
            backdropColor="transparent"
            accessibilityLabel="Create new item"
          />
        </Portal>
      )}
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
    position: "absolute",
    bottom: 40,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  listContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  draftItem: {
    marginBottom: spacing.sm,
  },
  draftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  dateText: {
    marginBottom: 8,
  },
  fabGroup: {
    position: "absolute",
    right: 16,
    bottom: 40,
    zIndex: 1000, // helps on iOS + Android
    elevation: 10, // Android stacking
  },
});
