import type { ReferenceLocation, ReferenceLocationPreset } from '@hiddenspot/shared';
import { useReferenceLocation, useReferenceLocations } from '@hiddenspot/shared/react';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePreferences } from './preferences';

export type DeviceLocationStatus = 'off' | 'locating' | 'ready' | 'denied' | 'unavailable';

interface LocationContextValue {
  /** The point distances are measured from. A preset is always marked kind "preset". */
  reference: ReferenceLocation | null;
  presets: ReferenceLocationPreset[];
  activePreset: ReferenceLocationPreset | undefined;
  deviceStatus: DeviceLocationStatus;
  /** Asks for permission and switches to the device location. Falls back to the demo location. */
  enableDeviceLocation: () => Promise<void>;
  selectPreset: (presetId: string) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

/**
 * Chooses the reference location. Device location is used only after the user opts in and
 * grants permission. Otherwise a named demo location is used and labelled as such.
 */
export function LocationProvider({ children }: { children: ReactNode }) {
  const { preferences, isReady, updatePreferences } = usePreferences();
  const { setReference } = useReferenceLocation();
  const presets = useReferenceLocations();
  const [device, setDevice] = useState<ReferenceLocation | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceLocationStatus>('off');

  const presetList = useMemo(() => presets.data ?? [], [presets.data]);
  const activePreset = presetList.find((p) => p.id === preferences.presetId) ?? presetList[0];

  const restoreAttempted = useRef(false);

  /** Reads the device position. State changes only after the first await. */
  const locate = useCallback(async (askPermission: boolean) => {
    try {
      const permission = askPermission
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setDeviceStatus('denied');
        return false;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setDevice({
        label: 'Your location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        kind: 'device',
      });
      setDeviceStatus('ready');
      return true;
    } catch {
      setDeviceStatus('unavailable');
      return false;
    }
  }, []);

  // Restore device mode on launch only if permission was already granted. Never prompt unasked.
  useEffect(() => {
    if (!isReady || restoreAttempted.current || preferences.locationMode !== 'device') return;
    restoreAttempted.current = true;
    void locate(false);
  }, [isReady, preferences.locationMode, locate]);

  const reference = useMemo<ReferenceLocation | null>(() => {
    if (preferences.locationMode === 'device' && device) return device;
    if (!activePreset) return null;
    return {
      label: activePreset.label,
      latitude: activePreset.latitude,
      longitude: activePreset.longitude,
      kind: 'preset',
    };
  }, [preferences.locationMode, device, activePreset]);

  // Keep the shared reference (used by place cards) in sync.
  useEffect(() => {
    setReference(reference);
  }, [reference, setReference]);

  const enableDeviceLocation = useCallback(async () => {
    setDeviceStatus('locating');
    const ok = await locate(true);
    updatePreferences({ locationMode: ok ? 'device' : 'preset' });
  }, [locate, updatePreferences]);

  const selectPreset = useCallback(
    (presetId: string) => updatePreferences({ locationMode: 'preset', presetId }),
    [updatePreferences],
  );

  const value = useMemo(
    () => ({
      reference,
      presets: presetList,
      activePreset,
      deviceStatus,
      enableDeviceLocation,
      selectPreset,
    }),
    [reference, presetList, activePreset, deviceStatus, enableDeviceLocation, selectPreset],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocationContext must be used inside <LocationProvider>.');
  return context;
}
