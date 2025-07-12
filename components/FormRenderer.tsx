import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export type FormField = {
  type: 'text' | 'date' | 'photo';
  label: string;
  key: string;
  required?: boolean;
};

export type FormSchema = FormField[];

export type FormRendererProps = {
  schema: FormSchema;
  initialData?: Record<string, any>;
};

export type FormRendererRef = {
  getFormData: () => Record<string, unknown>;
};

export const FormRenderer = forwardRef<FormRendererRef, FormRendererProps>(
  ({ schema, initialData }, ref) => {
    const initialState: Record<string, any> = {};
    schema.forEach((field) => {
      if (initialData && field.key in initialData) {
        initialState[field.key] = initialData[field.key];
      } else {
        initialState[field.key] = field.type === 'photo' ? undefined : '';
      }
    });
    const [formState, setFormState] = useState<Record<string, any>>(initialState);
    const [activeDateKey, setActiveDateKey] = useState<string | null>(null);

    useEffect(() => {
      if (initialData) {
        setFormState((prev) => ({ ...prev, ...initialData }));
      }
    }, [initialData]);

    useImperativeHandle(ref, () => ({
      getFormData: () => formState,
    }));

    const handleChange = (key: string, value: any) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
    };

    const handlePickImage = async (key: string) => {
      await ImagePicker.requestCameraPermissionsAsync();
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!result.canceled) {
        handleChange(key, result.assets[0].uri);
      }
    };

    const renderField = (field: FormField) => {
      switch (field.type) {
        case 'text':
          return (
            <View style={styles.fieldContainer} key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.textInput}
                value={formState[field.key]}
                onChangeText={(text) => handleChange(field.key, text)}
              />
            </View>
          );
        case 'date':
          return (
            <View style={styles.fieldContainer} key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              <Button
                title={
                  formState[field.key]
                    ? new Date(formState[field.key]).toLocaleDateString()
                    : 'Select Date'
                }
                onPress={() => setActiveDateKey(field.key)}
              />
              {activeDateKey === field.key && (
                <DateTimePicker
                  value={formState[field.key] ? new Date(formState[field.key]) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(
                    _event: DateTimePickerEvent,
                    date?: Date,
                  ) => {
                    setActiveDateKey(null);
                    if (date) {
                      handleChange(field.key, date.toISOString());
                    }
                  }}
                />
              )}
            </View>
          );
        case 'photo':
          return (
            <View style={styles.fieldContainer} key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              <Button title="Take Photo" onPress={() => handlePickImage(field.key)} />
              {formState[field.key] && (
                <Image source={{ uri: formState[field.key] }} style={styles.thumbnail} />
              )}
            </View>
          );
        default:
          return null;
      }
    };

    return <ScrollView contentContainerStyle={styles.container}>{schema.map(renderField)}</ScrollView>;
  },
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
  thumbnail: {
    marginTop: 8,
    width: 100,
    height: 100,
  },
});

export default FormRenderer;
