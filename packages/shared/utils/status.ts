import type { Tone } from '../theme/components';
import type { SubmissionStatus } from '../types';

export interface StatusMeta {
  label: string;
  tone: Tone;
  /** One friendly sentence explaining what happens next. */
  description: string;
}

export const SUBMISSION_STATUS_META: Record<SubmissionStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    tone: 'neutral',
    description: 'Only you can see this. Finish it whenever you are ready.',
  },
  submitted: {
    label: 'Pending review',
    tone: 'info',
    description: 'Thanks for sharing. It is waiting in the review queue.',
  },
  in_review: {
    label: 'In review',
    tone: 'warning',
    description: 'A moderator is checking the details right now.',
  },
  changes_requested: {
    label: 'Changes requested',
    tone: 'highlight',
    description: 'Almost there. A small update is needed before it goes live.',
  },
  approved: {
    label: 'Approved',
    tone: 'success',
    description: 'Live on HiddenSpot. Thank you for helping others explore.',
  },
  rejected: {
    label: 'Not accepted',
    tone: 'danger',
    description: 'This spot could not be published. See the note for details.',
  },
};

export function getSubmissionStatusMeta(status: SubmissionStatus): StatusMeta {
  return SUBMISSION_STATUS_META[status];
}

export type SubmissionActor = 'submitter' | 'moderator';

/** Allowed status changes and who may make them. Approved and rejected are final. */
export const SUBMISSION_TRANSITIONS: Record<
  SubmissionStatus,
  { to: SubmissionStatus; by: SubmissionActor }[]
> = {
  draft: [{ to: 'submitted', by: 'submitter' }],
  // A moderator can decide straight from the pending queue, or start a review first.
  submitted: [
    { to: 'in_review', by: 'moderator' },
    { to: 'approved', by: 'moderator' },
    { to: 'rejected', by: 'moderator' },
  ],
  in_review: [
    { to: 'approved', by: 'moderator' },
    { to: 'changes_requested', by: 'moderator' },
    { to: 'rejected', by: 'moderator' },
  ],
  changes_requested: [{ to: 'submitted', by: 'submitter' }],
  approved: [],
  rejected: [],
};

/** The rule for moving from one status to another, or undefined when not allowed. */
export function findSubmissionTransition(from: SubmissionStatus, to: SubmissionStatus) {
  return SUBMISSION_TRANSITIONS[from].find((t) => t.to === to);
}

/** Statuses that require a reviewer note explaining the decision. */
export const STATUSES_REQUIRING_NOTE: readonly SubmissionStatus[] = [
  'changes_requested',
  'rejected',
];
