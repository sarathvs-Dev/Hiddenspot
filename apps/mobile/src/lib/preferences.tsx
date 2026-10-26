import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPlaceSortOption, type PlaceSortOption } from '@hiddenspot/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Local, device-only settings. Not synced anywhere. */
export interface Preferences {
  /** Skip the welcome screen on launch. */
  onboardingComplete: boolean;
  /** Where distances are measured from. "device" only after the user opts in. */
  locationMode: 'device' | 'preset';
  /** Demo location used when the device location is off or unavailable. */
  presetId: string;
  /** Default order for search results. */
  defaultSort: PlaceSortOption;
}

export const DEFAULT_PREFERENCES: Preferences = {
  onboardingComplete: false,
  locationMode: 'preset',
  presetId: 'kochi',
  defaultSort: 'recommended',
};

const STORAGE_KEY = 'hiddenspot:preferences:v1';

/** Accepts only known fields with valid values, so corrupted storage can never break the app. */
function parsePreferences(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return DEFAULT_PREFERENCES;
    const v = value as Record<string, unknown>;
    return {
      onboardingComplete: v.onboardingComplete === true,
      locationMode: v.locationMode === 'device' ? 'device' : 'preset',
      presetId:
        typeof v.presetId === 'string' && v.presetId ? v.presetId : DEFAULT_PREFERENCES.presetId,
      defaultSort: isPlaceSortOption(v.defaultSort)
        ? v.defaultSort
        : DEFAULT_PREFERENCES.defaultSort,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

interface PreferencesContextValue {
  preferences: Preferences;
  isReady: boolean;
  updatePreferences: (changes: Partial<Preferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled) setPreferences(parsePreferences(raw));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Preferences) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const updatePreferences = useCallback(
    (changes: Partial<Preferences>) => {
      setPreferences((current) => {
        const next = { ...current, ...changes };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const resetPreferences = useCallback(() => {
    setPreferences({ ...DEFAULT_PREFERENCES, onboardingComplete: true });
    persist({ ...DEFAULT_PREFERENCES, onboardingComplete: true });
  }, [persist]);

  const value = useMemo(
    () => ({ preferences, isReady, updatePreferences, resetPreferences }),
    [preferences, isReady, updatePreferences, resetPreferences],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside <PreferencesProvider>.');
  return context;
}
