import {
  countActiveFilters,
  toggleInList,
  type CategoryId,
  type PlaceQuery,
  type PlaceSortOption,
} from '@hiddenspot/shared';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { usePreferences } from './preferences';

interface DiscoveryState {
  query: string;
  categoryIds: CategoryId[];
  maxDistanceKm: number | undefined;
  /** Undefined means "use the default sort from preferences". */
  sortBy: PlaceSortOption | undefined;
}

/** Shared with web so both apps offer the same sorts. */
export { SORT_CHOICES, sortLabel } from '@hiddenspot/shared';

const EMPTY: DiscoveryState = {
  query: '',
  categoryIds: [],
  maxDistanceKm: undefined,
  sortBy: undefined,
};

interface DiscoveryContextValue extends DiscoveryState {
  effectiveSort: PlaceSortOption;
  /** The filters as a PlaceQuery, without the reference location. */
  placeQuery: PlaceQuery;
  activeCount: number;
  setQuery: (query: string) => void;
  toggleCategory: (id: CategoryId) => void;
  setCategories: (ids: CategoryId[]) => void;
  setMaxDistanceKm: (km: number | undefined) => void;
  setSortBy: (sort: PlaceSortOption) => void;
  clearAll: () => void;
}

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

/**
 * Search and filter state shared by Explore, Search and Map. Lives above the tabs,
 * so filters survive moving between screens.
 */
export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences();
  const [state, setState] = useState<DiscoveryState>(EMPTY);

  const setQuery = useCallback((query: string) => setState((s) => ({ ...s, query })), []);
  const toggleCategory = useCallback(
    (id: CategoryId) => setState((s) => ({ ...s, categoryIds: toggleInList(s.categoryIds, id) })),
    [],
  );
  const setCategories = useCallback(
    (categoryIds: CategoryId[]) => setState((s) => ({ ...s, categoryIds })),
    [],
  );
  const setMaxDistanceKm = useCallback(
    (maxDistanceKm: number | undefined) => setState((s) => ({ ...s, maxDistanceKm })),
    [],
  );
  const setSortBy = useCallback(
    (sortBy: PlaceSortOption) => setState((s) => ({ ...s, sortBy })),
    [],
  );
  const clearAll = useCallback(() => setState(EMPTY), []);

  const value = useMemo<DiscoveryContextValue>(() => {
    const effectiveSort = state.sortBy ?? preferences.defaultSort;
    const placeQuery: PlaceQuery = {
      query: state.query.trim() || undefined,
      categoryIds: state.categoryIds.length ? state.categoryIds : undefined,
      maxDistanceKm: state.maxDistanceKm,
      sortBy: effectiveSort,
    };
    return {
      ...state,
      effectiveSort,
      placeQuery,
      activeCount:
        countActiveFilters(placeQuery) +
        (state.sortBy && state.sortBy !== preferences.defaultSort ? 1 : 0),
      setQuery,
      toggleCategory,
      setCategories,
      setMaxDistanceKm,
      setSortBy,
      clearAll,
    };
  }, [
    state,
    preferences.defaultSort,
    setQuery,
    toggleCategory,
    setCategories,
    setMaxDistanceKm,
    setSortBy,
    clearAll,
  ]);

  return <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>;
}

export function useDiscovery(): DiscoveryContextValue {
  const context = useContext(DiscoveryContext);
  if (!context) throw new Error('useDiscovery must be used inside <DiscoveryProvider>.');
  return context;
}
