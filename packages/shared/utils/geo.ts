import type { Coordinates, Place, ReferenceLocation } from '../types';

/** Mean Earth radius used by the haversine formula, in kilometres. */
export const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Finite latitude in [-90, 90] and longitude in [-180, 180]. */
export function isValidCoordinates(
  value: { latitude?: unknown; longitude?: unknown } | null | undefined,
): value is Coordinates {
  if (!value) return false;
  const { latitude, longitude } = value;
  return (
    isFiniteNumber(latitude) &&
    isFiniteNumber(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Great-circle distance between two points, in kilometres, using the haversine formula.
 * Returns NaN when either point is invalid, so a bad input can never pass as a real distance.
 */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  if (!isValidCoordinates(a) || !isValidCoordinates(b)) return Number.NaN;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  // Clamp guards against floating-point values a hair above 1 for near-antipodal points.
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The place coordinates, or null when they are missing or invalid. */
export function getPlaceCoordinates(
  place: Pick<Place, 'latitude' | 'longitude'>,
): Coordinates | null {
  return isValidCoordinates(place)
    ? { latitude: place.latitude as number, longitude: place.longitude as number }
    : null;
}

/** True when the reference location can be used for distances and radius filters. */
export function isUsableReference(
  reference: ReferenceLocation | null | undefined,
): reference is ReferenceLocation {
  return isValidCoordinates(reference);
}

/**
 * Distance from the reference location, or undefined when either side has no valid coordinates.
 * The apps only show a distance when this returns a number.
 */
export function getDistanceFromReference(
  place: Pick<Place, 'latitude' | 'longitude'>,
  reference: ReferenceLocation | null | undefined,
): number | undefined {
  const coords = getPlaceCoordinates(place);
  if (!coords || !isUsableReference(reference)) return undefined;
  return haversineKm(reference, coords);
}

/** Distance for each place, keyed by the place object. */
export type DistanceLookup = (place: Place) => number | undefined;

/**
 * Computes each place's distance at most once for one reference location.
 * Keyed by object rather than id, so duplicate ids can never share a distance.
 */
export function createDistanceLookup(
  reference: ReferenceLocation | null | undefined,
): DistanceLookup {
  const cache = new Map<Place, number | undefined>();
  return (place) => {
    if (cache.has(place)) return cache.get(place);
    const distance = getDistanceFromReference(place, reference);
    cache.set(place, distance);
    return distance;
  };
}
