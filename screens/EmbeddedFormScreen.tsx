import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FormRenderer from '@/components/formRenderer';
import type { FormSchema } from '@/components/formRenderer/fields/types';
import { RootStackParamList } from '@/navigation/types';
import { fetchEmbeddedForm } from '@/services/embeddedFormService';

export type EmbeddedFormParams = {
  user?: string;
  survey?: string;
  readOnly?: boolean | string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'EmbeddedFormScreen'>;

export default function EmbeddedFormScreen({ route }: Props) {
  const { user, survey, readOnly } = (route.params || {}) as EmbeddedFormParams;
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !survey) {
      setError('Missing parameters');
      setLoading(false);
      return;
    }
    fetchEmbeddedForm(user, survey)
      .then((res) => {
        setSchema(res.schema);
        setData(res.data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [user, survey]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (error || !schema) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>{error || 'Failed to load form.'}</Text>
      </SafeAreaView>
    );
  }

  const isReadOnly = readOnly === true || readOnly === 'true';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FormRenderer schema={schema} initialData={data ?? {}} readOnly={isReadOnly} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
