import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { ScrollView, View, Button, Text } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { FieldRenderer } from './fields/FieldRenderer';
import type { FormRendererRef, FormRendererProps } from './types';
import { useFormState } from './hooks/useFormState';
import { validateForm, getPhotoFields } from './hooks/useValidation';
import { styles } from './styles';
import { Collapsible } from '../Collapsible';

export const FormRenderer = forwardRef<FormRendererRef, FormRendererProps>(
  ({ schema, initialData, readOnly }, ref) => {
    const {
      formState,
      setFormState,
      formErrors,
      setFormErrors,
      instanceIds,
      setInstanceIds,
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
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {schema.map((section) => renderSection(section))}
      </ScrollView>
    );
  },
);

FormRenderer.displayName = 'FormRenderer';

export { FormRendererRef, FormRendererProps } from './types';
export default FormRenderer;
