import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import FormRenderer, { type FormRendererRef } from '@/components/FormRenderer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { DraftsStackParamList } from '@/navigation/types';
import {
  getDraftById,
  saveDraft,
  type DraftForm,
} from '@/services/draftService';
import React from 'react';

type OutboxForm = Omit<DraftForm, 'status'> & { status: 'complete' };

type Props = NativeStackScreenProps<DraftsStackParamList, 'FormScreen'>;

export default function FormScreen({ route, navigation }: Props) {
  const {
    schema,
    formName,
    formType = 'demo',
    draftId,
    data,
    readOnly = false,
  } = route.params;
  const formRef = useRef<FormRendererRef>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const isOnline = useNetworkStatus();
  const [existingDraft, setExistingDraft] = useState<DraftForm | null>(null);
  const [initialData, setInitialData] = useState<Record<string, any> | undefined>(data);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTab, setMenuTab] = useState<'sections' | 'media'>('sections');

  useEffect(() => {
    if (draftId) {
      getDraftById(draftId).then((draft) => {
        if (draft) {
          setExistingDraft(draft);
          setInitialData(draft.data);
        }
      });
    }
  }, [draftId]);

  const handleSaveDraft = async () => {
    const data = formRef.current?.getFormData() ?? {};
    const timestamp = new Date().toISOString();
    let draft: DraftForm;
    if (existingDraft) {
      draft = {
        ...existingDraft,
        data,
        updatedAt: timestamp,
      };
    } else {
      draft = {
        id: uuidv4(),
        name: formName ?? 'Untitled Form',
        formType,
        schema,
        data,
        status: 'draft',
        isSynced: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }
    await saveDraft(draft);
    setExistingDraft(draft);
  };

  const handleSubmitForm = async () => {
    try {
      const validation = formRef.current?.validateForm();
      if (validation && !validation.isValid) {
        Alert.alert('Validation Error', 'Please fill all required fields.');
        return;
      }
      const formData = formRef.current?.getFormData() ?? {};
      const timestamp = new Date().toISOString();
      let draft: OutboxForm | null = null;
      const currentDraftId = draftId ?? existingDraft?.id;
      let id = currentDraftId;

      if (currentDraftId) {
        try {
          const loaded = await getDraftById(currentDraftId);
          if (loaded) {
            draft = { ...loaded, status: 'complete' } as OutboxForm;
          }
        } catch (err) {
          console.log('Error loading draft:', err);
        }
      }

      if (!draft) {
        id = uuidv4();
        draft = {
          id,
          name: formName ?? 'Untitled Form',
          formType,
          schema,
          data: formData,
          status: 'complete',
          isSynced: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      } else {
        draft = {
          ...draft,
          data: formData,
          status: 'complete',
          updatedAt: timestamp,
        };
      }

      if (!id) {
        id = draft.id;
      }

      // Save to outbox
      await AsyncStorage.setItem(`outbox:${id}`, JSON.stringify(draft));

      // update outbox index
      try {
        const outboxRaw = await AsyncStorage.getItem('outbox:index');
        const outbox = outboxRaw ? (JSON.parse(outboxRaw) as string[]) : [];
        if (!outbox.includes(id)) {
          outbox.push(id);
          await AsyncStorage.setItem('outbox:index', JSON.stringify(outbox));
        }
      } catch (err) {
        console.log('Error updating outbox index:', err);
      }

      if (currentDraftId) {
        // remove draft storage and index
        try {
          await AsyncStorage.removeItem(`draft:${currentDraftId}`);
          const indexRaw = await AsyncStorage.getItem('drafts:index');
          const index = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
          const newIndex = index.filter((d) => d !== currentDraftId);
          await AsyncStorage.setItem('drafts:index', JSON.stringify(newIndex));
        } catch (err) {
          console.log('Error removing draft from storage:', err);
        }
      }

      console.log('Form moved to outbox:', id);
      navigation.popToTop();
    } catch (err) {
      console.log('Error submitting form:', err);
      Alert.alert('Error', 'Failed to submit form.');
    }
  };

  const sectionEntries = schema.flatMap((section) => {
    if (section.repeatable) {
      const dataArr = formRef.current?.getFormData()[section.key] as any[] | undefined;
      const length = dataArr ? dataArr.length : 0;
      return Array.from({ length }).map((_, idx) => ({
        key: `${section.key}.${idx}`,
        label: `${section.label} ${idx + 1}`,
      }));
    }
    return [{ key: section.key, label: section.label }];
  });

  const sectionErrors = formRef.current?.getSectionErrorMap() ?? {};
  const photos = formRef.current?.getPhotoFields() ?? [];

  const handleSectionPress = (key: string) => {
    setMenuVisible(false);
    formRef.current?.openSection(key);
  };

  const handleMediaPress = (key: string) => {
    setMenuVisible(false);
    formRef.current?.scrollToField(key);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        {formName && (
          <View style={styles.header}>
            <ThemedText type="title" style={{ flex: 1 }}>
              {formName}
            </ThemedText>
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <IconSymbol
                name="line.3.horizontal"
                size={24}
                color={Colors[colorScheme].text}
              />
            </TouchableOpacity>
          </View>
        )}

        {!isOnline && (
          <ThemedText style={styles.offlineText}>
            You are offline. Submissions are disabled.
          </ThemedText>
        )}
        <FormRenderer ref={formRef} schema={schema} initialData={initialData} readOnly={readOnly}/>
        <Modal
          transparent
          animationType="slide"
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.drawer, { backgroundColor: Colors[colorScheme].background }]}>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tabButton, menuTab === 'sections' && styles.activeTab]}
                  onPress={() => setMenuTab('sections')}>
                  <ThemedText>Sections</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, menuTab === 'media' && styles.activeTab]}
                  onPress={() => setMenuTab('media')}>
                  <ThemedText>Media</ThemedText>
                </TouchableOpacity>
              </View>
              {menuTab === 'sections' ? (
                <ScrollView>
                  {sectionEntries.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.menuItem}
                      onPress={() => handleSectionPress(item.key)}>
                      <ThemedText>{item.label}</ThemedText>
                      {sectionErrors[item.key] && (
                        <IconSymbol
                          name="exclamationmark.circle.fill"
                          size={16}
                          color="red"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <ScrollView contentContainerStyle={styles.mediaList}>
                  {photos.map((p) => (
                    <TouchableOpacity key={p.key} onPress={() => handleMediaPress(p.key)}>
                      <Image source={{ uri: p.uri }} style={styles.mediaThumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Button
              title="Back"
              onPress={() => navigation.popToTop()}
            />
          </View>
        {!readOnly && (
            <>
              <View style={styles.buttonWrapper}>
                <Button title="Save as Draft" onPress={handleSaveDraft} />
              </View>
              <View style={styles.buttonWrapper}>
                <Button
                  title="Submit"
                  onPress={handleSubmitForm}
                  color={Colors[colorScheme].tint}
                  disabled={!isOnline}
                />
              </View>
            </>
          )}
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    padding: 16,
    marginBottom: 30
  },
  buttonWrapper: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: 250,
    padding: 16,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#0a7ea4',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mediaList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaThumb: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  offlineText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
});
