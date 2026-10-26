// Fonts are bundled with the app by Fontsource, so nothing is fetched from a font CDN.
import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import {
  HiddenSpotDataProvider,
  ReferenceLocationProvider,
  ToastProvider,
} from '@hiddenspot/shared/react';
import { LocationProvider } from './lib/location';
import { appServices } from './lib/services';
import { applyThemeVariables } from './lib/theme';
import { router } from './router';
import './styles/global.css';

applyThemeVariables();

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found in index.html');

createRoot(container).render(
  <StrictMode>
    <HiddenSpotDataProvider services={appServices}>
      <ReferenceLocationProvider>
        <LocationProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </LocationProvider>
      </ReferenceLocationProvider>
    </HiddenSpotDataProvider>
  </StrictMode>,
);
