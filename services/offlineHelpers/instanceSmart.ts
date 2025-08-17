import { createInstance } from "@/api/formsApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveDraft } from "../draftService";
import { K } from "./keys";
import { getFormTemplatesCached } from "./templatesCache";
import type { CreateJob, LocalInstanceMeta } from "./types";

function uuidv4(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createInstanceSmart(
  formType: string,
  formVersion?: number | null,
  initialData: any = {},
  isOnline: boolean = true
): Promise<LocalInstanceMeta> {
  const idempotencyKey = uuidv4();

  if (isOnline) {
    const created = await createInstance(
      formType,
      formVersion ?? undefined,
      initialData,
      idempotencyKey
    );
    const meta: LocalInstanceMeta = {
      id: String(created.formInstanceId),
      formType,
      formVersion: (created as any).formVersion ?? formVersion ?? null,
      formDefinitionId: created.formDefinitionId ?? null,
      currentState: created.currentState,
      version: created.version,
      etag: created.etag,
      isLocal: false,
      createdAt: new Date().toISOString(),
      schema: "",
    };
    await AsyncStorage.setItem(K.InstanceMeta(meta.id), JSON.stringify(meta));
    await AsyncStorage.setItem(
      K.InstanceData(meta.id),
      JSON.stringify(created.data || {})
    );
    saveDraft(meta.id);
    return meta;
  }

  const tmpId = `tmp_${uuidv4()}`;
  let currentState = "draft";
  try {
    const defs = await getFormTemplatesCached(false);
    const def = defs.find(
      (d: any) =>
        d.formType === formType &&
        (formVersion == null || d.version === formVersion)
    );
    const wf = def?.workflow || {};
    currentState = wf.initial || wf.initialState || wf.start || currentState;
  } catch {}

  const meta: LocalInstanceMeta = {
    id: tmpId,
    formType,
    formVersion: formVersion ?? null,
    formDefinitionId: null,
    currentState,
    version: 0,
    etag: "",
    isLocal: true,
    createdAt: new Date().toISOString(),
    schema: "",
  };

  await AsyncStorage.setItem(K.InstanceMeta(tmpId), JSON.stringify(meta));
  await AsyncStorage.setItem(
    K.InstanceData(tmpId),
    JSON.stringify(initialData || {})
  );
  saveDraft(tmpId);

  const job: CreateJob = {
    tmpId,
    formType,
    formVersion: formVersion ?? null,
    initialData,
    idempotencyKey,
  };
  const raw = await AsyncStorage.getItem(K.CreateQueue);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push(job);
  await AsyncStorage.setItem(K.CreateQueue, JSON.stringify(queue));
  await AsyncStorage.setItem(K.PatchQueue(tmpId), JSON.stringify([]));

  return meta;
}
