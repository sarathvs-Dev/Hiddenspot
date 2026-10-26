import type { DemoState, DemoStorageStatus, KeyValueStorage } from '../types';
import { createEmptyDemoState, sanitizeDemoState } from '../utils/validation';

/** Device-local key. Bump the version suffix when the DemoState schema changes incompatibly. */
export const DEMO_STATE_STORAGE_KEY = 'hiddenspot:demo-state:v1';
/** Where unreadable saved data is copied before being replaced, to aid debugging. */
export const DEMO_STATE_CORRUPT_BACKUP_KEY = 'hiddenspot:demo-state:corrupt-backup';

export interface LoadedDemoState {
  state: DemoState;
  status: DemoStorageStatus;
  /** Number of invalid saved entries that were dropped. */
  dropped: number;
}

/**
 * Loads and saves demo state as JSON in a KeyValueStorage.
 * Never throws: unavailable storage falls back to memory, and corrupted data
 * is backed up and replaced with a clean state.
 */
export class DemoStateStore {
  private readonly storage: KeyValueStorage | null;
  private readonly key: string;
  private status: DemoStorageStatus;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(storage: KeyValueStorage | null, key: string = DEMO_STATE_STORAGE_KEY) {
    this.storage = storage;
    this.key = key;
    this.status = storage ? 'persistent' : 'memory-only';
  }

  getStatus(): DemoStorageStatus {
    return this.status;
  }

  async load(): Promise<LoadedDemoState> {
    if (!this.storage) return { state: createEmptyDemoState(), status: 'memory-only', dropped: 0 };

    let raw: string | null;
    try {
      raw = await this.storage.getItem(this.key);
    } catch {
      this.status = 'memory-only';
      return { state: createEmptyDemoState(), status: this.status, dropped: 0 };
    }
    if (raw === null) return { state: createEmptyDemoState(), status: this.status, dropped: 0 };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = undefined;
    }
    const sanitized = parsed === undefined ? null : sanitizeDemoState(parsed);

    if (!sanitized) {
      await this.backupCorrupt(raw);
      const state = createEmptyDemoState();
      this.status = 'recovered-from-corruption';
      await this.save(state);
      return { state, status: this.status, dropped: 0 };
    }
    if (sanitized.dropped > 0) {
      this.status = 'recovered-from-corruption';
      await this.save(sanitized.state);
    }
    return { state: sanitized.state, status: this.status, dropped: sanitized.dropped };
  }

  /** Writes are queued so a slow write can never overwrite a newer one. */
  save(state: DemoState): Promise<void> {
    const snapshot = JSON.stringify(state);
    this.writeChain = this.writeChain.then(async () => {
      if (!this.storage || this.status === 'memory-only') return;
      try {
        await this.storage.setItem(this.key, snapshot);
      } catch {
        // Quota exceeded or storage revoked: keep working in memory for this session.
        this.status = 'memory-only';
      }
    });
    return this.writeChain;
  }

  async clear(): Promise<void> {
    await this.writeChain;
    if (!this.storage) return;
    try {
      if (this.storage.removeItem) await this.storage.removeItem(this.key);
      else await this.storage.setItem(this.key, JSON.stringify(createEmptyDemoState()));
      if (this.status === 'recovered-from-corruption') this.status = 'persistent';
    } catch {
      this.status = 'memory-only';
    }
  }

  private async backupCorrupt(raw: string): Promise<void> {
    try {
      await this.storage?.setItem(DEMO_STATE_CORRUPT_BACKUP_KEY, raw.slice(0, 100_000));
    } catch {
      // Backup is best effort only.
    }
  }
}
