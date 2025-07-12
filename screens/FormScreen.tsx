import { Button, SafeAreaView } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import FormRenderer, { type FormRendererRef } from '@/components/FormRenderer';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  saveDraft,
  type DraftForm,
  getDraftById,
} from '@/services/draftService';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export default function FormScreen({ route, navigation }: Props) {
  const { schema, formName, formType = 'demo', draftId, data } = route.params;
  const formRef = useRef<FormRendererRef>(null);
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
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        <Button title="Back" onPress={() => navigation.navigate('Dashboard')} />
        <Button
          title="Create New Form"
          onPress={() => navigation.navigate('CreateForm')}
        />
        {formName && (
          <ThemedText type="title" style={{ padding: 16 }}>
            {formName}
          </ThemedText>
        )}
        <FormRenderer ref={formRef} schema={schema} initialData={initialData} />
        <Button title="Save Draft" onPress={handleSaveDraft} />
      </ThemedView>
    </SafeAreaView>
  );
}
