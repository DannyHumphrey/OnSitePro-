import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInstance } from '@/api/formsApi';
import { K } from './keys';
import type { LocalInstanceMeta } from './types';

export async function resolveToServerId(id: string | number): Promise<string | number> {
  if (typeof id === 'string' && id.startsWith('tmp_')) {
    const mapped = await AsyncStorage.getItem(K.IdMap(id));
    if (mapped) return Number(mapped);
  }
  return id;
}

export async function getInstanceSmart(id: string | number): Promise<(LocalInstanceMeta & { data: any }) | null> {
  const resolved = await resolveToServerId(id);
  if (typeof resolved === 'number' || (typeof resolved === 'string' && !resolved.startsWith('tmp_'))) {
    try {
      const dto = await getInstance(Number(resolved));
      const meta: LocalInstanceMeta = {
        id: String(resolved),
        formType: (dto as any).formType || '',
        formVersion: (dto as any).formVersion ?? null,
        formDefinitionId: dto.formDefinitionId ?? null,
        currentState: dto.currentState,
        version: dto.version,
        etag: dto.etag,
        isLocal: false,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(K.InstanceMeta(resolved), JSON.stringify(meta));
      await AsyncStorage.setItem(K.InstanceData(resolved), JSON.stringify(dto.data || {}));
      return { ...meta, data: dto.data || {} };
    } catch {
      const metaRaw = await AsyncStorage.getItem(K.InstanceMeta(resolved));
      const dataRaw = await AsyncStorage.getItem(K.InstanceData(resolved));
      if (!metaRaw) return null;
      return { ...(JSON.parse(metaRaw) as LocalInstanceMeta), data: dataRaw ? JSON.parse(dataRaw) : {} };
    }
  }

  const metaRaw = await AsyncStorage.getItem(K.InstanceMeta(resolved));
  const dataRaw = await AsyncStorage.getItem(K.InstanceData(resolved));
  if (!metaRaw) return null;
  return { ...(JSON.parse(metaRaw) as LocalInstanceMeta), data: dataRaw ? JSON.parse(dataRaw) : {} };
}
