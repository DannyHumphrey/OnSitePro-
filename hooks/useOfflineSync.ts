import { syncOnce } from "@/services/offlineHelpers/syncEngine";
import { useEffect } from "react";
import { useNetworkStatus } from "./useNetworkStatus";

export function useOfflineSync() {
  const isOnline = useNetworkStatus();
  useEffect(() => {
    if (isOnline) {
      syncOnce().catch(() => {});
    }
  }, [isOnline]);
}
