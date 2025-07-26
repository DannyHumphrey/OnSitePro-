import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Button, ScrollView, Text, View, Modal, TextInput, TouchableOpacity } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Collapsible } from '../Collapsible';
import { FieldRenderer } from './fields/FieldRenderer';
import { useFormState } from './hooks/useFormState';
import { getPhotoFields, validateForm } from './hooks/useValidation';
import { styles } from './styles';
import type { FormRendererProps, FormRendererRef } from './types';

export const FormRenderer = forwardRef<FormRendererRef, FormRendererProps>(
  ({ schema, initialData, readOnly }, ref) => {
    const {
      formState,
      formErrors,
      setFormState,
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
    const [renameInfo, setRenameInfo] = useState<{ key: string; idx: number } | null>(null);
    const [renameValue, setRenameValue] = useState('');

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
      getPhotoFields: () => getPhotoFields(schema, formState),
    }));

    const addSection = (sectionKey: string, sectionIndex: number) => {
      setFormState((prev) => {
        const arr = (prev[sectionKey] as any[]) ?? [];
        return { ...prev, [sectionKey]: [...arr, createEmptySection(schema.find((s) => s.key === sectionKey)!)] };
      });
      setInstanceIds((prev) => {
        const ids = prev[sectionKey] ?? [];
        return { ...prev, [sectionKey]: [...ids, uuidv4()] };
      });
      setInstanceNames((prev) => {
        const names = prev[sectionKey] ?? [];
        return {
          ...prev,
          [sectionKey]: [...names, `${schema.find((s) => s.key === sectionKey)!.label} ${names.length + 1}`],
        };
      });
      setExpandedSections((prev) => ({ ...prev, [`${sectionKey}.${sectionIndex}`]: true }));
      setErroredSections((prev) => ({ ...prev, [`${sectionKey}.${sectionIndex}`]: false }));
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
      setInstanceNames((prev) => {
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

    const cloneSection = (key: string, index: number) => {
      const section = schema.find((s) => s.key === key);
      if (!section) return;
      const empty = createEmptySection(section);
      setFormState((prev) => {
        const arr = (prev[key] as any[]) ?? [];
        const original = arr[index] ?? {};
        const copy: Record<string, any> = { ...original };
        section.fields.forEach((f) => {
          if (f.type === 'photo' || f.type === 'signature' || f.type === 'imageSelect') {
            copy[f.key] = empty[f.key];
          }
        });
        const newArr = [...arr];
        newArr.splice(index + 1, 0, copy);
        return { ...prev, [key]: newArr };
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
      setExpandedSections((prev) => {
        const updated: Record<string, boolean> = {};
        Object.keys(prev).forEach((k) => {
          if (k.startsWith(`${key}.`)) {
            const idx = parseInt(k.split('.')[1], 10);
            if (idx <= index) {
              updated[k] = prev[k];
            } else {
              updated[`${key}.${idx + 1}`] = prev[k];
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
          if (k.startsWith(`${key}.`)) {
            const idx = parseInt(k.split('.')[1], 10);
            if (idx <= index) {
              updated[k] = prev[k];
            } else {
              updated[`${key}.${idx + 1}`] = prev[k];
            }
          } else {
            updated[k] = prev[k];
          }
        });
        updated[`${key}.${index + 1}`] = false;
        return updated;
      });
    };

    const renderSection = (section: (typeof schema)[number]) => {
      if (section.repeatable) {
        const entries: Record<string, any>[] = formState[section.key] ?? [];
        const ids = instanceIds[section.key] ?? [];
        return (
          <View key={section.key} style={styles.sectionContainer}>
            <View style={styles.repeatableHeader}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <Button title={`Add ${section.label}`} onPress={() => addSection(section.key, entries.length)} />
            </View>
            {entries.map((row, idx) => (
              <Collapsible
                key={ids[idx] ?? `${section.key}-${idx}`}
                title={instanceNames[section.key]?.[idx] ?? `${section.label} ${idx + 1}`}
                isOpen={expandedSections[`${section.key}.${idx}`]}
                onToggle={(open) =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    [`${section.key}.${idx}`]: open,
                  }))
                }
                hasError={erroredSections[`${section.key}.${idx}`]}
                onLayout={(e) => {
                  sectionPositions.current[`${section.key}.${idx}`] = e.nativeEvent.layout.y;
                }}
              >
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
                      error={formErrors[`${section.key}.${idx}.${f.key}`]}
                      registerFieldPosition={(k, y) => {
                        fieldPositions.current[k] = y;
                      }}
                      readOnly={readOnly}
                    />
                  ))}
                  <Button title="Rename" onPress={() => {
                    setRenameValue(instanceNames[section.key]?.[idx] ?? `${section.label} ${idx + 1}`);
                    setRenameInfo({ key: section.key, idx });
                  }} />
                  <Button title="Copy" onPress={() => cloneSection(section.key, idx)} />
                  <Button title="Remove" onPress={() => removeSection(section.key, idx)} />
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
          onToggle={(open) => setExpandedSections((prev) => ({ ...prev, [section.key]: open }))}
          hasError={erroredSections[section.key]}
          onLayout={(e) => {
            sectionPositions.current[section.key] = e.nativeEvent.layout.y;
          }}
        >
          {section.fields.map((f) => (
            <FieldRenderer
              key={`${section.key}-${f.key}`}
              field={f}
              path={[section.key, f.key]}
              formState={formState}
              activeDateKey={activeDateKey}
              setActiveDateKey={setActiveDateKey}
              handleChange={handleChange}
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
      <>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.container}>
          {schema.map((section) => renderSection(section))}
        </ScrollView>
        {renameInfo && (
          <Modal transparent visible onRequestClose={() => setRenameInfo(null)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRenameInfo(null)}>
              <View style={styles.modalContent}>
                <Text style={styles.sectionLabel}>Rename Section</Text>
                <TextInput
                  value={renameValue}
                  onChangeText={setRenameValue}
                  style={styles.textInput}
                  placeholder="Section Name"
                />
                <Button
                  title="Save"
                  onPress={() => {
                    if (renameInfo) {
                      setInstanceNames((prev) => {
                        const arr = prev[renameInfo.key] ?? [];
                        const newArr = [...arr];
                        newArr[renameInfo.idx] = renameValue;
                        return { ...prev, [renameInfo.key]: newArr };
                      });
                    }
                    setRenameInfo(null);
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </>
    );
  },
);

FormRenderer.displayName = 'FormRenderer';

export { FormRendererProps, FormRendererRef } from './types';
export default FormRenderer;
