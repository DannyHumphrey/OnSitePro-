import { getInstance, saveSection, transitionInstance } from "@/api/formsApi";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { getToken } from "@/services/authService";
import { getInstanceSmart } from "@/services/offlineHelpers/getInstanceSmart";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyPatch } from "fast-json-patch";
import jwtDecode from "jwt-decode";
import { useEffect, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { Appbar, Button } from "react-native-paper";
import { v4 as uuidv4 } from "uuid";
import { InstanceFormRenderer } from "../components/formRenderer/InstnaceFormRenderer";

export default function FormInstanceScreen({ route, navigation }: any) {
  const { id, sectionKey: initialSection } = route.params;
  const [instance, setInstance] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string | undefined>(
    initialSection
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const isOnline = useNetworkStatus();
  const queueKey = `queue:form:${id}`;

  useEffect(() => {
    (async () => {
      const inst = await getInstanceSmart(id);
      setInstance(inst);
      const token = await getToken();
      if (token) {
        try {
          const decoded = jwtDecode<{
            ["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]?: string[];
          }>(token);
          if (
            decoded[
              "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ]
          )
            setUserRoles(
              decoded[
                "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
              ]
            );
        } catch {}
      }
    })();
  }, [id]);

  const workflow = instance?.workflow || {};
  const schema = instance?.schema || [];

  const editableSections: string[] = useMemo(() => {
    const secs = Array.isArray(workflow.sections) ? workflow.sections : [];
    return secs
      .filter(
        (s: any) =>
          (!Array.isArray(s.visibleIn) ||
            s.visibleIn.includes(instance?.currentState)) &&
          Array.isArray(s.rolesCanEdit) &&
          s.rolesCanEdit.some((r: string) => userRoles.includes(r))
      )
      .map((s: any) => s.key);
  }, [workflow, instance, userRoles]);

  useEffect(() => {
    if (!activeSection && editableSections.length)
      setActiveSection(editableSections[0]);
  }, [editableSections, activeSection]);

  async function enqueueSave(item: any) {
    const raw = await AsyncStorage.getItem(queueKey);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(item);
    await AsyncStorage.setItem(queueKey, JSON.stringify(arr));
  }

  async function drainQueue() {
    const raw = await AsyncStorage.getItem(queueKey);
    let queue = raw ? (JSON.parse(raw) as any[]) : [];
    while (queue.length) {
      const item = queue[0];
      try {
        const updated = await saveSection({ id, ...item });
        queue.shift();
        await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
        setInstance({
          ...updated,
          data: updated.data,
          currentState: updated.state,
          etag: updated.etag,
        });
      } catch (e: any) {
        if (e.message === "Version conflict") {
          const latest = await getInstance(id);
          setInstance(latest);
          item.etag = latest.etag;
          await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
        } else {
          break;
        }
      }
    }
  }

  useEffect(() => {
    if (isOnline) {
      drainQueue().catch(() => {});
    }
  }, [isOnline]);

  function localUpdate(path: (string | number)[], value: any) {
    setInstance((prev: any) => {
      if (!prev) return prev;
      const data = { ...(prev.data || {}) };
      let curr: any = data;
      for (let i = 0; i < path.length - 1; i++) {
        const key = String(path[i]);
        curr[key] = curr[key] ? { ...curr[key] } : {};
        curr = curr[key];
      }
      curr[String(path[path.length - 1])] = value;
      return { ...prev, data };
    });
  }

  const availableTransitions = useMemo(() => {
    const t = Array.isArray(workflow.transitions) ? workflow.transitions : [];
    return t.filter(
      (x: any) =>
        (x.from ? x.from === instance?.currentState : true) &&
        (!Array.isArray(x.roles) ||
          x.roles.some((r: string) => userRoles.includes(r)))
    );
  }, [workflow, instance, userRoles]);

  async function handleTransition(transitionKey: string) {
    try {
      const res = await transitionInstance({
        id,
        transitionKey,
        etag: instance.etag,
      });
      setInstance(res);
    } catch (e: any) {
      if (e.message === "Version conflict") {
        const latest = await getInstance(id);
        setInstance(latest);
        Alert.alert("Updated", "Version conflict. Reloaded latest.");
      } else {
        Alert.alert("Transition failed", String(e));
      }
    }
  }

  async function onPatch(sectionKey: string, patch: any[]) {
    if (!instance) return;
    const idem = uuidv4();

    // optimistic local apply so UI feels instant
    try {
      const nextDoc = applyPatch(
        instance.data || {},
        patch,
        /*validate*/ false
      ).newDocument;
      setInstance((prev: any) => ({ ...prev, data: nextDoc }));
    } catch {
      // non-fatal if patch library not perfect for some paths
    }

    if (isOnline && editableSections.includes(sectionKey)) {
      try {
        const updated = await saveSection({
          id,
          sectionKey,
          patch,
          etag: instance.etag,
          idempotencyKey: idem,
        });
        setInstance({
          ...instance,
          data: updated.data,
          currentState: updated.state,
          etag: updated.etag,
        });
        // handle validation if you want (same as before)
      } catch (e: any) {
        if (e.message === "Version conflict") {
          const latest = await getInstance(id);
          setInstance(latest);
          Alert.alert(
            "Updated",
            "This form was updated elsewhere. Showing latest."
          );
        } else {
          Alert.alert("Save failed", String(e));
        }
      }
    } else {
      // offline: enqueue with the *current* etag
      await enqueueSave({
        sectionKey,
        patch,
        etag: instance.etag,
        idempotencyKey: idem,
      });
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={instance?.formType ?? "Form"} />
      </Appbar.Header>

      <InstanceFormRenderer
        schema={schema}
        data={instance?.data || {}}
        editableSections={editableSections}
        onPatch={onPatch}
      />

      <View style={{ padding: 12 }}>
        {availableTransitions.map((t: any) => (
          <Button
            key={t.key}
            mode="contained"
            style={{ marginBottom: 8 }}
            onPress={() => handleTransition(t.key)}
          >
            {t.key}
          </Button>
        ))}
      </View>
    </View>
  );
}
