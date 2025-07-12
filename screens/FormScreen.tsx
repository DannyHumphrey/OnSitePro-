import { SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedView } from '@/components/ThemedView';
import FormRenderer from '@/components/FormRenderer';
import { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export default function FormScreen({ route }: Props) {
  const { schema } = route.params;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        <FormRenderer schema={schema} />
      </ThemedView>
    </SafeAreaView>
  );
}
