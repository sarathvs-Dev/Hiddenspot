import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { AppServices, HiddenSpotDataService } from '../types';

const ServicesContext = createContext<AppServices | null>(null);

export interface ServicesProviderProps {
  services: AppServices;
  children: ReactNode;
}

/** Injects data services. Swapping demo data for an API is a one-line change at the app root. */
export function ServicesProvider({ services, children }: ServicesProviderProps) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>.');
  return services;
}

export function useDataService(): HiddenSpotDataService {
  return useServices().data;
}

/** Changes whenever demo state changes, so data hooks refetch after reviews, saves or submissions. */
export function useDataVersion(): number {
  const data = useDataService();
  const subscribe = useCallback((onChange: () => void) => data.subscribe(onChange), [data]);
  const getSnapshot = useCallback(() => data.getVersion(), [data]);
  return useSyncExternalStore(subscribe, getSnapshot);
}
