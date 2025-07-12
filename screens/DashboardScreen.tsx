import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { FormSchema } from '@/components/FormRenderer';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';

  const demoSchema: FormSchema = [
    { type: 'text', label: 'Full Name', key: 'fullName', required: true },
    { type: 'date', label: 'Date of Visit', key: 'visitDate' },
    { type: 'photo', label: 'Take a Picture', key: 'photo' },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Button title="Inbox" onPress={() => navigation.navigate('Inbox')} />
        <Button title="Drafts" onPress={() => navigation.navigate('Drafts')} />
        <Button title="Outbox" onPress={() => navigation.navigate('Outbox')} />
        <Button title="Sent" onPress={() => navigation.navigate('Sent')} />
        <Button
          title="Create New Form"
          onPress={() => navigation.navigate('Form', { schema: demoSchema })}
          color={Colors[colorScheme].tint}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
});
