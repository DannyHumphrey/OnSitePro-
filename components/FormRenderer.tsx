import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react';
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Collapsible } from './Collapsible';

function getNestedValue(obj: any, path: (string | number)[]) {
  return path.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function setNestedValue(obj: any, path: (string | number)[], value: any): any {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  if (rest.length === 0) {
    clone[key as any] = value;
  } else {
    clone[key as any] = setNestedValue(
      obj ? obj[key as any] : undefined,
      rest,
      value,
    );
  }
  return clone;
}

export type FormField = {
  type: 'text' | 'date' | 'photo';
  label: string;
  key: string;
  required?: boolean;
};

export type FormSection = {
  key: string;
  label: string;
  repeatable?: boolean;
  fields: FormField[];
};

export type FormSchema = FormSection[];

export type FormRendererProps = {
  schema: FormSchema;
  initialData?: Record<string, any>;
};

export type FormRendererRef = {
  getFormData: () => Record<string, unknown>;
};

export const FormRenderer = forwardRef<FormRendererRef, FormRendererProps>(
  ({ schema, initialData }, ref) => {
    function createEmptySection(section: FormSection) {
      const obj: Record<string, any> = {};
      section.fields.forEach((f) => {
        obj[f.key] = f.type === 'photo' ? undefined : '';
      });
      return obj;
    }

    function buildInitialState() {
      const state: Record<string, any> = {};
      schema.forEach((section) => {
        if (section.repeatable) {
          const arr: Record<string, any>[] = [];
          const initialArr = (initialData?.[section.key] as any[]) ?? [];
          initialArr.forEach((entry) => {
            arr.push({ ...createEmptySection(section), ...entry });
          });
          state[section.key] = arr;
        } else {
          state[section.key] = {
            ...createEmptySection(section),
            ...(initialData?.[section.key] ?? {}),
          };
        }
      });
      return state;
    }

    const [formState, setFormState] = useState<Record<string, any>>(buildInitialState);
    const [instanceIds, setInstanceIds] = useState<Record<string, string[]>>(() => {
      const ids: Record<string, string[]> = {};
      schema.forEach((section) => {
        if (section.repeatable) {
          const length = ((initialData?.[section.key] as any[]) ?? []).length;
          ids[section.key] = Array.from({ length }, () => uuidv4());
        }
      });
      return ids;
    });
    const [activeDateKey, setActiveDateKey] = useState<string | null>(null);

    useEffect(() => {
      if (initialData) {
        setFormState(buildInitialState());
        setInstanceIds(() => {
          const ids: Record<string, string[]> = {};
          schema.forEach((section) => {
            if (section.repeatable) {
              const length = ((initialData?.[section.key] as any[]) ?? []).length;
              ids[section.key] = Array.from({ length }, () => uuidv4());
            }
          });
          return ids;
        });
      }
    }, [initialData, schema]);

    useImperativeHandle(ref, () => ({
      getFormData: () => formState,
    }));

    const handleChange = (path: (string | number)[], value: any) => {
      setFormState((prev) => setNestedValue(prev, path, value));
    };

    const handlePickImage = async (path: (string | number)[]) => {
      await ImagePicker.requestCameraPermissionsAsync();
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        const formsDir = `${FileSystem.documentDirectory}forms/`;
        try {
          await FileSystem.makeDirectoryAsync(formsDir, { intermediates: true });
        } catch {}
        const extension = asset.uri.split('.').pop() || 'jpg';
        const filename = `${uuidv4()}.${extension}`;
        const dest = formsDir + filename;
        await FileSystem.copyAsync({ from: asset.uri, to: dest });
        handleChange(path, dest);
      }
    };

    const renderField = (field: FormField, path: (string | number)[]) => {
      const key = path.join('.');
      const value = getNestedValue(formState, path);
      switch (field.type) {
        case 'text':
          return (
            <View style={styles.fieldContainer} key={key}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.textInput}
                value={value}
                onChangeText={(text) => handleChange(path, text)}
              />
            </View>
          );
        case 'date':
          return (
            <View style={styles.fieldContainer} key={key}>
              <Text style={styles.label}>{field.label}</Text>
              <Button
                title={
                  value ? new Date(value).toLocaleDateString() : 'Select Date'
                }
                onPress={() => setActiveDateKey(key)}
              />
              {activeDateKey === key && (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(
                    _event: DateTimePickerEvent,
                    date?: Date,
                  ) => {
                    setActiveDateKey(null);
                    if (date) {
                      handleChange(path, date.toISOString());
                    }
                  }}
                />
              )}
            </View>
          );
        case 'photo':
          return (
            <View style={styles.fieldContainer} key={key}>
              <Text style={styles.label}>{field.label}</Text>
              <Button title="Take Photo" onPress={() => handlePickImage(path)} />
              {value && (
                <Image source={{ uri: value }} style={styles.thumbnail} />
              )}
            </View>
          );
        default:
          return null;
      }
    };

    const addSection = (section: FormSection) => {
      setFormState((prev) => {
        const arr = (prev[section.key] as any[]) ?? [];
        return {
          ...prev,
          [section.key]: [...arr, createEmptySection(section)],
        };
      });
      setInstanceIds((prev) => {
        const ids = prev[section.key] ?? [];
        return { ...prev, [section.key]: [...ids, uuidv4()] };
      });
    };

    const removeSection = (key: string, index: number) => {
      setFormState((prev) => {
        const arr = (prev[key] as any[]) ?? [];
        return { ...prev, [key]: arr.filter((_, i) => i !== index) };
      });
      setInstanceIds((prev) => {
        const arr = prev[key] ?? [];
        return { ...prev, [key]: arr.filter((_, i) => i !== index) };
      });
    };

    const renderSection = (section: FormSection) => {
      if (section.repeatable) {
        const entries: Record<string, any>[] = formState[section.key] ?? [];
        const ids = instanceIds[section.key] ?? [];
        return (
          <View key={section.key} style={styles.sectionContainer}>
            <View style={styles.repeatableHeader}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <Button
                title={`Add ${section.label}`}
                onPress={() => addSection(section)}
              />
            </View>
            {entries.map((_, idx) => (
              <Collapsible
                key={ids[idx] ?? `${section.key}-${idx}`}
                title={`${section.label} ${idx + 1}`}>
                <View style={styles.sectionContent}>
                  {section.fields.map((f) =>
                    renderField(f, [section.key, idx, f.key]),
                  )}
                  <Button
                    title="Remove"
                    onPress={() => removeSection(section.key, idx)}
                  />
                </View>
              </Collapsible>
            ))}
          </View>
        );
      }

      return (
        <Collapsible key={section.key} title={section.label}>
          {section.fields.map((f) => renderField(f, [section.key, f.key]))}
        </Collapsible>
      );
    };

    return (
      <ScrollView contentContainerStyle={styles.container}>
        {schema.map((section) => renderSection(section))}
      </ScrollView>
    );
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
  sectionContainer: {
    gap: 8,
  },
  repeatableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionContent: {
    gap: 8,
    marginTop: 8,
  },
});

export default FormRenderer;
