import type { CategoryId, EntryFee, NewSubmissionInput } from '../types';
import { LIMITS } from './rules';

/**
 * Add-a-spot form state and rules, shared by web and mobile so both validate identically.
 * The data service validates again on submit; these checks give fast, friendly feedback.
 */
export interface SubmissionFormValues {
  name: string;
  categoryIds: CategoryId[];
  shortDescription: string;
  description: string;
  district: string;
  address: string;
  /** Text inputs; empty means not provided. */
  latitude: string;
  longitude: string;
  /** Remote URLs or local image URIs. */
  imageUris: string[];
  /** One note per line. */
  safetyNotes: string;
  openingHours: string;
  feeChoice: 'unknown' | 'free' | 'paid';
  feeAmount: string;
}

export const EMPTY_SUBMISSION_FORM: SubmissionFormValues = {
  name: '',
  categoryIds: [],
  shortDescription: '',
  description: '',
  district: '',
  address: '',
  latitude: '',
  longitude: '',
  imageUris: [],
  safetyNotes: '',
  openingHours: '',
  feeChoice: 'unknown',
  feeAmount: '',
};

export const SUBMISSION_FORM_SECTIONS = [
  'Basics',
  'Location',
  'Photos and safety',
  'Visit info',
] as const;
export const MAX_SUBMISSION_PHOTOS = 4;

export type SubmissionFormErrors = Partial<Record<keyof SubmissionFormValues, string>>;

/** Which section each field (or service error path) belongs to. */
export const SUBMISSION_FIELD_SECTION: Record<string, number> = {
  name: 0,
  categoryIds: 0,
  shortDescription: 0,
  description: 0,
  district: 1,
  address: 1,
  latitude: 1,
  longitude: 1,
  imageUris: 2,
  imageUrls: 2,
  safetyNotes: 2,
  openingHours: 3,
  feeAmount: 3,
  entryFee: 3,
};

const parseCoordinate = (value: string): number | null =>
  value.trim() === '' ? null : Number(value.trim());

export const splitSafetyNotes = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/** Errors for one section, with friendly wording. */
export function validateSubmissionSection(
  section: number,
  form: SubmissionFormValues,
): SubmissionFormErrors {
  const errors: SubmissionFormErrors = {};
  if (section === 0) {
    const name = form.name.trim();
    if (name.length < LIMITS.placeName.min)
      errors.name = `Give the place a name of at least ${LIMITS.placeName.min} characters.`;
    else if (name.length > LIMITS.placeName.max)
      errors.name = `Keep the name under ${LIMITS.placeName.max} characters.`;
    if (form.categoryIds.length === 0) errors.categoryIds = 'Choose at least one category.';
    else if (form.categoryIds.length > LIMITS.categoriesPerPlace.max) {
      errors.categoryIds = `Choose up to ${LIMITS.categoriesPerPlace.max} categories.`;
    }
    const short = form.shortDescription.trim();
    if (short.length < LIMITS.shortDescription.min)
      errors.shortDescription = `Write at least ${LIMITS.shortDescription.min} characters.`;
    else if (short.length > LIMITS.shortDescription.max)
      errors.shortDescription = `Keep it under ${LIMITS.shortDescription.max} characters.`;
    if (form.description.length > LIMITS.description.max)
      errors.description = 'This description is too long.';
  }
  if (section === 1) {
    if (!form.district) errors.district = 'Choose the district.';
    const lat = parseCoordinate(form.latitude);
    const lng = parseCoordinate(form.longitude);
    if ((lat === null) !== (lng === null)) {
      errors.latitude = 'Enter both latitude and longitude, or leave both empty.';
    } else if (lat !== null && lng !== null) {
      if (!Number.isFinite(lat) || lat < -90 || lat > 90)
        errors.latitude = 'Latitude must be between -90 and 90.';
      if (!Number.isFinite(lng) || lng < -180 || lng > 180)
        errors.longitude = 'Longitude must be between -180 and 180.';
    }
  }
  if (section === 2) {
    if (form.imageUris.length > MAX_SUBMISSION_PHOTOS)
      errors.imageUris = `Add up to ${MAX_SUBMISSION_PHOTOS} photos.`;
    const notes = splitSafetyNotes(form.safetyNotes);
    if (notes.length > 5) errors.safetyNotes = 'Add up to 5 notes, one per line.';
    else if (notes.some((n) => n.length > 200))
      errors.safetyNotes = 'Keep each note under 200 characters.';
  }
  if (section === 3) {
    if (form.openingHours.trim() && form.openingHours.trim().length < 3)
      errors.openingHours = 'Add a little more detail.';
    if (form.feeChoice === 'paid') {
      const amount = Number(form.feeAmount);
      if (!form.feeAmount.trim() || !Number.isFinite(amount) || amount <= 0)
        errors.feeAmount = 'Enter the fee in rupees.';
    }
  }
  return errors;
}

export function validateSubmissionForm(form: SubmissionFormValues): SubmissionFormErrors {
  return SUBMISSION_FORM_SECTIONS.reduce<SubmissionFormErrors>(
    (all, _, index) => ({ ...all, ...validateSubmissionSection(index, form) }),
    {},
  );
}

/** First section containing an error, so the UI can send the user there. */
export function firstErrorSection(errors: Record<string, string | undefined>): number {
  const sections = Object.keys(errors)
    .filter((k) => errors[k])
    .map((k) => SUBMISSION_FIELD_SECTION[k] ?? 0);
  return sections.length ? Math.min(...sections) : 0;
}

/** Converts form values into the data service input. Unknown facts stay null. */
export function toNewSubmissionInput(
  form: SubmissionFormValues,
  submittedBy: string,
): NewSubmissionInput {
  const entryFee: EntryFee | null =
    form.feeChoice === 'free'
      ? { kind: 'free' }
      : form.feeChoice === 'paid'
        ? { kind: 'paid', amount: Number(form.feeAmount), currency: 'INR', note: null }
        : null;
  return {
    submittedBy,
    place: {
      name: form.name,
      shortDescription: form.shortDescription,
      description: form.description || null,
      categoryIds: form.categoryIds,
      district: form.district,
      address: form.address || null,
      latitude: parseCoordinate(form.latitude),
      longitude: parseCoordinate(form.longitude),
      imageUrls: form.imageUris,
      safetyNotes: splitSafetyNotes(form.safetyNotes),
      openingHours: form.openingHours || null,
      entryFee,
    },
  };
}

/** Maps data-service issue paths (e.g. "place.imageUrls") to form fields. */
export function issuesToSubmissionErrors(
  issues: { path: string; message: string }[],
): SubmissionFormErrors {
  const errors: SubmissionFormErrors = {};
  for (const issue of issues) {
    const field = issue.path.split('.').pop() ?? '';
    const key = (
      field === 'imageUrls' ? 'imageUris' : field === 'entryFee' ? 'feeAmount' : field
    ) as keyof SubmissionFormValues;
    errors[key] ??= issue.message;
  }
  return errors;
}

/** True when a section has something filled in and no errors. Used for progress indicators. */
export function isSubmissionSectionComplete(section: number, form: SubmissionFormValues): boolean {
  const filled = [
    () =>
      form.name.trim() !== '' && form.categoryIds.length > 0 && form.shortDescription.trim() !== '',
    () => form.district !== '',
    () => form.imageUris.length > 0 || form.safetyNotes.trim() !== '',
    () => form.openingHours.trim() !== '' || form.feeChoice !== 'unknown',
  ][section];
  return Boolean(filled?.()) && Object.keys(validateSubmissionSection(section, form)).length === 0;
}
