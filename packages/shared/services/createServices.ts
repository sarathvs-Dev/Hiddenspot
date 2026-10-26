import type { AppServices, KeyValueStorage } from '../types';
import { DemoDataService } from './demoDataService';

export type DataSourceMode = 'demo';

export interface CreateServicesOptions {
  /**
   * Only 'demo' exists in Phase 1: seed JSON plus device-local demo state.
   * A later phase adds 'api' and returns an implementation of the same interface.
   */
  mode?: DataSourceMode;
  /**
   * Local device storage for demo changes: localStorage on web, AsyncStorage on mobile.
   * This is not cloud sync. Null keeps changes in memory for the session only.
   */
  storage?: KeyValueStorage | null;
  latencyMs?: number;
  currentUserId?: string;
}

/** Composition root for data access. Apps call this once and pass the result to ServicesProvider. */
export function createServices(options: CreateServicesOptions = {}): AppServices {
  return {
    data: new DemoDataService({
      storage: options.storage ?? null,
      latencyMs: options.latencyMs,
      currentUserId: options.currentUserId,
    }),
  };
}
