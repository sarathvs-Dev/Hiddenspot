import type { Place, ReferenceLocation } from '@hiddenspot/shared';

export interface MapPanelProps {
  /** Places with coordinates. Places without coordinates are listed separately by the screen. */
  places: Place[];
  selectedId: string | null;
  onSelect: (placeId: string) => void;
  reference: ReferenceLocation | null;
  height: number;
}

/** Kerala, framed to show the whole state on a phone screen. */
export const KERALA_REGION = {
  latitude: 10.45,
  longitude: 76.35,
  latitudeDelta: 4.2,
  longitudeDelta: 2.8,
};
