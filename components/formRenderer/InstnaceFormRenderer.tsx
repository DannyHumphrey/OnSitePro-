import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { v4 as uuidv4 } from "uuid";
import { Collapsible } from "../Collapsible";
import { FieldRenderer } from "./fields/FieldRenderer";
import type { FormSection } from "./fields/types";
import { styles } from "./styles";
import { getNestedValue } from "./utils/formUtils";

function createEmptySection(section: FormSection): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const f of section.fields) {
    switch (f.type) {
      case "multiselect":
      case "imageSelect":
      case "photo":
        obj[f.key] = [];
        break;
      case "signature":
        obj[f.key] = null;
        break;
      default:
        obj[f.key] = null;
    }
  }
  return obj;
}

const escapePtr = (s: string) => s.replace(/~/g, "~0").replace(/\//g, "~1");
const ptrFromPath = (path: (string | number)[]) =>
  "/" + path.map((p) => escapePtr(String(p))).join("/");

export type InstanceFormRendererProps = {
  schema: FormSection[]; // your existing section/field schema array
  data: any; // instance.data
  editableSections: string[]; // which sections are editable in current state/role
  readOnlyGlobal?: boolean; // optional global read-only
  onPatch: (sectionKey: string, patch: any[]) => Promise<void>; // caller handles API/ETag/queue
};
const DEBOUNCE_MS = 250;

export const InstanceFormRenderer = ({
  schema,
  data,
  editableSections,
  readOnlyGlobal = false,
  onPatch,
}: InstanceFormRendererProps) => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [modalKey, setModalKey] = useState<string | null>(null);

  // Stable IDs for repeatable entries so keys don't flicker
  const instanceIdsRef = useRef<Record<string, string[]>>({});

  const registerIds = (sectionPathKey: string, count: number) => {
    const existing = instanceIdsRef.current[sectionPathKey] ?? [];
    if (existing.length === count) return existing;
    const next = [...existing];
    while (next.length < count) next.push(uuidv4());
    if (next.length > count) next.length = count;
    instanceIdsRef.current[sectionPathKey] = next;
    return next;
  };

  const pendingRef = useRef<Map<string, { timer: any; ops: Map<string, any> }>>(
    new Map()
  );

  const flushSection = useCallback(
    async (sectionKey: string) => {
      const entry = pendingRef.current.get(sectionKey);
      if (!entry || entry.ops.size === 0) return;
      if (entry.timer) clearTimeout(entry.timer);
      pendingRef.current.delete(sectionKey);

      const patch = Array.from(entry.ops.entries()).map(([path, value]) => ({
        op: "add",
        path,
        value,
      }));
      await onPatch(sectionKey, patch);
    },
    [onPatch]
  );

  const scheduleFieldChange = useCallback(
    (sectionKey: string, path: (string | number)[], value: any) => {
      const ptr = ptrFromPath(path);
      let entry = pendingRef.current.get(sectionKey);
      if (!entry) {
        entry = { timer: null, ops: new Map() };
        pendingRef.current.set(sectionKey, entry);
      }
      // coalesce to "last write wins" per field path
      entry.ops.set(ptr, value);

      if (entry.timer) clearTimeout(entry.timer);
      entry.timer = setTimeout(() => {
        // fire-and-forget; caller handles errors/etag
        flushSection(sectionKey).catch(() => {});
      }, DEBOUNCE_MS);
    },
    [flushSection]
  );

  // flush everything on unmount
  useEffect(() => {
    return () => {
      const entries = Array.from(pendingRef.current.keys());
      entries.forEach((k) => {
        const e = pendingRef.current.get(k);
        if (e?.timer) clearTimeout(e.timer);
      });
      // optional: last-second flush (best-effort)
      // entries.forEach(k => flushSection(k).catch(()=>{}));
    };
  }, [flushSection]);

  const renderFields = (
    fields: FormSection["fields"],
    basePath: (string | number)[],
    row: Record<string, any>,
    sectionKey: string,
    sectionReadOnly: boolean
  ) =>
    fields.map((f) => {
      const fieldPath = [...basePath, f.key];
      const key = fieldPath.join(".");
      if (f.type === "section") {
        // Nested sections supported
        return renderSection(f, fieldPath);
      }
      return (
        <FieldRenderer
          key={key}
          field={f}
          path={fieldPath}
          formState={data}
          localContext={row}
          activeDateKey={null}
          setActiveDateKey={() => {}}
          handleChange={async (path, value) => {
            if (sectionReadOnly) return;
            scheduleFieldChange(sectionKey, path, value);
          }}
          error={undefined}
          registerFieldPosition={() => {}}
          readOnly={sectionReadOnly}
        />
      );
    });

  const renderSection = (section: FormSection, path: (string | number)[]) => {
    const sectionKey = String(path[0]);
    const sectionReadOnly =
      readOnlyGlobal || !editableSections.includes(sectionKey);
    const key = path.join(".");

    // REPEATABLE
    if (section.repeatable) {
      const entries: Record<string, any>[] = getNestedValue(data, path) ?? [];
      const ids = registerIds(key, entries.length);

      const addEntry = async () => {
        await flushSection(sectionKey); // ensure field edits land first
        const empty = createEmptySection(section);
        const patch = [
          { op: "add", path: `/${escapePtr(sectionKey)}/-`, value: empty },
        ];
        await onPatch(sectionKey, patch);
      };

      const removeEntry = async (index: number) => {
        await flushSection(sectionKey);
        const patch = [
          { op: "remove", path: `/${escapePtr(sectionKey)}/${index}` },
        ];
        await onPatch(sectionKey, patch);
      };

      const cloneEntry = async (index: number) => {
        await flushSection(sectionKey);
        const orig: Record<string, any> = entries[index] ?? {};
        const copy: Record<string, any> = { ...orig };
        section.fields.forEach((f) => {
          if (
            f.type === "photo" ||
            f.type === "signature" ||
            f.type === "imageSelect"
          ) {
            copy[f.key] = createEmptySection(section)[f.key];
          }
        });
        const patch = [
          {
            op: "add",
            path: `/${escapePtr(sectionKey)}/${index + 1}`,
            value: copy,
          },
        ];
        await onPatch(sectionKey, patch);
      };

      return (
        <View key={key} style={styles.sectionContainer}>
          <View style={styles.repeatableHeader}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            {!sectionReadOnly && <Button title="Add" onPress={addEntry} />}
          </View>

          {entries.map((row, idx) => {
            const entryPath = [...path, idx];
            const entryKey = `${key}.${idx}`;
            const title = `${section.label} ${idx + 1}`;

            if (section.useModal) {
              return (
                <View
                  key={ids[idx] ?? entryKey}
                  style={styles.sectionContainer}
                >
                  <View style={styles.repeatableActions}>
                    <Button
                      title={title}
                      onPress={() => setModalKey(entryKey)}
                    />
                    {!sectionReadOnly && (
                      <>
                        <Button title="Copy" onPress={() => cloneEntry(idx)} />
                        <Button
                          title="Remove"
                          onPress={() => removeEntry(idx)}
                        />
                      </>
                    )}
                  </View>

                  {modalKey === entryKey && (
                    <Modal
                      transparent
                      visible
                      onRequestClose={() => setModalKey(null)}
                    >
                      <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setModalKey(null)}
                      >
                        <View style={styles.modalContent}>
                          <ScrollView>
                            {renderFields(
                              section.fields,
                              entryPath,
                              row,
                              sectionKey,
                              sectionReadOnly
                            )}
                            {!sectionReadOnly && (
                              <Button
                                title="Close"
                                onPress={() => setModalKey(null)}
                              />
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
                isOpen={!!expandedSections[entryKey]}
                onToggle={(open) =>
                  setExpandedSections((prev) => ({ ...prev, [entryKey]: open }))
                }
                hasError={false}
                onLayout={() => {}}
              >
                <View style={styles.sectionContent}>
                  {!sectionReadOnly && (
                    <View style={styles.repeatableActions}>
                      <Button title="Copy" onPress={() => cloneEntry(idx)} />
                      <Button title="Remove" onPress={() => removeEntry(idx)} />
                    </View>
                  )}
                  {renderFields(
                    section.fields,
                    entryPath,
                    row,
                    sectionKey,
                    sectionReadOnly
                  )}
                </View>
              </Collapsible>
            );
          })}
        </View>
      );
    }

    // NON-REPEATABLE
    const row: Record<string, any> = getNestedValue(data, path) ?? {};
    if (section.useModal) {
      return (
        <View key={key} style={styles.sectionContainer}>
          <Button title={section.label} onPress={() => setModalKey(key)} />
          {modalKey === key && (
            <Modal transparent visible onRequestClose={() => setModalKey(null)}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setModalKey(null)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.sectionLabel}>{section.label}</Text>
                  <ScrollView>
                    {renderFields(
                      section.fields,
                      path,
                      row,
                      sectionKey,
                      sectionReadOnly
                    )}
                  </ScrollView>
                  {!sectionReadOnly && (
                    <Button title="Close" onPress={() => setModalKey(null)} />
                  )}
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
        isOpen={!!expandedSections[key]}
        onToggle={(open) =>
          setExpandedSections((prev) => ({ ...prev, [key]: open }))
        }
        hasError={false}
        onLayout={() => {}}
      >
        {renderFields(section.fields, path, row, sectionKey, sectionReadOnly)}
      </Collapsible>
    );
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {schema.map((section) => renderSection(section, [section.key]))}
    </ScrollView>
  );
};
