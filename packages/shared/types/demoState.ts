import type { Place } from './place';
import type { Review } from './review';
import type { Submission } from './submission';

export const DEMO_STATE_SCHEMA_VERSION = 1;

/**
 * Everything the user changed on this device. Seed JSON is never modified;
 * the app shows seed data with this state layered on top.
 */
export interface DemoState {
  schemaVersion: typeof DEMO_STATE_SCHEMA_VERSION;
  /** Reviews written on this device. */
  addedReviews: Review[];
  /** Submissions created on this device, with their current status. */
  addedSubmissions: Submission[];
  /** Status changes to seed submissions, keyed by submission id. */
  submissionUpdates: Record<
    string,
    Pick<Submission, 'status' | 'reviewerNote' | 'approvedPlaceId' | 'updatedAt'>
  >;
  /** Places created when a submission was approved on this device. */
  createdPlaces: Place[];
  /** Saved place ids, most recently saved first. */
  savedPlaceIds: string[];
}

/** How the demo state was loaded. Shown in the UI so users know data is local. */
export type DemoStorageStatus = 'persistent' | 'memory-only' | 'recovered-from-corruption';
