import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  memo,
} from 'react';
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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

function parsePath(key: string): (string | number)[] {
  return key.split('.').map((part) => {
    return /^[0-9]+$/.test(part) ? Number(part) : part;
  });
}

function evaluateCondition(
  condition: VisibleWhenCondition,
  state: Record<string, any>,
  localContext?: Record<string, any>,
): boolean {
  const value = getNestedValue(localContext ?? state, parsePath(condition.key));
  if ('equals' in condition) {
    return value === condition.equals;
  }
  if ('notEquals' in condition) {
    return value !== condition.notEquals;
  }
  return true;
}

function evaluateVisibleWhen(
  rule: VisibleWhen | undefined,
  state: Record<string, any>,
  localContext?: Record<string, any>,
): boolean {
  if (!rule) return true;
  const allPass = rule.all
    ? rule.all.every((c) => evaluateCondition(c, state, localContext))
    : true;
  const anyPass = rule.any
    ? rule.any.some((c) => evaluateCondition(c, state, localContext))
    : true;
  return allPass && anyPass;
}

function getVisibleFields(
  schema: FormSchema,
  state: Record<string, any>,
): { field: FormField; path: (string | number)[] }[] {
  const fields: { field: FormField; path: (string | number)[] }[] = [];
  schema.forEach((section) => {
    if (section.repeatable) {
      const rows: Record<string, any>[] = state[section.key] ?? [];
      rows.forEach((row, idx) => {
        section.fields.forEach((f) => {
          if (evaluateVisibleWhen(f.visibleWhen, state, row)) {
            fields.push({ field: f, path: [section.key, idx, f.key] });
          }
        });
      });
    } else {
      const row: Record<string, any> = state[section.key] ?? {};
      section.fields.forEach((f) => {
        if (evaluateVisibleWhen(f.visibleWhen, state, row)) {
          fields.push({ field: f, path: [section.key, f.key] });
        }
      });
    }
  });
  return fields;
}

export type VisibleWhenCondition =
  | { key: string; equals: any }
  | { key: string; notEquals: any };

export type VisibleWhen = {
  all?: VisibleWhenCondition[];
  any?: VisibleWhenCondition[];
};

export type FormField =
  | {
      type: 'text' | 'date' | 'photo';
      label: string;
      key: string;
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'boolean';
      label: string;
      key: string;
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'number';
      label: string;
      key: string;
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'select';
      label: string;
      key: string;
      options: string[];
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'multiselect';
      label: string;
      key: string;
      options: string[];
      required?: boolean;
      visibleWhen?: VisibleWhen;
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
  validateForm: () => { isValid: boolean; errors: Record<string, string> };
};

export type FieldRendererProps = {
  field: FormField;
  path: (string | number)[];
  formState: Record<string, any>;
  localContext?: Record<string, any>;
  activeDateKey: string | null;
  setActiveDateKey: React.Dispatch<React.SetStateAction<string | null>>;
  handleChange: (path: (string | number)[], value: any) => void;
  handlePickImage: (path: (string | number)[]) => void;
  error?: string;
};

const FieldRenderer = memo(function FieldRenderer({
  field,
  path,
  formState,
  localContext,
  activeDateKey,
  setActiveDateKey,
  handleChange,
  handlePickImage,
  error,
}: FieldRendererProps) {
  const key = path.join('.');
  const isVisible = React.useMemo(
    () => evaluateVisibleWhen(field.visibleWhen, formState, localContext),
    [formState, localContext, field.visibleWhen],
  );
  if (!isVisible) return null;
  const value = getNestedValue(formState, path);

  switch (field.type) {
    case 'text':
      return (
        <View style={styles.fieldContainer} key={key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[styles.textInput, error && styles.errorInput]}
            value={value}
            onChangeText={(text) => handleChange(path, text)}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    case 'boolean':
      return (
        <View
          style={[styles.fieldContainer, error && styles.errorContainer]}
          key={key}>
          <Text style={styles.label}>{field.label}</Text>
          <Switch
            value={!!value}
            onValueChange={(val) => handleChange(path, val)}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    case 'number':
      return (
        <View style={styles.fieldContainer} key={key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[styles.textInput, error && styles.errorInput]}
            keyboardType="numeric"
            value={value !== undefined ? String(value) : ''}
            onChangeText={(text) =>
              handleChange(path, text === '' ? undefined : Number(text))
            }
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    case 'select':
      return (
        <View style={styles.fieldContainer} key={key}>
          <Text style={styles.label}>{field.label}</Text>
          <View style={[styles.pickerWrapper, error && styles.errorInput]}>
            <Picker selectedValue={value} onValueChange={(val) => handleChange(path, val)}>
              <Picker.Item label="" value="" />
              {field.options.map((opt) => (
                <Picker.Item key={opt} label={opt} value={opt} />
              ))}
            </Picker>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    case 'multiselect':
      return (
        <View style={[styles.fieldContainer, error && styles.errorContainer]} key={key}>
          <Text style={styles.label}>{field.label}</Text>
          {field.options.map((opt) => {
            const selected = Array.isArray(value) ? value.includes(opt) : false;
            return (
              <View key={opt} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Switch
                  value={selected}
                  onValueChange={(val) => {
                    const current: string[] = Array.isArray(value) ? [...value] : [];
                    if (val) {
                      if (!current.includes(opt)) current.push(opt);
                    } else {
                      const idx = current.indexOf(opt);
                      if (idx > -1) current.splice(idx, 1);
                    }
                    handleChange(path, current);
                  }}
                />
                <Text>{opt}</Text>
              </View>
            );
          })}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    case 'date':
      return (
        <View style={[styles.fieldContainer, error && styles.errorContainer]} key={key}>
          <Text style={styles.label}>{field.label}</Text>
          <Button
            title={value ? new Date(value).toLocaleDateString() : 'Select Date'}
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
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    case 'photo':
      return (
        <View style={[styles.fieldContainer, error && styles.errorContainer]} key={key}>
          <Text style={styles.label}>{field.label}</Text>
          <Button title="Take Photo" onPress={() => handlePickImage(path)} />
          {value && <Image source={{ uri: value }} style={styles.thumbnail} />}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    default:
      return null;
  }
});

export const FormRenderer = forwardRef<FormRendererRef, FormRendererProps>(
  ({ schema, initialData }, ref) => {
    function createEmptySection(section: FormSection) {
      const obj: Record<string, any> = {};
      section.fields.forEach((f) => {
        switch (f.type) {
          case 'photo':
            obj[f.key] = undefined;
            break;
          case 'boolean':
            obj[f.key] = false;
            break;
          case 'number':
            obj[f.key] = undefined;
            break;
          case 'multiselect':
            obj[f.key] = [];
            break;
          default:
            obj[f.key] = '';
            break;
        }
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
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
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
      validateForm: validateForm,
    }));

    const handleChange = (path: (string | number)[], value: any) => {
      setFormState((prev) => setNestedValue(prev, path, value));
      setFormErrors((prev) => {
        const key = path.join('.');
        if (!prev[key]) return prev;
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
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

    function validateForm() {
      const fields = getVisibleFields(schema, formState);
      const errors: Record<string, string> = {};
      fields.forEach(({ field, path }) => {
        if (field.required) {
          const val = getNestedValue(formState, path);
          const empty =
            val === undefined ||
            val === null ||
            val === '' ||
            (Array.isArray(val) && val.length === 0);
          if (empty) {
            errors[path.join('.')] = 'Required';
          }
        }
      });
      setFormErrors(errors);
      return { isValid: Object.keys(errors).length === 0, errors };
    }


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
            {entries.map((row, idx) => (
              <Collapsible
                key={ids[idx] ?? `${section.key}-${idx}`}
                title={`${section.label} ${idx + 1}`}>
                <View style={styles.sectionContent}>
                  {section.fields.map((f) => (
                    <FieldRenderer
                      key={`${section.key}-${idx}-${f.key}`}
                      field={f}
                      path={[section.key, idx, f.key]}
                      formState={formState}
                      localContext={row}
                      activeDateKey={activeDateKey}
                      setActiveDateKey={setActiveDateKey}
                      handleChange={handleChange}
                      handlePickImage={handlePickImage}
                      error={formErrors[`${section.key}.${idx}.${f.key}`]}
                    />
                  ))}
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
          {section.fields.map((f) => (
            <FieldRenderer
              key={`${section.key}-${f.key}`}
              field={f}
              path={[section.key, f.key]}
              formState={formState}
              activeDateKey={activeDateKey}
              setActiveDateKey={setActiveDateKey}
              handleChange={handleChange}
              handlePickImage={handlePickImage}
              error={formErrors[`${section.key}.${f.key}`]}
            />
          ))}
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
  },
  errorContainer: {
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 4,
    padding: 4,
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
