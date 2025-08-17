import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  Button,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Collapsible } from '../Collapsible';
import { FieldRenderer } from './fields/FieldRenderer';
import type { FormSection } from './fields/types';
import { useFormState } from './hooks/useFormState';
import { getPhotoFields, validateForm } from './hooks/useValidation';
import { styles } from './styles';
import type { FormRendererProps, FormRendererRef } from './types';
import { getNestedValue, setNestedValue } from './utils/formUtils';

export const FormRenderer = forwardRef<FormRendererRef, FormRendererProps>(
  ({ schema, initialData, readOnly }, ref) => {
    const {
      formState,
      setFormState,
      formErrors,
      setFormErrors,
      instanceIds,
      setInstanceIds,
      instanceNames,
      setInstanceNames,
      activeDateKey,
      setActiveDateKey,
      expandedSections,
      setExpandedSections,
      erroredSections,
      setErroredSections,
      handleChange,
      createEmptySection,
    } = useFormState(schema, initialData);

    const scrollRef = useRef<ScrollView>(null);
    const sectionPositions = useRef<Record<string, number>>({});
    const fieldPositions = useRef<Record<string, number>>({});
    const [modalKey, setModalKey] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      getFormData: () => formState,
      validateForm: () =>
        validateForm(
          schema,
          formState,
          setFormErrors,
          setExpandedSections,
          setErroredSections,
          scrollRef,
          sectionPositions,
        ),
      openSection: (key: string) => {
        setExpandedSections((prev) => {
          const updated = { ...prev };
          const parts = key.split('.');
          for (let i = 1; i <= parts.length; i++) {
            updated[parts.slice(0, i).join('.')] = true;
          }
          return updated;
        });
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
        const sectionParts = parts.slice(0, -1);
        setExpandedSections((prev) => {
          const updated = { ...prev };
          for (let i = 1; i <= sectionParts.length; i++) {
            updated[sectionParts.slice(0, i).join('.')] = true;
          }
          return updated;
        });
        const y = fieldPositions.current[key];
        if (y !== undefined) {
          setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 50);
        }
      },
      getSectionErrorMap: () => erroredSections,
      getPhotoFields: () => getPhotoFields(schema, formState),
    }));

    const addSection = (section: FormSection, path: (string | number)[]) => {
      const key = path.join('.');
      const arr: any[] = getNestedValue(formState, path) ?? [];
      setFormState((prev) => setNestedValue(prev, path, [...arr, createEmptySection(section)]));
      setInstanceIds((prev) => {
        const ids = prev[key] ?? [];
        return { ...prev, [key]: [...ids, uuidv4()] };
      });
      setInstanceNames((prev) => {
        const names = prev[key] ?? [];
        return { ...prev, [key]: [...names, `${section.label} ${names.length + 1}`] };
      });
      setExpandedSections((prev) => ({ ...prev, [`${key}.${arr.length}`]: true }));
      setErroredSections((prev) => ({ ...prev, [`${key}.${arr.length}`]: false }));
    };

    const removeSection = (path: (string | number)[], index: number) => {
      const key = path.join('.');
      setFormState((prev) => {
        const arr: any[] = getNestedValue(prev, path) ?? [];
        return setNestedValue(prev, path, arr.filter((_, i) => i !== index));
      });
      setInstanceIds((prev) => {
        const arr = prev[key] ?? [];
        return { ...prev, [key]: arr.filter((_, i) => i !== index) };
      });
      setInstanceNames((prev) => {
        const arr = prev[key] ?? [];
        return { ...prev, [key]: arr.filter((_, i) => i !== index) };
      });
      const prefix = `${key}.`;
      setExpandedSections((prev) => {
        const updated: Record<string, boolean> = {};
        Object.keys(prev).forEach((k) => {
          if (k.startsWith(prefix)) {
            const rest = k.slice(prefix.length);
            const [idxStr, ...tail] = rest.split('.');
            const idx = parseInt(idxStr, 10);
            if (idx < index) {
              updated[k] = prev[k];
            } else if (idx > index) {
              const newKey = `${key}.${idx - 1}${tail.length ? `.${tail.join('.')}` : ''}`;
              updated[newKey] = prev[k];
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
          if (k.startsWith(prefix)) {
            const rest = k.slice(prefix.length);
            const [idxStr, ...tail] = rest.split('.');
            const idx = parseInt(idxStr, 10);
            if (idx < index) {
              updated[k] = prev[k];
            } else if (idx > index) {
              const newKey = `${key}.${idx - 1}${tail.length ? `.${tail.join('.')}` : ''}`;
              updated[newKey] = prev[k];
            }
          } else {
            updated[k] = prev[k];
          }
        });
        return updated;
      });
    };

    const cloneSection = (section: FormSection, path: (string | number)[], index: number) => {
      const key = path.join('.');
      const empty = createEmptySection(section);
      setFormState((prev) => {
        const arr: any[] = getNestedValue(prev, path) ?? [];
        const original = arr[index] ?? {};
        const copy: Record<string, any> = { ...original };
        section.fields.forEach((f) => {
          if (f.type === 'photo' || f.type === 'signature' || f.type === 'imageSelect') {
            copy[f.key] = empty[f.key];
          }
        });
        const newArr = [...arr];
        newArr.splice(index + 1, 0, copy);
        return setNestedValue(prev, path, newArr);
      });
      setInstanceIds((prev) => {
        const arr = prev[key] ?? [];
        const newArr = [...arr];
        newArr.splice(index + 1, 0, uuidv4());
        return { ...prev, [key]: newArr };
      });
      setInstanceNames((prev) => {
        const arr = prev[key] ?? [];
        const newArr = [...arr];
        newArr.splice(index + 1, 0, `${section.label} ${arr.length + 1}`);
        return { ...prev, [key]: newArr };
      });
      const prefix = `${key}.`;
      setExpandedSections((prev) => {
        const updated: Record<string, boolean> = {};
        Object.keys(prev).forEach((k) => {
          if (k.startsWith(prefix)) {
            const rest = k.slice(prefix.length);
            const [idxStr, ...tail] = rest.split('.');
            const idx = parseInt(idxStr, 10);
            if (idx <= index) {
              updated[k] = prev[k];
            } else {
              const newKey = `${key}.${idx + 1}${tail.length ? `.${tail.join('.')}` : ''}`;
              updated[newKey] = prev[k];
            }
          } else {
            updated[k] = prev[k];
          }
        });
        updated[`${key}.${index + 1}`] = true;
        return updated;
      });
      setErroredSections((prev) => {
        const updated: Record<string, boolean> = {};
        Object.keys(prev).forEach((k) => {
          if (k.startsWith(prefix)) {
            const rest = k.slice(prefix.length);
            const [idxStr, ...tail] = rest.split('.');
            const idx = parseInt(idxStr, 10);
            if (idx <= index) {
              updated[k] = prev[k];
            } else {
              const newKey = `${key}.${idx + 1}${tail.length ? `.${tail.join('.')}` : ''}`;
              updated[newKey] = prev[k];
            }
          } else {
            updated[k] = prev[k];
          }
        });
        updated[`${key}.${index + 1}`] = false;
        return updated;
      });
    };

    const renderFields = (
      fields: FormSection['fields'],
      basePath: (string | number)[],
      row: Record<string, any>,
    ) =>
      fields.map((f) => {
        const fieldPath = [...basePath, f.key];
        const pathKey = fieldPath.join('.');
        if (f.type === 'section') {
          return renderSection(f, fieldPath);
        }
        return (
          <FieldRenderer
            key={pathKey}
            field={f}
            path={fieldPath}
            formState={formState}
            localContext={row}
            activeDateKey={activeDateKey}
            setActiveDateKey={setActiveDateKey}
            handleChange={handleChange}
            error={formErrors[pathKey]}
            registerFieldPosition={(k, y) => {
              fieldPositions.current[k] = y;
            }}
            readOnly={readOnly}
          />
        );
      });

    const renderSection = (section: FormSection, path: (string | number)[]) => {
      const key = path.join('.');
      if (section.repeatable) {
        const entries: Record<string, any>[] = getNestedValue(formState, path) ?? [];
        const ids = instanceIds[key] ?? [];
        return (
          <View key={key} style={styles.sectionContainer}>
            <View style={styles.repeatableHeader}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              {!readOnly && (
                <Button
                  title={`Add`}
                  onPress={() => addSection(section, path)}
                />
              )}
            </View>
            {entries.map((row, idx) => {
              const entryPath = [...path, idx];
              const entryKey = `${key}.${idx}`;
              const title = instanceNames[key]?.[idx] ?? `${section.label} ${idx + 1}`;
              if (section.useModal) {
                return (
                  <View key={ids[idx] ?? entryKey} style={styles.sectionContainer}>
                    <View style={styles.repeatableActions}>
                      <Button title={title} onPress={() => setModalKey(entryKey)} />
                      {!readOnly && (
                        <>
                          <Button
                            title="Copy"
                            onPress={() => cloneSection(section, path, idx)}
                          />
                          <Button title="Remove" onPress={() => removeSection(path, idx)} />
                        </>
                      )}
                    </View>
                    {modalKey === entryKey && (
                      <Modal transparent visible onRequestClose={() => setModalKey(null)}>
                        <TouchableOpacity
                          style={styles.modalOverlay}
                          activeOpacity={1}
                          onPress={() => setModalKey(null)}
                        >
                          <View style={styles.modalContent}>
                            <ScrollView>
                              {renderFields(section.fields, entryPath, row)}
                              {!readOnly && (
                                <Button title="Close" onPress={() => setModalKey(null)} />
                              )}
                            </ScrollView>
                          </View>
                        </TouchableOpacity>
                      </Modal>
                    )}
                  </View>
                );
              }
              return (
                <Collapsible
                  key={ids[idx] ?? entryKey}
                  title={title}
                  isOpen={expandedSections[entryKey]}
                  onToggle={(open) =>
                    setExpandedSections((prev) => ({ ...prev, [entryKey]: open }))
                  }
                  hasError={erroredSections[entryKey]}
                  onLayout={(e) => {
                    sectionPositions.current[entryKey] = e.nativeEvent.layout.y;
                  }}
                >
                  <View style={styles.sectionContent}>
                    {!readOnly && (
                      <View style={styles.repeatableActions}>
                        <Button
                          title="Copy"
                          onPress={() => cloneSection(section, path, idx)}
                        />
                        <Button title="Remove" onPress={() => removeSection(path, idx)} />
                      </View>
                    )}
                    {renderFields(section.fields, entryPath, row)}
                  </View>
                </Collapsible>
              );
            })}
          </View>
        );
      }

      const row: Record<string, any> = getNestedValue(formState, path) ?? {};
      if (section.useModal) {
        return (
          <View key={key} style={styles.sectionContainer}>
            <Button
              title={section.label}
              onPress={() => setModalKey(key)}
              onLayout={(e) => {
                sectionPositions.current[key] = e.nativeEvent.layout.y;
              }}
            />
            {modalKey === key && (
              <Modal transparent visible onRequestClose={() => setModalKey(null)}>
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setModalKey(null)}
                >
                  <View style={styles.modalContent}>
                    <Text style={styles.sectionLabel}>{section.label}</Text>
                    <ScrollView>{renderFields(section.fields, path, row)}</ScrollView>
                    {!readOnly && <Button title="Close" onPress={() => setModalKey(null)} />}
                  </View>
                </TouchableOpacity>
              </Modal>
            )}
          </View>
        );
      }
      return (
        <Collapsible
          key={key}
          title={section.label}
          isOpen={expandedSections[key]}
          onToggle={(open) => setExpandedSections((prev) => ({ ...prev, [key]: open }))}
          hasError={erroredSections[key]}
          onLayout={(e) => {
            sectionPositions.current[key] = e.nativeEvent.layout.y;
          }}
        >
          {renderFields(section.fields, path, row)}
        </Collapsible>
      );
    };

    return (
      <>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.container}>
          {schema.map((section) => renderSection(section, [section.key]))}
        </ScrollView>
      </>
    );
  },
);

FormRenderer.displayName = 'FormRenderer';

export { FormRendererProps, FormRendererRef } from './types';
export default FormRenderer;

