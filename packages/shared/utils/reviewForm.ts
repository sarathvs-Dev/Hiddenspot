import type { NewReviewInput, SubmissionStatus } from '../types';
import { isDemoDataError } from '../services/errors';
import { LIMITS } from './rules';
import { STATUSES_REQUIRING_NOTE } from './status';

/**
 * Review and moderation-note rules, shared by the data service, web and mobile, so every
 * surface accepts and rejects exactly the same input with the same messages.
 */
export interface ReviewFormValues {
  /** 0 means not chosen yet. */
  rating: number;
  title: string;
  body: string;
  /** "YYYY-MM" or empty. */
  visitedOn: string;
}

export type ReviewFormField = 'rating' | 'title' | 'body' | 'visitedOn';
export type ReviewFormErrors = Partial<Record<ReviewFormField | 'form', string>>;

export const EMPTY_REVIEW_FORM: ReviewFormValues = {
  rating: 0,
  title: '',
  body: '',
  visitedOn: '',
};

const pad = (n: number) => String(n).padStart(2, '0');
const monthOf = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

/** Field errors for a review. Empty when valid. `now` decides which visit months are in the future. */
export function validateReviewFields(
  values: {
    rating: unknown;
    title?: string | null;
    body?: string | null;
    visitedOn?: string | null;
  },
  now: Date = new Date(),
): Partial<Record<ReviewFormField, string>> {
  const errors: Partial<Record<ReviewFormField, string>> = {};
  const { min, max } = LIMITS.rating;
  const rating = values.rating;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < min || rating > max) {
    errors.rating = `Choose a rating from ${min} to ${max} stars.`;
  }
  const body = values.body?.trim() ?? '';
  if (body.length < LIMITS.reviewBody.min)
    errors.body = `Write at least ${LIMITS.reviewBody.min} characters.`;
  else if (body.length > LIMITS.reviewBody.max)
    errors.body = `Keep it under ${LIMITS.reviewBody.max} characters.`;
  const title = values.title?.trim() ?? '';
  if (title.length > LIMITS.reviewTitle.max)
    errors.title = `Keep the title under ${LIMITS.reviewTitle.max} characters.`;
  const visitedOn = values.visitedOn?.trim() ?? '';
  if (visitedOn) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(visitedOn)) errors.visitedOn = 'Use the format YYYY-MM.';
    else if (visitedOn > monthOf(now))
      errors.visitedOn = 'The visit month cannot be in the future.';
  }
  return errors;
}

/** Converts form values to service input, trimming text and turning empty optionals into null. */
export function toNewReviewInput(
  values: ReviewFormValues,
  placeId: string,
  userId: string,
): NewReviewInput {
  return {
    placeId,
    userId,
    rating: values.rating,
    title: values.title.trim() || null,
    body: values.body.trim(),
    visitedOn: values.visitedOn.trim() || null,
  };
}

/** Friendly form errors for a failed save, whatever the platform. */
export function reviewErrorsFromError(error: unknown): ReviewFormErrors {
  if (isDemoDataError(error) && error.code === 'CONFLICT') {
    return { form: 'You have already reviewed this place. Each person can leave one review.' };
  }
  if (isDemoDataError(error) && error.issues.length) {
    const errors: ReviewFormErrors = {};
    for (const issue of error.issues) {
      const field = issue.path.split('.').pop() as ReviewFormField;
      errors[field] ??= issue.message;
    }
    return errors;
  }
  return { form: 'The review could not be saved. Please try again.' };
}

/** The last 12 months as "YYYY-MM", newest first, for the "When did you visit?" picker. */
export function recentVisitMonths(now: Date = new Date(), count = 12): string[] {
  return Array.from({ length: count }, (_, i) =>
    monthOf(new Date(now.getFullYear(), now.getMonth() - i, 1)),
  );
}

/** Error for a moderator's note, or undefined when it is acceptable for this decision. */
export function validateModerationNote(
  status: SubmissionStatus,
  note: string | null | undefined,
): string | undefined {
  const text = note?.trim() ?? '';
  const { min, max } = LIMITS.reviewerNote;
  if (text.length > max) return `Keep the note under ${max} characters.`;
  if (STATUSES_REQUIRING_NOTE.includes(status) && text.length < min) {
    return `Write a short note of at least ${min} characters so the submitter knows why.`;
  }
  return undefined;
}
