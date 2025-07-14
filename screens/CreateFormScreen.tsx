import DropDownPicker from 'react-native-dropdown-picker';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import type { FormSchema } from '@/components/formRenderer/fields/types';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DraftsStackParamList } from '@/navigation/types';

export default function CreateFormScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<DraftsStackParamList>>();
  const colorScheme = useColorScheme() ?? 'light';
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'demo'>('demo');
  const [open, setOpen] = useState(false);

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
        {
          type: 'text',
          label: 'Job Title',
          key: 'jobTitle',
          visibleWhen: {
            all: [{ key: 'personInvolved.fullName', notEquals: '' }]
          }
        },
        { type: 'date', label: 'Date of Visit', key: 'visitDate' },
        { type: 'photo', label: 'Take a Picture', key: 'photo' },
        {
          type: 'select',
          label: 'Injury Severity',
          key: 'injurySeverity',
          options: [
            { label: 'Minor', value: 'Minor' },
            { label: 'Major', value: 'Major' },
            { label: 'Severe', value: 'Severe' },
            { label: 'Fatal', value: 'Fatal' }
          ]
        },
        {
          type: 'multiselect',
          label: 'Injury Location',
          key: 'injuryLocation',
          options: [
            'Head',
            'Neck',
            'Back',
            'Chest',
            'Abdomen',
            'Pelvis',
            'Upper Extremity',
            'Lower Extremity',
            'Other'
          ]
        },
        {
          type: 'number',
          label: 'Number of people involved',
          key: 'peopleCount'
        }
      ],
    },
    {
      key: 'witnessStatements',
      label: 'Witness Statement',
      repeatable: true,
      fields: [
        { type: 'text', label: 'Name', key: 'name', required: true },
        { type: 'text', label: 'Statement', key: 'statement' },
        {
          type: 'boolean',
          label: 'Follow-up Required?',
          key: 'followUpRequired',
          visibleWhen: {
            any: [{ key: 'statement', notEquals: '' }, { key: 'name', notEquals: '' }]
          }
        }
      ],
    },
    {
      key: 'signOff',
      label: 'Sign Off',
      fields: [
        {
          type: 'text',
          label: 'Name of person signing off',
          key: 'nameOfPersonSigningOff',
          required: true,
        },
        {
          type: 'text',
          label: 'Job Title',
          key: 'jobTitle',
          visibleWhen: {
            all: [{ key: 'signOff.nameOfPersonSigningOff', notEquals: '' }]
          }
        }
      ],
    },
  ];
  

  const handleStart = () => {
    navigation.navigate('FormScreen', { schema, formType, formName });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
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
            <DropDownPicker
              open={open}
              value={formType}
              items={[{ label: 'Demo Form', value: 'demo' }]}
              setOpen={setOpen}
              setValue={(cb) => setFormType(cb(formType) as 'demo')}
              disabled
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
          </View>
          <Button
            title="Create"
            onPress={handleStart}
            color={Colors[colorScheme].tint}
          />
          <Button title="Back" onPress={() => navigation.goBack()} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
});
