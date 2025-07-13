import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, SafeAreaView, StyleSheet, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import FormRenderer, { type FormRendererRef } from '@/components/FormRenderer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DraftsStackParamList } from '@/navigation/types';
import {
  getDraftById,
  saveDraft,
  type DraftForm,
} from '@/services/draftService';

type OutboxForm = Omit<DraftForm, 'status'> & { status: 'complete' };

type Props = NativeStackScreenProps<DraftsStackParamList, 'FormScreen'>;

export default function FormScreen({ route, navigation }: Props) {
  const { schema, formName, formType = 'demo', draftId, data } = route.params;
  const formRef = useRef<FormRendererRef>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const [existingDraft, setExistingDraft] = useState<DraftForm | null>(null);
  const [initialData, setInitialData] = useState<Record<string, any> | undefined>(data);

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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        {formName && (
          <ThemedText type="title" style={{ padding: 16 }}>
            {formName}
          </ThemedText>
        )}
        <FormRenderer ref={formRef} schema={schema} initialData={initialData} />
        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Button
              title="Back"
              onPress={() => navigation.popToTop()}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Save as Draft" onPress={handleSaveDraft} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Submit"
              onPress={handleSubmitForm}
              color={Colors[colorScheme].tint}
            />
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    padding: 16,
  },
  buttonWrapper: {
    flex: 1,
  },
});
