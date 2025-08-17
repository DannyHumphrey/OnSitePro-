import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInstance, saveSection, getInstance } from '@/api/formsApi';
import { K } from './keys';
import type { CreateJob, LocalInstanceMeta } from './types';

async function drainPatchQueue(id: number, meta: LocalInstanceMeta) {
  const pqKey = K.PatchQueue(id);
  let raw = await AsyncStorage.getItem(pqKey);
  let queue = raw ? JSON.parse(raw) : [];
  while (queue.length) {
    const item = queue[0];
    try {
      const updated = await saveSection({
        id,
        sectionKey: item.sectionKey,
        patch: item.patch,
        etag: meta.etag,
        idempotencyKey: item.idempotencyKey,
      });
      meta.etag = updated.etag;
      meta.version = updated.version;
      meta.currentState = (updated as any).state ?? meta.currentState;
      await AsyncStorage.setItem(K.InstanceMeta(id), JSON.stringify(meta));
      await AsyncStorage.setItem(K.InstanceData(id), JSON.stringify(updated.data || {}));
      queue.shift();
      raw = JSON.stringify(queue);
      await AsyncStorage.setItem(pqKey, raw);
    } catch (e: any) {
      if (e.message === 'Version conflict') {
        const latest = await getInstance(id);
        meta.etag = latest.etag;
        meta.version = latest.version;
        meta.currentState = latest.currentState;
        await AsyncStorage.setItem(K.InstanceMeta(id), JSON.stringify(meta));
        await AsyncStorage.setItem(K.InstanceData(id), JSON.stringify(latest.data || {}));
      } else {
        break;
      }
    }
  }
}

export async function syncOnce() {
  const raw = await AsyncStorage.getItem(K.CreateQueue);
  let queue: CreateJob[] = raw ? JSON.parse(raw) : [];
  while (queue.length) {
    const job = queue[0];
    try {
      const created = await createInstance(
        job.formType,
        job.formVersion ?? undefined,
        job.initialData,
        job.idempotencyKey,
      );
      const serverId = created.formInstanceId;
      await AsyncStorage.setItem(K.IdMap(job.tmpId), String(serverId));

      const metaRaw = await AsyncStorage.getItem(K.InstanceMeta(job.tmpId));
      const dataRaw = await AsyncStorage.getItem(K.InstanceData(job.tmpId));
      const meta: LocalInstanceMeta = metaRaw
        ? {
            ...(JSON.parse(metaRaw) as LocalInstanceMeta),
            id: String(serverId),
            isLocal: false,
            etag: created.etag,
            version: created.version,
            currentState: created.currentState,
            formDefinitionId: created.formDefinitionId ?? null,
          }
        : {
            id: String(serverId),
            formType: job.formType,
            formVersion: job.formVersion ?? null,
            formDefinitionId: created.formDefinitionId ?? null,
            currentState: created.currentState,
            version: created.version,
            etag: created.etag,
            isLocal: false,
            createdAt: new Date().toISOString(),
          };
      await AsyncStorage.setItem(K.InstanceMeta(serverId), JSON.stringify(meta));
      if (dataRaw) await AsyncStorage.setItem(K.InstanceData(serverId), dataRaw);

      const patchesRaw = await AsyncStorage.getItem(K.PatchQueue(job.tmpId));
      await AsyncStorage.removeItem(K.InstanceMeta(job.tmpId));
      await AsyncStorage.removeItem(K.InstanceData(job.tmpId));
      await AsyncStorage.removeItem(K.PatchQueue(job.tmpId));
      if (patchesRaw) await AsyncStorage.setItem(K.PatchQueue(serverId), patchesRaw);

      queue.shift();
      await AsyncStorage.setItem(K.CreateQueue, JSON.stringify(queue));

      await drainPatchQueue(serverId, meta);
    } catch {
      break;
    }
  }

  // also drain patch queues for existing server ids without create jobs
  // For simplicity, caller can manage separately.
}
