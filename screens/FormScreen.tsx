import { SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import FormRenderer from '@/components/FormRenderer';
import { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export default function FormScreen({ route }: Props) {
  const { schema, formName } = route.params;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        {formName && (
          <ThemedText type="title" style={{ padding: 16 }}>
            {formName}
          </ThemedText>
        )}
        <FormRenderer schema={schema} />
      </ThemedView>
    </SafeAreaView>
  );
}
