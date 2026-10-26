import type {
  Category,
  CategoryId,
  Place,
  PlaceFilters,
  PlaceQuery,
  ReferenceLocation,
} from '../types';
import { createDistanceLookup, isUsableReference, type DistanceLookup } from './geo';
import { indexCategories } from './categories';
import { matchesPlaceText, searchRelevance } from './search';
import { sortPlaces } from './sort';

/** True when a place passes every active filter. Sorting is separate. */
export function matchesFilters(
  place: Place,
  filters: PlaceFilters,
  categoriesById?: Map<CategoryId, Category>,
): boolean {
  const { categoryIds, districts, minRating, withPhotosOnly, query } = filters;
  if (categoryIds?.length && !place.categoryIds.some((id) => categoryIds.includes(id)))
    return false;
  if (districts?.length && !districts.includes(place.district)) return false;
  if (minRating !== undefined && (place.averageRating === null || place.averageRating < minRating))
    return false;
  if (withPhotosOnly && place.imageUrls.length === 0) return false;
  return matchesPlaceText(place, query, categoriesById);
}

/** A usable radius: a finite, non-negative number of kilometres. */
export function isValidRadius(radius: number | undefined): radius is number {
  return typeof radius === 'number' && Number.isFinite(radius) && radius >= 0;
}

/**
 * Filters a list of places. Pure and shared by every platform. All filters combine:
 * text, categories, districts, rating, photos and distance must all pass.
 * The radius applies only with a valid radius and a usable reference location. When it
 * applies, places without valid coordinates are excluded because their distance is unknown.
 * The boundary is inclusive: a place exactly at the radius is kept.
 */
export function filterPlaces(
  places: readonly Place[],
  filters: PlaceFilters,
  categories: readonly Category[] = [],
  reference: ReferenceLocation | null = null,
  distances: DistanceLookup = createDistanceLookup(reference),
): Place[] {
  const index = indexCategories(categories);
  const radius = filters.maxDistanceKm;
  const applyRadius = isValidRadius(radius) && isUsableReference(reference);
  return places.filter((place) => {
    if (!matchesFilters(place, filters, index)) return false;
    if (!applyRadius) return true;
    const distance = distances(place);
    return distance !== undefined && distance <= radius;
  });
}

/** Keeps the first place for each id, so lists never show duplicates. */
export function uniqueById(places: readonly Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}

/**
 * Removes duplicate ids, filters, sorts, then limits. Each distance is computed once and
 * shared by the radius filter and the nearest sort. With a text query and the default sort,
 * results are ordered by search relevance first.
 */
export function queryPlaces(
  places: readonly Place[],
  query: PlaceQuery = {},
  categories: readonly Category[] = [],
): Place[] {
  const reference = query.reference ?? null;
  const distances = createDistanceLookup(reference);
  const sortBy = query.sortBy ?? 'recommended';
  let result = sortPlaces(
    filterPlaces(uniqueById(places), query, categories, reference, distances),
    sortBy,
    { reference, distances },
  );
  if (query.query?.trim() && sortBy === 'recommended') {
    const text = query.query;
    // Relevance is computed once per place. The sort is stable, so ties keep the recommended order.
    const relevance = new Map(result.map((p) => [p, searchRelevance(p, text)]));
    result = [...result].sort((a, b) => relevance.get(b)! - relevance.get(a)!);
  }
  return query.limit !== undefined ? result.slice(0, Math.max(0, query.limit)) : result;
}

/** Number of user-facing filters that are active, for "Filters (3)" badges. */
export function countActiveFilters(filters: PlaceFilters): number {
  let count = 0;
  if (filters.query?.trim()) count += 1;
  if (filters.categoryIds?.length) count += 1;
  if (filters.districts?.length) count += 1;
  if (filters.minRating !== undefined) count += 1;
  if (filters.withPhotosOnly) count += 1;
  if (isValidRadius(filters.maxDistanceKm)) count += 1;
  return count;
}

/** Adds the value if missing, removes it if present. Returns a new array. */
export function toggleInList<T>(list: readonly T[] | undefined, value: T): T[] {
  const current = list ?? [];
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

/**
 * Related places: same primary category scores highest, then any shared category,
 * then the same district. Ties use the recommended order. The place itself is excluded.
 */
export function getRelatedPlaces(place: Place, places: readonly Place[], limit = 6): Place[] {
  const primary = place.categoryIds[0];
  const score = (other: Place) =>
    (other.categoryIds[0] === primary ? 3 : 0) +
    (other.categoryIds.some((c) => place.categoryIds.includes(c)) ? 2 : 0) +
    (other.district === place.district ? 2 : 0);
  return sortPlaces(
    places.filter((p) => p.id !== place.id && score(p) > 0),
    'recommended',
  )
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}
