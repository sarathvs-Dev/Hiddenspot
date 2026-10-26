import type { KeyValueStorage } from '../types';

/** Volatile storage. Used in tests and as the fallback when real storage is unavailable. */
export function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}
