import type { MapPanelProps } from './MapPanel.types';
import { MapUnavailable } from './MapUnavailable';

export { KERALA_REGION } from './MapPanel.types';

/** Web build: react-native-maps is native-only, so no interactive map is available. */
export const isMapAvailable = false;

/** Web fallback. MapPanel.native.tsx replaces this file on iOS and Android. */
export function MapPanel({ height, places }: MapPanelProps) {
  return <MapUnavailable height={Math.min(height, 220)} count={places.length} reason="web" />;
}
