import type { ReactNode } from 'react';
import type { AppServices } from '../types';
import { CatalogProvider } from './CatalogProvider';
import { SavedPlacesProvider } from './SavedPlacesProvider';
import { ServicesProvider } from './ServicesProvider';

/** One provider for apps: services, reference data and saved places. */
export function HiddenSpotDataProvider({
  services,
  children,
}: {
  services: AppServices;
  children: ReactNode;
}) {
  return (
    <ServicesProvider services={services}>
      <CatalogProvider>
        <SavedPlacesProvider>{children}</SavedPlacesProvider>
      </CatalogProvider>
    </ServicesProvider>
  );
}
