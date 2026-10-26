import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Category, CategoryId } from '../types';
import { useDataService } from './ServicesProvider';

interface CatalogContextValue {
  /** Sorted categories. Empty until loaded. */
  categories: Category[];
  isReady: boolean;
  getCategory: (id: CategoryId) => Category | undefined;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

/**
 * Loads reference data (categories) once from the data service so cards and chips can
 * look categories up synchronously, without importing seed JSON.
 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const data = useDataService();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void data.getCategories().then((list) => {
      if (cancelled) return;
      setCategories(list);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  const value = useMemo<CatalogContextValue>(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    return { categories, isReady, getCategory: (id) => byId.get(id) };
  }, [categories, isReady]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside <CatalogProvider>.');
  return context;
}
