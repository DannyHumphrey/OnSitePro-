import { StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FormSchema } from '@/components/FormRenderer';

export default function DraftsScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList>
  >();
  const colorScheme = useColorScheme() ?? 'light';

  const demoSchema: FormSchema = [
    { type: 'text', label: 'Full Name', key: 'fullName', required: true },
    { type: 'date', label: 'Date of Visit', key: 'visitDate' },
    { type: 'photo', label: 'Take a Picture', key: 'photo' },
  ];

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText type="title">Drafts Screen</ThemedText>
      </ThemedView>
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: Colors[colorScheme].tint,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => navigation.navigate('Form', { schema: demoSchema })}
        accessibilityLabel="Create New Form">
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});
