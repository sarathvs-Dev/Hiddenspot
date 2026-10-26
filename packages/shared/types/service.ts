import type { Category } from './category';
import type { DemoStorageStatus } from './demoState';
import type { PlaceFilters, PlaceQuery, PlaceSortOption } from './filters';
import type { ReferenceLocation, ReferenceLocationPreset } from './location';
import type { Place } from './place';
import type { NewReviewInput, ReviewWithAuthor } from './review';
import type { NewSubmissionInput, Submission, SubmissionStatusUpdate } from './submission';
import type { DemoUser } from './user';

/** Minimal async-capable storage: localStorage on web, AsyncStorage on mobile, memory in tests. */
export interface KeyValueStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem?(key: string): void | Promise<void>;
}

/**
 * The only way UI code reads or changes data. The Phase 1 implementation uses seed JSON
 * plus local demo state; an API-backed implementation can replace it later.
 */
export interface HiddenSpotDataService {
  /* Places */
  getPlaces(query?: PlaceQuery): Promise<Place[]>;
  getPlaceById(id: string): Promise<Place | null>;
  searchPlaces(text: string, query?: Omit<PlaceQuery, 'query'>): Promise<Place[]>;
  filterPlaces(filters: PlaceFilters): Promise<Place[]>;
  /** Pure and synchronous, so screens can re-sort without another request. */
  sortPlaces(
    places: readonly Place[],
    sortBy: PlaceSortOption,
    reference?: ReferenceLocation | null,
  ): Place[];
  getCategories(): Promise<Category[]>;
  /** Districts that have at least one visible place, alphabetically. */
  getDistricts(): Promise<string[]>;
  /** Places that share a category or district with this one, best first. */
  getRelatedPlaces(placeId: string, limit?: number): Promise<Place[]>;
  /** Named demo locations used when device location is unavailable. */
  getReferenceLocations(): Promise<ReferenceLocationPreset[]>;

  /* Reviews */
  getReviewsForPlace(placeId: string): Promise<ReviewWithAuthor[]>;
  addDemoReview(input: NewReviewInput): Promise<ReviewWithAuthor>;

  /* Submissions */
  getSubmissions(filter?: { submittedBy?: string }): Promise<Submission[]>;
  addDemoSubmission(input: NewSubmissionInput): Promise<Submission>;
  updateDemoSubmissionStatus(id: string, update: SubmissionStatusUpdate): Promise<Submission>;

  /* Saved places */
  getSavedPlaces(): Promise<Place[]>;
  getSavedPlaceIds(): Promise<string[]>;
  /** Returns whether the place is saved after the toggle. */
  toggleSavedPlace(placeId: string): Promise<{ saved: boolean; savedPlaceIds: string[] }>;
  clearSavedPlaces(): Promise<void>;

  /* Users and demo state */
  getDemoUsers(): Promise<DemoUser[]>;
  getCurrentUser(): Promise<DemoUser>;
  getStorageStatus(): Promise<DemoStorageStatus>;
  /** Removes all local demo changes and returns to the seed data. */
  resetDemoState(): Promise<void>;

  /** Notifies when demo state changes, so screens can refresh. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Increments on every change. Useful as a cache key. */
  getVersion(): number;
}

export interface AppServices {
  data: HiddenSpotDataService;
}
