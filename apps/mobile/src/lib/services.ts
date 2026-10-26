import AsyncStorage from '@react-native-async-storage/async-storage';
import { createServices, type KeyValueStorage } from '@hiddenspot/shared';

/**
 * AsyncStorage keeps demo changes (saved places, demo reviews and submissions) on this device.
 * It is local demo storage, not cloud synchronisation. If AsyncStorage fails, the data service
 * falls back to memory for the session and reports "memory-only".
 */
const deviceStorage: KeyValueStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export const appServices = createServices({ storage: deviceStorage, latencyMs: 150 });
