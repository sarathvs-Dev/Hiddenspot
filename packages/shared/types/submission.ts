import type { CategoryId } from './category';
import type { EntryFee } from './place';

/** Lifecycle of a user-submitted place. */
export const SUBMISSION_STATUSES = [
  'draft',
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'rejected',
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/** The place details a user proposes. Optional facts are null, never guessed. */
export interface PlaceDraft {
  name: string;
  shortDescription: string;
  description: string | null;
  categoryIds: CategoryId[];
  district: string;
  state: string;
  country: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  /** http(s) URLs or local image URIs (file:, content:, ph:) picked on the device. */
  imageUrls: string[];
  /** Optional visitor information. Missing or null means not provided. */
  safetyNotes?: string[];
  openingHours?: string | null;
  entryFee?: EntryFee | null;
}

export interface Submission {
  id: string;
  /** DemoUser id. */
  submittedBy: string;
  status: SubmissionStatus;
  place: PlaceDraft;
  /** Required for changes_requested and rejected. */
  reviewerNote: string | null;
  /** Set when approved: the id of the place it became. */
  approvedPlaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Input for a new submission. Optional fields default to null or empty. */
export interface NewSubmissionInput {
  submittedBy: string;
  place: Pick<PlaceDraft, 'name' | 'shortDescription' | 'categoryIds' | 'district'> &
    Partial<Omit<PlaceDraft, 'name' | 'shortDescription' | 'categoryIds' | 'district'>>;
  /** Save as a draft instead of submitting for review. */
  asDraft?: boolean;
}

export interface SubmissionStatusUpdate {
  status: SubmissionStatus;
  /** DemoUser making the change. Moderation steps need a moderator. */
  actorId: string;
  reviewerNote?: string | null;
}
