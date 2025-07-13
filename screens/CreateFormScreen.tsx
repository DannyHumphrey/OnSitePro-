import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import type { FormSchema } from '@/components/FormRenderer';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RootStackParamList } from '@/navigation/types';

export default function CreateFormScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme() ?? 'light';
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'demo'>('demo');

  const schema: FormSchema = [
    {
      key: 'personInvolved',
      label: 'Person Involved',
      fields: [
        {
          type: 'text',
          label: 'Full Name',
          key: 'fullName',
          required: true,
        },
        { type: 'date', label: 'Date of Visit', key: 'visitDate' },
        { type: 'photo', label: 'Take a Picture', key: 'photo' },
      ],
    },
    {
      key: 'witnessStatements',
      label: 'Witness Statement',
      repeatable: true,
      fields: [
        { type: 'text', label: 'Name', key: 'name' },
        { type: 'text', label: 'Statement', key: 'statement' },
      ],
    },
  ];

  const handleStart = () => {
    navigation.navigate('Form', { schema, formType, formName });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.fieldContainer}>
          <ThemedText>Form Name</ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="Enter form name"
            value={formName}
            onChangeText={setFormName}
          />
        </View>
        <View style={styles.fieldContainer}>
          <ThemedText>Form Type</ThemedText>
          <Picker
            selectedValue={formType}
            onValueChange={(val) => setFormType(val)}>
            <Picker.Item label="Demo Form" value="demo" />
          </Picker>
        </View>
        <Button
          title="Create"
          onPress={handleStart}
          color={Colors[colorScheme].tint}
        />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
});
