import { useEffect } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFormCounts } from '@/context/FormCountsContext';

export default function InboxScreen() {
  const { setCounts } = useFormCounts();

  useEffect(() => {
    setCounts((c) => ({ ...c, inbox: 0 }));
  }, [setCounts]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Inbox Screen</ThemedText>
    </ThemedView>
    </SafeAreaView>
  );
}
