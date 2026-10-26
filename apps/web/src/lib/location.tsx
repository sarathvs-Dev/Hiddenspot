import type { ReferenceLocation, ReferenceLocationPreset } from '@hiddenspot/shared';
import { useReferenceLocation, useReferenceLocations } from '@hiddenspot/shared/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type DeviceLocationStatus = 'off' | 'locating' | 'ready' | 'denied' | 'unavailable';

interface StoredChoice {
  mode: 'device' | 'preset';
  presetId: string;
}

const STORAGE_KEY = 'hiddenspot:web-location:v1';
const DEFAULT_CHOICE: StoredChoice = { mode: 'preset', presetId: 'kochi' };

function readChoice(): StoredChoice {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const v = raw ? (JSON.parse(raw) as Partial<StoredChoice>) : null;
    return {
      mode: v?.mode === 'device' ? 'device' : 'preset',
      presetId:
        typeof v?.presetId === 'string' && v.presetId ? v.presetId : DEFAULT_CHOICE.presetId,
    };
  } catch {
    return DEFAULT_CHOICE;
  }
}

function writeChoice(choice: StoredChoice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  } catch {
    // Storage blocked: the choice lasts for this session only.
  }
}

interface LocationContextValue {
  /** Where distances are measured from. Presets carry kind "preset" and are labelled as demo. */
  reference: ReferenceLocation | null;
  presets: ReferenceLocationPreset[];
  activePreset: ReferenceLocationPreset | undefined;
  mode: 'device' | 'preset';
  deviceStatus: DeviceLocationStatus;
  enableDeviceLocation: () => void;
  selectPreset: (id: string) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

/**
 * Browser location is used only after the user asks for it. Otherwise a named demo location
 * (a town centre with cited coordinates) is used and always labelled as a demo.
 */
export function LocationProvider({ children }: { children: ReactNode }) {
  const { setReference } = useReferenceLocation();
  const presetsQuery = useReferenceLocations();
  const [choice, setChoice] = useState<StoredChoice>(readChoice);
  const [device, setDevice] = useState<ReferenceLocation | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceLocationStatus>('off');

  const presets = useMemo(() => presetsQuery.data ?? [], [presetsQuery.data]);
  const activePreset = presets.find((p) => p.id === choice.presetId) ?? presets[0];

  const updateChoice = useCallback((next: StoredChoice) => {
    setChoice(next);
    writeChoice(next);
  }, []);

  const enableDeviceLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setDeviceStatus('unavailable');
      return;
    }
    setDeviceStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDevice({
          label: 'Your location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          kind: 'device',
        });
        setDeviceStatus('ready');
        updateChoice({ ...readChoice(), mode: 'device' });
      },
      (error) => {
        setDeviceStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
        updateChoice({ ...readChoice(), mode: 'preset' });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, [updateChoice]);

  // Restore device mode only when the browser already granted permission. Never prompt unasked.
  useEffect(() => {
    if (choice.mode !== 'device' || deviceStatus !== 'off' || !navigator.permissions) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (!cancelled && status.state === 'granted') enableDeviceLocation();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [choice.mode, deviceStatus, enableDeviceLocation]);

  const reference = useMemo<ReferenceLocation | null>(() => {
    if (choice.mode === 'device' && device) return device;
    if (!activePreset) return null;
    return {
      label: activePreset.label,
      latitude: activePreset.latitude,
      longitude: activePreset.longitude,
      kind: 'preset',
    };
  }, [choice.mode, device, activePreset]);

  useEffect(() => {
    setReference(reference);
  }, [reference, setReference]);

  const selectPreset = useCallback(
    (id: string) => updateChoice({ mode: 'preset', presetId: id }),
    [updateChoice],
  );

  const value = useMemo(
    () => ({
      reference,
      presets,
      activePreset,
      mode: choice.mode,
      deviceStatus,
      enableDeviceLocation,
      selectPreset,
    }),
    [
      reference,
      presets,
      activePreset,
      choice.mode,
      deviceStatus,
      enableDeviceLocation,
      selectPreset,
    ],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook lives with its provider
export function useLocationContext(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocationContext must be used inside <LocationProvider>.');
  return context;
}
