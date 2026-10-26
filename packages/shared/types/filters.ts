import type { CategoryId } from './category';
import type { ReferenceLocation } from './location';

export const PLACE_SORT_OPTIONS = [
  'recommended',
  'rating',
  'popularity',
  'newest',
  'name',
  'distance',
] as const;

export type PlaceSortOption = (typeof PLACE_SORT_OPTIONS)[number];

export interface PlaceFilters {
  /** Free text matched against name, description, district, tags and category names. */
  query?: string;
  /** Match any of these. Empty or missing means all categories. */
  categoryIds?: CategoryId[];
  /** Match any of these districts. */
  districts?: string[];
  /** Places without ratings are excluded when this is set. */
  minRating?: number;
  /** Only places with at least one image. */
  withPhotosOnly?: boolean;
  /**
   * Only places within this many km of the reference location. Places without coordinates
   * are excluded while a radius is set. Ignored when there is no reference location.
   */
  maxDistanceKm?: number;
}

/** Distance radius choices offered by the apps, in km. */
export const DISTANCE_RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;

export interface PlaceQuery extends PlaceFilters {
  sortBy?: PlaceSortOption;
  /** Needed for distance sorting. Places without coordinates sort last. */
  reference?: ReferenceLocation | null;
  limit?: number;
}
