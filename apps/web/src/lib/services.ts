import { createServices, type KeyValueStorage } from '@hiddenspot/shared';

/**
 * Browser localStorage, or null when it is blocked (private mode, disabled cookies).
 * With null, demo changes live in memory for this session only.
 * This is local demo storage, not cloud synchronisation.
 */
function browserStorage(): KeyValueStorage | null {
  try {
    const probe = '__hiddenspot_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
      removeItem: (key) => window.localStorage.removeItem(key),
    };
  } catch {
    return null;
  }
}

/** Composition root for the web app. Swap for API-backed services in a later phase. */
export const appServices = createServices({ storage: browserStorage(), latencyMs: 150 });
