import type { CategoryId } from './category';

export const MODERATION_STATUSES = ['pending', 'approved', 'rejected', 'hidden'] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

/** `null` on a Place means the fee is unknown, which is different from free. */
export type EntryFee =
  { kind: 'free' } | { kind: 'paid'; amount: number; currency: 'INR'; note: string | null };

export const LOCATION_PRECISIONS = ['site', 'area'] as const;
/** "site" points at the place itself. "area" is the centre of a village, town or protected area. */
export type LocationPrecision = (typeof LOCATION_PRECISIONS)[number];

/** Where a fact came from. Seed coordinates need two agreeing sources. */
export interface PlaceSource {
  field: 'coordinates';
  /** e.g. "Wikipedia" or "OpenStreetMap". */
  name: string;
  /** Null for sources without a public page, such as an approved demo submission. */
  url: string | null;
  /** "YYYY-MM-DD". */
  retrievedOn: string;
}

/**
 * A destination. Unknown facts are `null`, never placeholders:
 * no invented coordinates, addresses, hours or fees.
 */
export interface Place {
  /** Stable id, "pl-" plus the slug. Referenced by reviews, submissions and saved places. */
  id: string;
  /** URL-safe, unique, lowercase with hyphens. */
  slug: string;
  name: string;
  /** One line, up to 160 characters. Always present. */
  shortDescription: string;
  /** Longer text. Null when not written yet. */
  description: string | null;
  /** One to three categories. The first is the primary category. */
  categoryIds: CategoryId[];
  tags: string[];
  address: string | null;
  district: string;
  state: string;
  country: string;
  /** Null until verified. Latitude and longitude are both set or both null. */
  latitude: number | null;
  longitude: number | null;
  /** Null exactly when coordinates are null. */
  locationPrecision: LocationPrecision | null;
  /** May be empty. The first image is the cover. */
  imageUrls: string[];
  /** Average of review ratings, one decimal. Null when there are no reviews. */
  averageRating: number | null;
  reviewCount: number;
  /** Demo engagement metric used for "popular" sorting. Synthetic in Phase 1. */
  popularityCount: number;
  /** ISO 8601. */
  createdAt: string;
  openingHours: string | null;
  entryFee: EntryFee | null;
  bestTimeToVisit: string | null;
  safetyNotes: string[];
  moderationStatus: ModerationStatus;
  /** DemoUser id of the creator. */
  createdBy: string;
  /** True for fictional places invented for demos. Their names also end in "(demo)". */
  isSyntheticDemo: boolean;
  /** Provenance for verified facts. Coordinates must cite at least one source. */
  sources: PlaceSource[];
}
