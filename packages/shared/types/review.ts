import type { DemoUser } from './user';

/** "seed" reviews ship with the app. "demo" reviews were added on this device. */
export type ReviewSource = 'seed' | 'demo';

/** All reviews in Phase 1 are sample text from demo users, not real visitor feedback. */
export interface Review {
  id: string;
  placeId: string;
  userId: string;
  /** Whole stars from 1 to 5. */
  rating: number;
  title: string | null;
  body: string;
  /** Month of the visit, "YYYY-MM". Null when not given. */
  visitedOn: string | null;
  /** ISO 8601. */
  createdAt: string;
  source: ReviewSource;
}

/** A review joined with its author for display. `author` is null if the user is unknown. */
export interface ReviewWithAuthor extends Review {
  author: DemoUser | null;
}

export interface NewReviewInput {
  placeId: string;
  userId: string;
  rating: number;
  title?: string | null;
  body: string;
  visitedOn?: string | null;
}
