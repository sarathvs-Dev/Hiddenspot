import type { EntryFee, Place, ReferenceLocation } from '../types';
import { copy } from '../content/copy';
import { getPlaceCoordinates } from './geo';

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** "4.5", or "New" when there are no ratings yet. */
export function formatRating(rating: number | null): string {
  return rating === null ? 'New' : rating.toFixed(1);
}

export function formatReviewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k reviews`;
  return `${count} ${count === 1 ? 'review' : 'reviews'}`;
}

/** Unknown fees say so instead of implying "free". */
export function formatEntryFee(fee: EntryFee | null): string {
  if (fee === null) return 'Not confirmed';
  if (fee.kind === 'free') return 'Free';
  return `₹${fee.amount.toLocaleString('en-IN')}${fee.note ? ` (${fee.note})` : ''}`;
}

export function formatOpeningHours(hours: string | null): string {
  return hours ?? 'Not confirmed';
}

/** "Thrissur, Kerala". */
export function formatLocation(place: Pick<Place, 'district' | 'state'>): string {
  return `${place.district}, ${place.state}`;
}

/** Cover image, or null when the place has no photos. */
export function getCoverImage(place: Pick<Place, 'imageUrls'>): string | null {
  return place.imageUrls[0] ?? null;
}

/** Morning, afternoon or evening greeting for the home screen header. */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Google Maps link without an API key. Uses coordinates only for site-level, verified locations;
 * area-level or unknown locations search by name and district, so no destination is guessed.
 */
export function getDirectionsUrl(
  place: Pick<
    Place,
    'name' | 'district' | 'state' | 'latitude' | 'longitude' | 'locationPrecision'
  >,
): string {
  const coords = getPlaceCoordinates(place);
  if (coords && place.locationPrecision === 'site') {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`;
  }
  const query = encodeURIComponent(`${place.name}, ${place.district}, ${place.state}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-07" or "2026-07-14" becomes "Jul 2026". Locale-independent so both apps match. */
export function formatMonthYear(value: string): string {
  const [year, month] = value.split('-');
  const name = MONTHS[Number(month) - 1];
  return name && year ? `${name} ${year}` : value;
}

/** "2026-07-14" becomes "14 Jul 2026". */
export function formatShortDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  const name = MONTHS[Number(month) - 1];
  return name && year && day ? `${Number(day)} ${name} ${year}` : value;
}

/** Rating for screen readers, e.g. "Rated 4.5 out of 5 from 3 reviews". */
export function describeRating(rating: number | null, reviewCount?: number): string {
  if (rating === null) return 'No ratings yet';
  const base = `Rated ${formatRating(rating)} out of 5`;
  return reviewCount === undefined ? base : `${base} from ${formatReviewCount(reviewCount)}`;
}

/** One sentence explaining how a place's location was established. Shared so both apps agree. */
export function describeLocation(place: Pick<Place, 'locationPrecision' | 'sources'>): string {
  if (place.locationPrecision === null) return copy.place.locationUnverified;
  if (place.locationPrecision === 'area') return copy.place.locationArea;
  const names = [
    ...new Set(place.sources.filter((s) => s.field === 'coordinates').map((s) => s.name)),
  ];
  return copy.place.locationVerified(
    names.length > 1
      ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
      : (names[0] ?? 'a cited source'),
  );
}

/**
 * Wording for distances. A device position is "you"; a preset is always labelled as a demo
 * location, so a fake position is never presented as the user's real one.
 */
export function describeReference(reference: ReferenceLocation): string {
  return reference.kind === 'device' ? 'your location' : `${reference.label} (demo location)`;
}

export function formatDistanceFrom(km: number, reference: ReferenceLocation): string {
  return reference.kind === 'device'
    ? `${formatDistance(km)} away`
    : `${formatDistance(km)} from ${reference.label} (demo)`;
}
