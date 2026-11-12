import { useSyncExternalStore } from "react";
import { storage } from "./storage";

/**
 * localStorage as an external store (React `useSyncExternalStore`):
 * no setState-in-effect, SSR-safe (server snapshot = null) and synced across tabs.
 * Snapshots are raw strings, so they are referentially stable between reads.
 */
export function createStorageStore(key: string) {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => e.key === key && listener();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    subscribe,
    getSnapshot: () => storage.get(key),
    getServerSnapshot: () => null,
    write(value: string) {
      storage.set(key, value);
      notify();
    },
  };
}

export type StorageStore = ReturnType<typeof createStorageStore>;

export function useStorageValue(store: StorageStore): string | null {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

const noop = () => () => {};
/** true after hydration on the client, false during SSR and the hydration pass. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
