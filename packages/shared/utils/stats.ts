import type { Place, Review } from '../types';
import { LIMITS } from './rules';
import { averageOf } from './validation';

/** A rating that may count towards a summary: a whole number from 1 to 5. */
export function isValidRating(rating: unknown): rating is number {
  return (
    typeof rating === 'number' &&
    Number.isInteger(rating) &&
    rating >= LIMITS.rating.min &&
    rating <= LIMITS.rating.max
  );
}

/**
 * The one rating-summary strategy, used everywhere:
 * averageRating and reviewCount are always recomputed from reviews and never taken from a
 * stored value. Only valid ratings (whole numbers 1 to 5) count. The average is the plain
 * mean rounded to one decimal, or null with no valid reviews. Ranking uses bayesianRating.
 */
export function withReviewStats(places: readonly Place[], reviews: readonly Review[]): Place[] {
  const ratingsByPlace = new Map<string, number[]>();
  for (const review of reviews) {
    if (!isValidRating(review.rating)) continue;
    const list = ratingsByPlace.get(review.placeId) ?? [];
    list.push(review.rating);
    ratingsByPlace.set(review.placeId, list);
  }
  return places.map((place) => {
    const ratings = ratingsByPlace.get(place.id) ?? [];
    return { ...place, averageRating: averageOf(ratings), reviewCount: ratings.length };
  });
}

/** Lowercase, hyphenated slug from a name: "Sunset Ridge (demo)" becomes "sunset-ridge-demo". */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** A slug not in `taken`, adding "-2", "-3"… when needed. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const root = slugify(base) || 'place';
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
