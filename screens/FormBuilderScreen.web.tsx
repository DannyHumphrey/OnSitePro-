import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Checkbox } from 'react-native-paper';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { isDesktop } from 'react-device-detect';

type BuilderField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
};

const palette = [
  { id: 'text', type: 'text', label: 'Text' },
  { id: 'number', type: 'number', label: 'Number' },
  { id: 'date', type: 'date', label: 'Date' },
];

function PaletteItem({ item }: { item: { id: string; type: string; label: string } }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { from: 'palette', type: item.type },
  });
  const style = {
    transform: transform
      ? [{ translateX: transform.x }, { translateY: transform.y }]
      : undefined,
    opacity: isDragging ? 0.5 : 1,
  } as const;
  return (
    <View ref={setNodeRef} {...attributes} {...listeners} style={[styles.paletteItem, style]}>
      <Text>{item.label}</Text>
    </View>
  );
}

function SortableField({
  field,
  update,
}: {
  field: BuilderField;
  update: (id: string, patch: Partial<BuilderField>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: field.id,
    data: { from: 'form' },
  });
  const style = {
    transform: transform
      ? [{ translateX: transform.x }, { translateY: transform.y }]
      : undefined,
    zIndex: isDragging ? 100 : 0,
  } as const;
  return (
    <View ref={setNodeRef} style={[styles.formItem, style]}> 
      <View {...attributes} {...listeners}>
        <Text style={styles.formItemType}>{field.type}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={field.label}
        onChangeText={(text) => update(field.id, { label: text })}
        placeholder="Label"
      />
      <View style={styles.checkboxRow}>
        <Checkbox
          status={field.required ? 'checked' : 'unchecked'}
          onPress={() => update(field.id, { required: !field.required })}
        />
        <Text>Required</Text>
      </View>
    </View>
  );
}

export default function FormBuilderScreen() {
  const [fields, setFields] = useState<BuilderField[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));
  const { setNodeRef } = useDroppable({ id: 'form' });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.from === 'palette') {
      const template = palette.find((p) => p.id === active.id);
      if (template) {
        const newField: BuilderField = {
          id: uuidv4(),
          type: template.type,
          label: template.label,
          required: false,
        };
        setFields((prev) => {
          const newFields = [...prev];
          if (over.id === 'form') {
            newFields.push(newField);
          } else {
            const index = prev.findIndex((f) => f.id === over.id);
            if (index >= 0) newFields.splice(index, 0, newField);
            else newFields.push(newField);
          }
          return newFields;
        });
      }
    } else if (active.data.current?.from === 'form') {
      if (over.id === active.id) return;
      setFields((prev) => {
        const oldIndex = prev.findIndex((f) => f.id === active.id);
        const newIndex =
          over.id === 'form' ? prev.length - 1 : prev.findIndex((f) => f.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const updateField = (id: string, patch: Partial<BuilderField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  if (!isDesktop) {
    return (
      <View style={styles.center}>
        <Text>Form builder is only available on desktop.</Text>
      </View>
    );
  }

  const schema = fields.map(({ id, label, type, required }) => ({
    id,
    label,
    type,
    required,
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <View style={styles.builder}>
          <View style={styles.palette}>
            <Text style={styles.heading}>Fields</Text>
            {palette.map((p) => (
              <PaletteItem key={p.id} item={p} />
            ))}
          </View>
          <View style={styles.form} ref={setNodeRef}>
            <Text style={styles.heading}>Form Layout</Text>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field) => (
                <SortableField key={field.id} field={field} update={updateField} />
              ))}
            </SortableContext>
          </View>
        </View>
      </DndContext>
      <View style={styles.preview}>
        <Text style={styles.heading}>JSON Preview</Text>
        <JsonView src={schema} editable={false} enableClipboard={false} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  builder: { flexDirection: 'row', gap: 16 },
  palette: {
    width: 200,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    gap: 8,
  },
  paletteItem: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  form: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    minHeight: 200,
    gap: 8,
  },
  formItem: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fafafa',
    gap: 8,
  },
  formItemType: { fontWeight: 'bold', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 4,
    borderRadius: 4,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  heading: { fontWeight: 'bold', marginBottom: 8 },
  preview: { marginTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});
