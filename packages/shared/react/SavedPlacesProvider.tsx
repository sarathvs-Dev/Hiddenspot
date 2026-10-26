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
import { useDataService } from './ServicesProvider';

interface SavedPlacesContextValue {
  savedPlaceIds: string[];
  isReady: boolean;
  isSaved: (placeId: string) => boolean;
  /**
   * Toggles instantly in the UI, then persists through the data service.
   * Returns true when the place is now saved. Reverts if the service rejects the change.
   */
  toggleSaved: (placeId: string) => boolean;
  clearSaved: () => Promise<void>;
}

const SavedPlacesContext = createContext<SavedPlacesContextValue | null>(null);

/** Optimistic saved-places state backed by HiddenSpotDataService.toggleSavedPlace. */
export function SavedPlacesProvider({ children }: { children: ReactNode }) {
  const data = useDataService();
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  // Latest ids, so callbacks captured earlier (such as a toast Undo) stay correct.
  const idsRef = useRef<string[]>([]);

  const apply = useCallback((ids: string[]) => {
    idsRef.current = ids;
    setSavedPlaceIds(ids);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sync = () =>
      void data.getSavedPlaceIds().then((ids) => {
        if (cancelled) return;
        apply(ids);
        setIsReady(true);
      });
    sync();
    const unsubscribe = data.subscribe(sync);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [data, apply]);

  const toggleSaved = useCallback(
    (placeId: string) => {
      const previous = idsRef.current;
      const willSave = !previous.includes(placeId);
      apply(willSave ? [placeId, ...previous] : previous.filter((id) => id !== placeId));
      data.toggleSavedPlace(placeId).then(
        ({ savedPlaceIds: ids }) => apply(ids),
        () => apply(previous),
      );
      return willSave;
    },
    [data, apply],
  );

  const clearSaved = useCallback(async () => {
    apply([]);
    await data.clearSavedPlaces();
  }, [data, apply]);

  const value = useMemo<SavedPlacesContextValue>(
    () => ({
      savedPlaceIds,
      isReady,
      isSaved: (placeId) => savedPlaceIds.includes(placeId),
      toggleSaved,
      clearSaved,
    }),
    [savedPlaceIds, isReady, toggleSaved, clearSaved],
  );

  return <SavedPlacesContext.Provider value={value}>{children}</SavedPlacesContext.Provider>;
}

export function useSavedPlaceIds(): SavedPlacesContextValue {
  const context = useContext(SavedPlacesContext);
  if (!context) throw new Error('useSavedPlaceIds must be used inside <SavedPlacesProvider>.');
  return context;
}
