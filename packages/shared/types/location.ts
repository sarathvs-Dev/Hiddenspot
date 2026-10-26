export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * A point distances are measured from. "device" is the user's real position from the
 * operating system. "preset" is a named demo location and must never be shown as "your location".
 */
export interface ReferenceLocation extends Coordinates {
  label: string;
  kind?: 'device' | 'preset';
}

/** A named demo location with cited coordinates (a town centre), used when GPS is unavailable. */
export interface ReferenceLocationPreset extends Coordinates {
  id: string;
  label: string;
  district: string;
  agreementKm: number;
  sources: { name: string; url: string }[];
  retrievedOn: string;
}
