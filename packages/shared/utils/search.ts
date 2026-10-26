import type { Category, CategoryId, Place } from '../types';
import { normalizeText } from './text';

/**
 * Search rules, shared by web and mobile:
 * - Fields searched: name, short and long description, category names, district and address.
 *   State, country and tags are not searched. Every place is in Kerala, so "kerala" would
 *   match everything, and tags overlap with categories and descriptions.
 * - Case and accents are ignored.
 * - Every query word must match the start of a word somewhere in those fields, so "fall"
 *   finds "Falls" but "sea" does not find "season".
 */
export const SEARCHED_PLACE_FIELDS = [
  'name',
  'shortDescription',
  'description',
  'categories',
  'district',
  'address',
] as const;

/** Lowercased, accent-free words, splitting on anything that is not a letter or digit. */
export function searchWords(text: string): string[] {
  return normalizeText(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Every searchable word of a place, normalised. Category names are used when known. */
export function placeSearchWords(
  place: Place,
  categoriesById?: Map<CategoryId, Category>,
): string[] {
  const categoryNames = place.categoryIds.map((id) => categoriesById?.get(id)?.name ?? id);
  return searchWords(
    [
      place.name,
      place.shortDescription,
      place.description ?? '',
      ...categoryNames,
      place.district,
      place.address ?? '',
    ].join(' '),
  );
}

/** True when every query word starts a word of the place. Empty queries match all. */
export function matchesPlaceText(
  place: Place,
  query: string | undefined,
  categoriesById?: Map<CategoryId, Category>,
): boolean {
  const terms = query ? searchWords(query) : [];
  if (terms.length === 0) return true;
  const words = placeSearchWords(place, categoriesById);
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

/**
 * Relevance for a matching place: name prefix beats name match beats district match
 * beats any other field. Used to order search results before the chosen sort.
 */
export function searchRelevance(place: Place, query: string): number {
  const q = normalizeText(query);
  if (!q) return 0;
  const name = normalizeText(place.name);
  if (name.startsWith(q)) return 3;
  if (name.includes(q)) return 2;
  if (normalizeText(place.district).includes(q)) return 1;
  return 0;
}
