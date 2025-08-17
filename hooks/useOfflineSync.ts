import { useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { syncOnce } from '@/src/offline/syncEngine';

export function useOfflineSync() {
  const isOnline = useNetworkStatus();
  useEffect(() => {
    if (isOnline) {
      syncOnce().catch(() => {});
    }
  }, [isOnline]);
}
