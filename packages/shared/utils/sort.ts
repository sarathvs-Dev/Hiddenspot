import type { Place, PlaceSortOption, ReferenceLocation } from '../types';
import { createDistanceLookup, isUsableReference, type DistanceLookup } from './geo';
import { RATING_PRIOR } from './rules';
import { normalizeText } from './text';

/**
 * Locale-independent text comparison. `localeCompare` depends on the JS engine's ICU data,
 * which differs between Hermes (mobile) and V8 (web), so ordering could differ by platform.
 */
export function compareText(a: string, b: string): number {
  const x = normalizeText(a);
  const y = normalizeText(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * Bayesian (weighted) rating, the single rating score used for ranking:
 *
 *   score = (average × reviewCount + PRIOR_MEAN × PRIOR_WEIGHT) / (reviewCount + PRIOR_WEIGHT)
 *
 * with PRIOR_MEAN = 3.8 and PRIOR_WEIGHT = 3 (see RATING_PRIOR). A place with few reviews is
 * pulled towards 3.8, so one 5-star review does not outrank twenty reviews averaging 4.7.
 * `average` and `reviewCount` are always recomputed from valid reviews (see withReviewStats).
 * Returns null for a place with no reviews, which ranks below every rated place.
 */
export function bayesianRating(place: Pick<Place, 'averageRating' | 'reviewCount'>): number | null {
  const count = safeCount(place.reviewCount);
  const average = place.averageRating;
  if (count === 0 || typeof average !== 'number' || !Number.isFinite(average)) return null;
  const { mean, weight } = RATING_PRIOR;
  // Rounded so floating-point noise cannot break a genuine tie between two places.
  return Math.round(((average * count + mean * weight) / (count + weight)) * 1e6) / 1e6;
}

/** Non-negative finite count, else 0. Protects sorting from bad data. */
function safeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Milliseconds since epoch, or null for an invalid date (sorted last). */
function safeTime(value: string): number | null {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/**
 * Recommended order: the Bayesian rating (the prior mean for unrated places), plus a small,
 * diminishing popularity boost. Synthetic demo places rank lower.
 */
export function recommendationScore(place: Place): number {
  const rating = bayesianRating(place) ?? RATING_PRIOR.mean;
  const popularity = Math.log10(safeCount(place.popularityCount) + 1) * 0.25;
  const synthetic = place.isSyntheticDemo ? -0.5 : 0;
  return rating + popularity + synthetic;
}

/** Final tie-breaker so every platform produces exactly the same order. */
const byNameThenId = (a: Place, b: Place) =>
  compareText(a.name, b.name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Compares nullable numbers. Missing values always sort last, whatever the direction. */
function compareNullable(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: 1 | -1,
): number {
  const aMissing = a === null || a === undefined || Number.isNaN(a);
  const bMissing = b === null || b === undefined || Number.isNaN(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return a === b ? 0 : (a < b ? -1 : 1) * direction;
}

export interface SortContext {
  reference?: ReferenceLocation | null;
  /** Precomputed distances, so filtering and sorting share one calculation per place. */
  distances?: DistanceLookup;
}

/** Sorts on keys computed once per place, then breaks ties by name and id. */
function sortByKey<K>(
  list: Place[],
  key: (place: Place) => K,
  compare: (a: K, b: K) => number,
): Place[] {
  const keyed = list.map((place) => ({ place, key: key(place) }));
  keyed.sort((a, b) => compare(a.key, b.key) || byNameThenId(a.place, b.place));
  return keyed.map((entry) => entry.place);
}

/**
 * Returns a new, deterministically sorted array. Never mutates the input.
 * - nearest ("distance"): ascending distance; places without coordinates last.
 *   Without a usable reference location it falls back to "recommended".
 * - most rated ("rating"): Bayesian rating descending, then more reviews; unrated last.
 * - newly added ("newest"): createdAt descending; invalid dates last.
 * - most popular ("popularity"): popularityCount descending.
 * Every sort ends with name, then id, as tie-breakers.
 */
export function sortPlaces(
  places: readonly Place[],
  sortBy: PlaceSortOption = 'recommended',
  context: SortContext = {},
): Place[] {
  const list = [...places];
  switch (sortBy) {
    case 'rating':
      return sortByKey(
        list,
        (p) => ({ score: bayesianRating(p), count: safeCount(p.reviewCount) }),
        (a, b) => compareNullable(a.score, b.score, -1) || b.count - a.count,
      );
    case 'popularity':
      return sortByKey(
        list,
        (p) => safeCount(p.popularityCount),
        (a, b) => b - a,
      );
    case 'newest':
      return sortByKey(
        list,
        (p) => safeTime(p.createdAt),
        (a, b) => compareNullable(a, b, -1),
      );
    case 'name':
      return list.sort(byNameThenId);
    case 'distance': {
      if (!isUsableReference(context.reference)) return sortPlaces(list, 'recommended');
      const distances = context.distances ?? createDistanceLookup(context.reference);
      return sortByKey(list, distances, (a, b) => compareNullable(a, b, 1));
    }
    case 'recommended':
    default:
      return sortByKey(list, recommendationScore, (a, b) => b - a);
  }
}
