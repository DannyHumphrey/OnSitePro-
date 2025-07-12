import { Button, SafeAreaView } from 'react-native';
import { useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import FormRenderer, { type FormRendererRef } from '@/components/FormRenderer';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { saveDraft, type DraftForm } from '@/services/draftService';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export default function FormScreen({ route }: Props) {
  const { schema, formName, formType = 'demo' } = route.params;
  const formRef = useRef<FormRendererRef>(null);

  const handleSaveDraft = async () => {
    const data = formRef.current?.getFormData() ?? {};
    const timestamp = new Date().toISOString();
    const draft: DraftForm = {
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
    await saveDraft(draft);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        {formName && (
          <ThemedText type="title" style={{ padding: 16 }}>
            {formName}
          </ThemedText>
        )}
        <FormRenderer ref={formRef} schema={schema} />
        <Button title="Save Draft" onPress={handleSaveDraft} />
      </ThemedView>
    </SafeAreaView>
  );
}
