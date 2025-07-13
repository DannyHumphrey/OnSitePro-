import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import Signature from 'react-native-signature-canvas';
import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import {
  Button,
  Image,
  LayoutChangeEvent,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
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
      type: 'text' | 'date' | 'photo' | 'signature';
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
  readOnly?: boolean;
};

export type FormRendererRef = {
  getFormData: () => Record<string, unknown>;
  validateForm: () => { isValid: boolean; errors: Record<string, string> };
  openSection: (key: string) => void;
  scrollToSection: (key: string) => void;
  scrollToField: (key: string) => void;
  getSectionErrorMap: () => Record<string, boolean>;
  getPhotoFields: () => { key: string; uri: string }[];
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
  registerFieldPosition: (key: string, y: number) => void;
  readOnly?: boolean;
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
  registerFieldPosition,
  readOnly,
}: FieldRendererProps) {
  const key = path.join('.');
  const isVisible = React.useMemo(
    () => evaluateVisibleWhen(field.visibleWhen, formState, localContext),
    [formState, localContext, field.visibleWhen],
  );
  if (!isVisible) return null;
  const value = getNestedValue(formState, path);
  const [preview, setPreview] = useState<string | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    registerFieldPosition(key, e.nativeEvent.layout.y);
  };

  switch (field.type) {
    case 'text':
      return (
        <View style={styles.fieldContainer} key={key} onLayout={onLayout}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[styles.textInput, error && styles.errorInput]}
            value={value}
            editable={!readOnly}
            onChangeText={(text) => handleChange(path, text)}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    case 'boolean':
      return (
        <View
          style={[styles.fieldContainer, error && styles.errorContainer]}
          key={key}
          onLayout={onLayout}>
          <Text style={styles.label}>{field.label}</Text>
          <Switch
            value={!!value}
            onValueChange={(val) => handleChange(path, val)}
            disabled={readOnly}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    case 'number':
      return (
        <View style={styles.fieldContainer} key={key} onLayout={onLayout}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[styles.textInput, error && styles.errorInput]}
            keyboardType="numeric"
            value={value !== undefined ? String(value) : ''}
            editable={!readOnly}
            onChangeText={(text) =>
              handleChange(path, text === '' ? undefined : Number(text))
            }
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    case 'select':
      return (
        <View style={styles.fieldContainer} key={key} onLayout={onLayout}>
          <Text style={styles.label}>{field.label}</Text>
          <View style={[styles.pickerWrapper, error && styles.errorInput]}>
            <Picker
              selectedValue={value}
              onValueChange={(val) => handleChange(path, val)}
              enabled={!readOnly}
            >
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
        <View
          style={[styles.fieldContainer, error && styles.errorContainer]}
          key={key}
          onLayout={onLayout}>
          <Text style={styles.label}>{field.label}</Text>
          {field.options.map((opt) => {
            const selected = Array.isArray(value) ? value.includes(opt) : false;
            return (
              <View
                key={opt}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Switch
                  value={selected}
                  onValueChange={(val) => {
                    const current: string[] = Array.isArray(value)
                      ? [...value]
                      : [];
                    if (val) {
                      if (!current.includes(opt)) current.push(opt);
                    } else {
                      const idx = current.indexOf(opt);
                      if (idx > -1) current.splice(idx, 1);
                    }
                    handleChange(path, current);
                  }}
                  disabled={readOnly}
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
        <View style={[styles.fieldContainer, error && styles.errorContainer]} key={key} onLayout={onLayout}>
          <Text style={styles.label}>{field.label}</Text>
          <Button
            title={value ? new Date(value).toLocaleDateString() : 'Select Date'}
            onPress={() => setActiveDateKey(key)}
            disabled={readOnly}
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
      const photos: string[] = Array.isArray(value) ? value : [];
      const [preview, setPreview] = useState<string | null>(null);

      const handleRemove = (idx: number) => {
        if (readOnly) return;
        const updated = photos.filter((_, i) => i !== idx);
        handleChange(path, updated);
      };

      return (
        <View style={[styles.fieldContainer, error && styles.errorContainer]} key={key} onLayout={onLayout}>
          <Text style={styles.label}>{field.label}</Text>
          {!readOnly && (
            <Button title="Take Photo" onPress={() => handlePickImage(path)} />
          )}
          <View style={styles.photoList}>
            {photos.map((uri, idx) => (
              <View key={uri} style={styles.photoWrapper}>
                <TouchableOpacity onPress={() => setPreview(uri)}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                </TouchableOpacity>
                {!readOnly && (
                  <Button title="Delete" onPress={() => handleRemove(idx)} />
                )}
              </View>
            ))}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {preview && (
            <Modal transparent visible onRequestClose={() => setPreview(null)}>
              <TouchableOpacity style={styles.previewContainer} onPress={() => setPreview(null)}>
                <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="contain" />
              </TouchableOpacity>
            </Modal>
          )}
        </View>
      );
    case 'signature':
      const sigUri: string | undefined = value;
      const [sigPreview, setSigPreview] = useState<string | null>(null);
      const signatureRef = useRef<any>(null);
      const [showPad, setShowPad] = useState(!sigUri);

      const handleSaveSignature = async (dataUrl: string) => {
        if (readOnly) return;
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        const formsDir = `${FileSystem.documentDirectory}forms/`;
        try {
          await FileSystem.makeDirectoryAsync(formsDir, { intermediates: true });
        } catch {}
        const filename = `${uuidv4()}.png`;
        const dest = formsDir + filename;
        await FileSystem.writeAsStringAsync(dest, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        handleChange(path, dest);
        setShowPad(false);
      };

      return (
        <View
          style={[styles.fieldContainer, error && styles.errorContainer]}
          key={key}
          onLayout={onLayout}>
          <Text style={styles.label}>{field.label}</Text>
          {showPad && !readOnly ? (
            <>
              <Signature
                ref={signatureRef}
                onOK={handleSaveSignature}
                webStyle=".m-signature-pad--footer { display: none; margin: 0px; }"
              />
              <Button
                title="Clear"
                onPress={() => signatureRef.current?.clearSignature()}
              />
            </>
          ) : sigUri ? (
            <View style={{ gap: 8 }}>
              <TouchableOpacity onPress={() => setSigPreview(sigUri)}>
                <Image source={{ uri: sigUri }} style={styles.signatureImage} />
              </TouchableOpacity>
              {!readOnly && (
                <Button
                  title="Redo"
                  onPress={() => {
                    handleChange(path, undefined);
                    setShowPad(true);
                  }}
                />
              )}
            </View>
          ) : null}
          {error && <Text style={styles.errorText}>{error}</Text>}
          {sigPreview && (
            <Modal
              transparent
              visible
              onRequestClose={() => setSigPreview(null)}>
              <TouchableOpacity
                style={styles.previewContainer}
                onPress={() => setSigPreview(null)}>
                <Image
                  source={{ uri: sigPreview }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </Modal>
          )}
        </View>
      );
    default:
      return null;
  }
});

export const FormRenderer = forwardRef<FormRendererRef, FormRendererProps>(
  ({ schema, initialData, readOnly }, ref) => {
    function createEmptySection(section: FormSection) {
      const obj: Record<string, any> = {};
      section.fields.forEach((f) => {
        switch (f.type) {
          case 'photo':
            obj[f.key] = [];
            break;
          case 'signature':
            obj[f.key] = '';
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

    function normalizeSectionData(section: FormSection, data: any) {
      const result: Record<string, any> = { ...data };
      section.fields.forEach((f) => {
        if (f.type === 'photo') {
          const val = result[f.key];
          if (val === undefined || val === null) {
            result[f.key] = [];
          } else if (Array.isArray(val)) {
            result[f.key] = val;
          } else {
            result[f.key] = [val];
          }
        }
      });
      return result;
    }

    function buildInitialState() {
      const state: Record<string, any> = {};
      schema.forEach((section) => {
        if (section.repeatable) {
          const arr: Record<string, any>[] = [];
          const initialArr = (initialData?.[section.key] as any[]) ?? [];
          initialArr.forEach((entry) => {
            arr.push({
              ...createEmptySection(section),
              ...normalizeSectionData(section, entry),
            });
          });
          state[section.key] = arr;
        } else {
          state[section.key] = {
            ...createEmptySection(section),
            ...normalizeSectionData(section, initialData?.[section.key] ?? {}),
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
    const buildExpandedState = () => {
      const expanded: Record<string, boolean> = {};
      schema.forEach((section) => {
        if (section.repeatable) {
          const length = ((initialData?.[section.key] as any[]) ?? []).length;
          for (let i = 0; i < length; i++) {
            expanded[`${section.key}.${i}`] = false;
          }
        } else {
          expanded[section.key] = false;
        }
      });
      return expanded;
    };

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(buildExpandedState);
    const [erroredSections, setErroredSections] = useState<Record<string, boolean>>({});
    const scrollRef = useRef<ScrollView>(null);
    const sectionPositions = useRef<Record<string, number>>({});
    const fieldPositions = useRef<Record<string, number>>({});

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
        setExpandedSections(buildExpandedState());
        setErroredSections({});
      }
    }, [initialData, schema]);

    useImperativeHandle(ref, () => ({
      getFormData: () => formState,
      validateForm: validateForm,
      openSection: (key: string) => {
        setExpandedSections((prev) => ({ ...prev, [key]: true }));
        const y = sectionPositions.current[key];
        if (y !== undefined) {
          setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 50);
        }
      },
      scrollToSection: (key: string) => {
        const y = sectionPositions.current[key];
        if (y !== undefined) {
          setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 50);
        }
      },
      scrollToField: (key: string) => {
        const parts = key.split('.');
        const section = parts.length > 2 ? `${parts[0]}.${parts[1]}` : parts[0];
        setExpandedSections((prev) => ({ ...prev, [section]: true }));
        const y = fieldPositions.current[key];
        if (y !== undefined) {
          setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 50);
        }
      },
      getSectionErrorMap: () => erroredSections,
      getPhotoFields: () => {
        const fields = getVisibleFields(schema, formState);
        const photos: { key: string; uri: string }[] = [];
        fields.forEach(({ field, path }) => {
          if (field.type === 'photo') {
            const val = getNestedValue(formState, path);
            if (Array.isArray(val)) {
              val.forEach((uri, idx) => {
                photos.push({ key: `${path.join('.')}.${idx}`, uri });
              });
            }
          } else if (field.type === 'signature') {
            const uri = getNestedValue(formState, path);
            if (typeof uri === 'string' && uri) {
              photos.push({ key: path.join('.'), uri });
            }
          }
        });
        return photos;
      },
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
        quality: 0.5,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        let width = asset.width ?? 0;
        let height = asset.height ?? 0;
        const maxDim = Math.max(width, height);
        if (maxDim > 1000) {
          const scale = 1000 / maxDim;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width, height } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
        );

        const formsDir = `${FileSystem.documentDirectory}forms/`;
        try {
          await FileSystem.makeDirectoryAsync(formsDir, { intermediates: true });
        } catch {}
        const extension = manipulated.uri.split('.').pop() || 'jpg';
        const filename = `${uuidv4()}.${extension}`;
        const dest = formsDir + filename;
        await FileSystem.copyAsync({ from: manipulated.uri, to: dest });
        const current = getNestedValue(formState, path);
        const arr = Array.isArray(current) ? [...current, dest] : [dest];
        handleChange(path, arr);
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

      const errorKeys = Object.keys(errors);
      const newExpanded: Record<string, boolean> = {};
      const newErrored: Record<string, boolean> = {};
      const erroredOrder: string[] = [];
      schema.forEach((section) => {
        if (section.repeatable) {
          const rows: any[] = formState[section.key] ?? [];
          rows.forEach((_row, idx) => {
            const prefix = `${section.key}.${idx}.`;
            const hasErr = errorKeys.some((k) => k.startsWith(prefix));
            const secKey = `${section.key}.${idx}`;
            newExpanded[secKey] = hasErr;
            if (hasErr) {
              newErrored[secKey] = true;
              erroredOrder.push(secKey);
            }
          });
        } else {
          const prefix = `${section.key}.`;
          const hasErr = errorKeys.some((k) => k.startsWith(prefix));
          newExpanded[section.key] = hasErr;
          if (hasErr) {
            newErrored[section.key] = true;
            erroredOrder.push(section.key);
          }
        }
      });
      setExpandedSections(newExpanded);
      setErroredSections(newErrored);

      if (erroredOrder.length > 0) {
        const firstKey = erroredOrder[0];
        const y = sectionPositions.current[firstKey];
        if (y !== undefined) {
          setTimeout(() => {
            scrollRef.current?.scrollTo({ y, animated: true });
          }, 50);
        }
      }

      return { isValid: errorKeys.length === 0, errors };
    }


    const addSection = (section: FormSection) => {
      let newIndex = 0;
      setFormState((prev) => {
        const arr = (prev[section.key] as any[]) ?? [];
        newIndex = arr.length;
        return {
          ...prev,
          [section.key]: [...arr, createEmptySection(section)],
        };
      });
      setInstanceIds((prev) => {
        const ids = prev[section.key] ?? [];
        return { ...prev, [section.key]: [...ids, uuidv4()] };
      });
      setExpandedSections((prev) => ({
        ...prev,
        [`${section.key}.${newIndex}`]: true,
      }));
      setErroredSections((prev) => ({
        ...prev,
        [`${section.key}.${newIndex}`]: false,
      }));
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
      setExpandedSections((prev) => {
        const updated: Record<string, boolean> = {};
        Object.keys(prev).forEach((k) => {
          if (k.startsWith(`${key}.`)) {
            const idx = parseInt(k.split('.')[1], 10);
            if (idx < index) {
              updated[k] = prev[k];
            } else if (idx > index) {
              updated[`${key}.${idx - 1}`] = prev[k];
            }
          } else {
            updated[k] = prev[k];
          }
        });
        return updated;
      });
      setErroredSections((prev) => {
        const updated: Record<string, boolean> = {};
        Object.keys(prev).forEach((k) => {
          if (k.startsWith(`${key}.`)) {
            const idx = parseInt(k.split('.')[1], 10);
            if (idx < index) {
              updated[k] = prev[k];
            } else if (idx > index) {
              updated[`${key}.${idx - 1}`] = prev[k];
            }
          } else {
            updated[k] = prev[k];
          }
        });
        return updated;
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
                title={`${section.label} ${idx + 1}`}
                isOpen={expandedSections[`${section.key}.${idx}`]}
                onToggle={(open) =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    [`${section.key}.${idx}`]: open,
                  }))
                }
                hasError={erroredSections[`${section.key}.${idx}`]}
                onLayout={(e) => {
                  sectionPositions.current[`${section.key}.${idx}`] =
                    e.nativeEvent.layout.y;
                }}>
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
                      registerFieldPosition={(k, y) => {
                        fieldPositions.current[k] = y;
                      }}
                      readOnly={readOnly}
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
        <Collapsible
          key={section.key}
          title={section.label}
          isOpen={expandedSections[section.key]}
          onToggle={(open) =>
            setExpandedSections((prev) => ({ ...prev, [section.key]: open }))
          }
          hasError={erroredSections[section.key]}
          onLayout={(e) => {
            sectionPositions.current[section.key] = e.nativeEvent.layout.y;
          }}>
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
              registerFieldPosition={(k, y) => {
                fieldPositions.current[k] = y;
              }}
              readOnly={readOnly}
            />
          ))}
        </Collapsible>
      );
    };

    return (
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}>
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
  signatureImage: {
    width: 300,
    height: 150,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  photoWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
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
