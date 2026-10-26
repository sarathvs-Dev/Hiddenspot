import { isKeralaDistrict } from '../data/kerala';
import {
  CATEGORY_ICON_KEYS,
  CATEGORY_IDS,
  DEMO_STATE_SCHEMA_VERSION,
  LOCATION_PRECISIONS,
  MODERATION_STATUSES,
  PLACE_SORT_OPTIONS,
  SUBMISSION_STATUSES,
  USER_ROLES,
  type Category,
  type CategoryId,
  type DemoState,
  type DemoUser,
  type EntryFee,
  type Place,
  type PlaceDraft,
  type PlaceQuery,
  type PlaceSortOption,
  type Review,
  type Submission,
  type SubmissionStatus,
  type ValidationIssue,
  type ValidationResult,
} from '../types';
import { LIMITS } from './rules';

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

type UnknownRecord = Record<string, unknown>;

export const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isNonEmpty = (v: unknown): v is string => isString(v) && v.trim().length > 0;
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isNullableString = (v: unknown): v is string | null => v === null || isString(v);
const isUrl = (v: unknown): v is string => isString(v) && /^https?:\/\/\S+$/.test(v);
/** Remote images, or local images picked on a device (file:, content:, ph:, assets-library:). */
/**
 * Remote images, or local images picked on a device: file:, content:, ph: and assets-library:
 * on native, blob: and data:image/ in browsers.
 */
const isImageUri = (v: unknown): v is string =>
  isString(v) &&
  /^(https?:\/\/|file:\/\/|content:\/\/|ph:\/\/|assets-library:\/\/|blob:|data:image\/)\S+$/.test(
    v,
  );
const isIsoDate = (v: unknown): v is string => isString(v) && !Number.isNaN(Date.parse(v));
const isMonth = (v: unknown): v is string => isString(v) && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
const isSlug = (v: unknown): v is string => isString(v) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const oneOf =
  <T extends string>(list: readonly T[]) =>
  (v: unknown): v is T =>
    isString(v) && (list as readonly string[]).includes(v);

export const isCategoryId = oneOf<CategoryId>(CATEGORY_IDS);
export const isSubmissionStatus = oneOf<SubmissionStatus>(SUBMISSION_STATUSES);
export const isPlaceSortOption = oneOf<PlaceSortOption>(PLACE_SORT_OPTIONS);

/** Collects issues with a common path prefix. */
class Issues {
  readonly list: ValidationIssue[] = [];
  private readonly base: string;
  constructor(base: string) {
    this.base = base;
  }
  add(field: string, message: string) {
    this.list.push({ path: field ? `${this.base}.${field}` : this.base, message });
  }
  get ok() {
    return this.list.length === 0;
  }
}

function result<T>(issues: Issues | ValidationIssue[], value: T): ValidationResult<T> {
  const list = Array.isArray(issues) ? issues : issues.list;
  return list.length === 0 ? { ok: true, value } : { ok: false, issues: list };
}

function checkLength(issues: Issues, field: string, value: unknown, min: number, max: number) {
  if (!isString(value) || value.trim().length < min) {
    issues.add(field, min > 0 ? `must be at least ${min} characters` : 'must be text');
  } else if (value.length > max) {
    issues.add(field, `must be at most ${max} characters`);
  }
}

/** Latitude and longitude must both be null, or both be valid numbers. */
function checkCoordinates(issues: Issues, lat: unknown, lng: unknown) {
  if (lat === null && lng === null) return;
  if (lat === null || lng === null) {
    issues.add('latitude', 'latitude and longitude must both be set or both be null');
    return;
  }
  if (!isNumber(lat) || lat < -90 || lat > 90) issues.add('latitude', 'must be between -90 and 90');
  if (!isNumber(lng) || lng < -180 || lng > 180)
    issues.add('longitude', 'must be between -180 and 180');
}

function checkDistrict(issues: Issues, district: unknown, state: unknown) {
  if (!isNonEmpty(district)) issues.add('district', 'is required');
  else if (state === 'Kerala' && !isKeralaDistrict(district)) {
    issues.add('district', `"${district}" is not a Kerala district`);
  }
}

function checkCategories(issues: Issues, value: unknown) {
  const { min, max } = LIMITS.categoriesPerPlace;
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    issues.add('categoryIds', `must list ${min} to ${max} categories`);
  } else if (!value.every(isCategoryId)) {
    issues.add('categoryIds', 'contains an unknown category');
  } else if (new Set(value).size !== value.length) {
    issues.add('categoryIds', 'must not repeat a category');
  }
}

function checkImages(issues: Issues, value: unknown) {
  if (!Array.isArray(value) || !value.every(isImageUri))
    issues.add('imageUrls', 'must be a list of image URLs');
  else if (value.length > LIMITS.imagesPerPlace.max) {
    issues.add('imageUrls', `must have at most ${LIMITS.imagesPerPlace.max} images`);
  }
}

/** Throws away duplicates while keeping the first occurrence. */
function checkUnique<T>(items: T[], key: (item: T) => string, label: string): ValidationIssue[] {
  const seen = new Set<string>();
  const issues: ValidationIssue[] = [];
  items.forEach((item, index) => {
    const k = key(item);
    if (seen.has(k)) issues.push({ path: `${label}[${index}]`, message: `duplicate "${k}"` });
    seen.add(k);
  });
  return issues;
}

function validateList<T>(
  input: unknown,
  label: string,
  one: (item: unknown, path: string) => ValidationResult<T>,
): ValidationResult<T[]> {
  if (!Array.isArray(input))
    return { ok: false, issues: [{ path: label, message: 'must be an array' }] };
  const issues: ValidationIssue[] = [];
  const values: T[] = [];
  input.forEach((item, index) => {
    const r = one(item, `${label}[${index}]`);
    if (r.ok) values.push(r.value);
    else issues.push(...r.issues);
  });
  return result(issues, values);
}

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

export function validateCategory(input: unknown, path = 'category'): ValidationResult<Category> {
  const issues = new Issues(path);
  if (!isRecord(input)) return { ok: false, issues: [{ path, message: 'must be an object' }] };
  if (!isCategoryId(input.id)) issues.add('id', 'must be a known category id');
  if (!isSlug(input.slug)) issues.add('slug', 'must be a lowercase slug');
  if (!isNonEmpty(input.name)) issues.add('name', 'is required');
  if (!isNonEmpty(input.description)) issues.add('description', 'is required');
  if (!oneOf(CATEGORY_ICON_KEYS)(input.icon)) issues.add('icon', 'must be a known icon key');
  if (!isNumber(input.sortOrder)) issues.add('sortOrder', 'must be a number');
  return result(issues, input as unknown as Category);
}

function validateEntryFee(issues: Issues, fee: unknown): fee is EntryFee | null {
  if (fee === null) return true;
  if (!isRecord(fee)) return (issues.add('entryFee', 'must be null or an object'), false);
  if (fee.kind === 'free') return true;
  if (
    fee.kind === 'paid' &&
    isNumber(fee.amount) &&
    fee.amount >= 0 &&
    fee.currency === 'INR' &&
    isNullableString(fee.note)
  ) {
    return true;
  }
  issues.add('entryFee', 'must be { kind: "free" } or a paid fee in INR');
  return false;
}

export function validatePlace(input: unknown, path = 'place'): ValidationResult<Place> {
  const issues = new Issues(path);
  if (!isRecord(input)) return { ok: false, issues: [{ path, message: 'must be an object' }] };
  const p = input;

  if (!isNonEmpty(p.id) || !p.id.startsWith('pl-')) issues.add('id', 'must start with "pl-"');
  if (!isSlug(p.slug)) issues.add('slug', 'must be a lowercase slug');
  checkLength(issues, 'name', p.name, LIMITS.placeName.min, LIMITS.placeName.max);
  checkLength(
    issues,
    'shortDescription',
    p.shortDescription,
    LIMITS.shortDescription.min,
    LIMITS.shortDescription.max,
  );
  if (p.description !== null)
    checkLength(issues, 'description', p.description, 1, LIMITS.description.max);
  checkCategories(issues, p.categoryIds);
  if (
    !Array.isArray(p.tags) ||
    !p.tags.every(isNonEmpty) ||
    p.tags.length > LIMITS.tagsPerPlace.max
  ) {
    issues.add('tags', `must be up to ${LIMITS.tagsPerPlace.max} non-empty strings`);
  }
  if (!isNullableString(p.address)) issues.add('address', 'must be text or null');
  checkDistrict(issues, p.district, p.state);
  if (!isNonEmpty(p.state)) issues.add('state', 'is required');
  if (!isNonEmpty(p.country)) issues.add('country', 'is required');
  checkCoordinates(issues, p.latitude, p.longitude);
  checkImages(issues, p.imageUrls);

  const { min, max } = LIMITS.rating;
  if (!isNumber(p.reviewCount) || p.reviewCount < 0 || !Number.isInteger(p.reviewCount)) {
    issues.add('reviewCount', 'must be a whole number from 0');
  }
  if (p.averageRating === null) {
    if (p.reviewCount !== 0) issues.add('averageRating', 'must be set when there are reviews');
  } else if (!isNumber(p.averageRating) || p.averageRating < min || p.averageRating > max) {
    issues.add('averageRating', `must be null or between ${min} and ${max}`);
  } else if (p.reviewCount === 0) {
    issues.add('averageRating', 'must be null when there are no reviews');
  }
  if (!isNumber(p.popularityCount) || p.popularityCount < 0)
    issues.add('popularityCount', 'must be 0 or more');
  if (!isIsoDate(p.createdAt)) issues.add('createdAt', 'must be an ISO date');
  if (!isNullableString(p.openingHours)) issues.add('openingHours', 'must be text or null');
  validateEntryFee(issues, p.entryFee);
  if (!isNullableString(p.bestTimeToVisit)) issues.add('bestTimeToVisit', 'must be text or null');
  if (!Array.isArray(p.safetyNotes) || !p.safetyNotes.every(isNonEmpty)) {
    issues.add('safetyNotes', 'must be a list of strings');
  }
  if (!oneOf(MODERATION_STATUSES)(p.moderationStatus))
    issues.add('moderationStatus', 'is not a known status');
  if (!isNonEmpty(p.createdBy)) issues.add('createdBy', 'is required');
  const hasCoordinates = p.latitude !== null && p.longitude !== null;
  if (hasCoordinates && !oneOf(LOCATION_PRECISIONS)(p.locationPrecision)) {
    issues.add('locationPrecision', 'must be "site" or "area" when coordinates are set');
  } else if (!hasCoordinates && p.locationPrecision !== null) {
    issues.add('locationPrecision', 'must be null when coordinates are null');
  }
  if (!Array.isArray(p.sources)) {
    issues.add('sources', 'must be a list');
  } else {
    p.sources.forEach((s: unknown, i: number) => {
      if (
        !isRecord(s) ||
        s.field !== 'coordinates' ||
        !isNonEmpty(s.name) ||
        !(s.url === null || isUrl(s.url)) ||
        !(isString(s.retrievedOn) && /^\d{4}-\d{2}-\d{2}$/.test(s.retrievedOn))
      ) {
        issues.add(`sources[${i}]`, 'must have field, name, url (or null) and retrievedOn');
      }
    });
    if (
      hasCoordinates &&
      !p.sources.some((s: unknown) => isRecord(s) && s.field === 'coordinates')
    ) {
      issues.add('sources', 'coordinates must cite at least one source');
    }
  }
  if (typeof p.isSyntheticDemo !== 'boolean')
    issues.add('isSyntheticDemo', 'must be true or false');
  else if (p.isSyntheticDemo && isString(p.name) && !p.name.endsWith('(demo)')) {
    issues.add('name', 'synthetic demo places must end with "(demo)"');
  }
  return result(issues, input as unknown as Place);
}

export function validateDemoUser(input: unknown, path = 'user'): ValidationResult<DemoUser> {
  const issues = new Issues(path);
  if (!isRecord(input)) return { ok: false, issues: [{ path, message: 'must be an object' }] };
  if (!isNonEmpty(input.id) || !input.id.startsWith('usr-'))
    issues.add('id', 'must start with "usr-"');
  if (!isNonEmpty(input.displayName)) issues.add('displayName', 'is required');
  if (!oneOf(USER_ROLES)(input.role)) issues.add('role', 'is not a known role');
  if (input.avatarUrl !== null && !isUrl(input.avatarUrl))
    issues.add('avatarUrl', 'must be a URL or null');
  if (!isNullableString(input.homeDistrict)) issues.add('homeDistrict', 'must be text or null');
  if (!isIsoDate(input.joinedAt)) issues.add('joinedAt', 'must be an ISO date');
  if (input.isDemo !== true) issues.add('isDemo', 'must be true');
  return result(issues, input as unknown as DemoUser);
}

export function validateReview(input: unknown, path = 'review'): ValidationResult<Review> {
  const issues = new Issues(path);
  if (!isRecord(input)) return { ok: false, issues: [{ path, message: 'must be an object' }] };
  if (!isNonEmpty(input.id)) issues.add('id', 'is required');
  if (!isNonEmpty(input.placeId)) issues.add('placeId', 'is required');
  if (!isNonEmpty(input.userId)) issues.add('userId', 'is required');
  const { min, max } = LIMITS.rating;
  if (
    !isNumber(input.rating) ||
    !Number.isInteger(input.rating) ||
    input.rating < min ||
    input.rating > max
  ) {
    issues.add('rating', `must be a whole number from ${min} to ${max}`);
  }
  if (input.title !== null) checkLength(issues, 'title', input.title, 1, LIMITS.reviewTitle.max);
  checkLength(issues, 'body', input.body, LIMITS.reviewBody.min, LIMITS.reviewBody.max);
  if (input.visitedOn !== null && !isMonth(input.visitedOn))
    issues.add('visitedOn', 'must be "YYYY-MM" or null');
  if (!isIsoDate(input.createdAt)) issues.add('createdAt', 'must be an ISO date');
  if (input.source !== 'seed' && input.source !== 'demo')
    issues.add('source', 'must be "seed" or "demo"');
  return result(issues, input as unknown as Review);
}

export function validatePlaceDraft(input: unknown, path = 'place'): ValidationResult<PlaceDraft> {
  const issues = new Issues(path);
  if (!isRecord(input)) return { ok: false, issues: [{ path, message: 'must be an object' }] };
  checkLength(issues, 'name', input.name, LIMITS.placeName.min, LIMITS.placeName.max);
  checkLength(
    issues,
    'shortDescription',
    input.shortDescription,
    LIMITS.shortDescription.min,
    LIMITS.shortDescription.max,
  );
  if (input.description !== null)
    checkLength(issues, 'description', input.description, 1, LIMITS.description.max);
  checkCategories(issues, input.categoryIds);
  checkDistrict(issues, input.district, input.state);
  if (!isNonEmpty(input.state)) issues.add('state', 'is required');
  if (!isNonEmpty(input.country)) issues.add('country', 'is required');
  if (!isNullableString(input.address)) issues.add('address', 'must be text or null');
  checkCoordinates(issues, input.latitude, input.longitude);
  checkImages(issues, input.imageUrls);
  if (input.safetyNotes !== undefined) {
    if (
      !Array.isArray(input.safetyNotes) ||
      !input.safetyNotes.every(isNonEmpty) ||
      input.safetyNotes.length > 5
    ) {
      issues.add('safetyNotes', 'must be up to 5 notes');
    } else if (input.safetyNotes.some((n: string) => n.length > 200)) {
      issues.add('safetyNotes', 'each note must be at most 200 characters');
    }
  }
  if (input.openingHours !== undefined && input.openingHours !== null) {
    checkLength(issues, 'openingHours', input.openingHours, 3, 120);
  }
  if (input.entryFee !== undefined) validateEntryFee(issues, input.entryFee);
  return result(issues, input as unknown as PlaceDraft);
}

export function validateSubmission(
  input: unknown,
  path = 'submission',
): ValidationResult<Submission> {
  const issues = new Issues(path);
  if (!isRecord(input)) return { ok: false, issues: [{ path, message: 'must be an object' }] };
  if (!isNonEmpty(input.id)) issues.add('id', 'is required');
  if (!isNonEmpty(input.submittedBy)) issues.add('submittedBy', 'is required');
  if (!isSubmissionStatus(input.status)) issues.add('status', 'is not a known status');
  const draft = validatePlaceDraft(input.place, `${path}.place`);
  if (!draft.ok) issues.list.push(...draft.issues);
  if (!isNullableString(input.reviewerNote)) issues.add('reviewerNote', 'must be text or null');
  if (
    (input.status === 'changes_requested' || input.status === 'rejected') &&
    !isNonEmpty(input.reviewerNote)
  ) {
    issues.add('reviewerNote', `is required when status is ${String(input.status)}`);
  }
  if (input.status === 'approved' && !isNonEmpty(input.approvedPlaceId)) {
    issues.add('approvedPlaceId', 'is required when approved');
  }
  if (input.status !== 'approved' && input.approvedPlaceId !== null) {
    issues.add('approvedPlaceId', 'must be null unless approved');
  }
  if (!isIsoDate(input.createdAt)) issues.add('createdAt', 'must be an ISO date');
  if (!isIsoDate(input.updatedAt)) issues.add('updatedAt', 'must be an ISO date');
  return result(issues, input as unknown as Submission);
}

/* ------------------------------------------------------------------ */
/* Seed data: per-file and cross-file integrity                        */
/* ------------------------------------------------------------------ */

export interface SeedData {
  categories: Category[];
  demoUsers: DemoUser[];
  places: Place[];
  reviews: Review[];
  submissions: Submission[];
}

/** Average of ratings rounded to one decimal, or null with no ratings. */
export function averageOf(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10;
}

/**
 * Validates every seed file, then checks the files agree with each other:
 * unique ids and slugs, reviews and submissions point at real places and users,
 * and stored rating totals match the reviews.
 */
export function validateSeedData(raw: Record<keyof SeedData, unknown>): ValidationResult<SeedData> {
  const categories = validateList(raw.categories, 'categories', validateCategory);
  const demoUsers = validateList(raw.demoUsers, 'demoUsers', validateDemoUser);
  const places = validateList(raw.places, 'places', validatePlace);
  const reviews = validateList(raw.reviews, 'reviews', validateReview);
  const submissions = validateList(raw.submissions, 'submissions', validateSubmission);

  const issues: ValidationIssue[] = [];
  for (const r of [categories, demoUsers, places, reviews, submissions])
    if (!r.ok) issues.push(...r.issues);
  if (!categories.ok || !demoUsers.ok || !places.ok || !reviews.ok || !submissions.ok) {
    return { ok: false, issues };
  }

  const seed: SeedData = {
    categories: categories.value,
    demoUsers: demoUsers.value,
    places: places.value,
    reviews: reviews.value,
    submissions: submissions.value,
  };

  issues.push(
    ...checkUnique(seed.categories, (c) => c.id, 'categories'),
    ...checkUnique(seed.demoUsers, (u) => u.id, 'demoUsers'),
    ...checkUnique(seed.places, (p) => p.id, 'places'),
    ...checkUnique(seed.places, (p) => p.slug, 'places.slug'),
    ...checkUnique(seed.reviews, (r) => r.id, 'reviews'),
    ...checkUnique(seed.reviews, (r) => `${r.userId}:${r.placeId}`, 'reviews.userPerPlace'),
    ...checkUnique(seed.submissions, (s) => s.id, 'submissions'),
  );

  const userIds = new Set(seed.demoUsers.map((u) => u.id));
  const placeIds = new Set(seed.places.map((p) => p.id));
  const categoryIds = new Set(seed.categories.map((c) => c.id));

  for (const id of CATEGORY_IDS) {
    if (!categoryIds.has(id))
      issues.push({ path: 'categories', message: `missing category "${id}"` });
  }
  seed.places.forEach((p, i) => {
    if (!userIds.has(p.createdBy))
      issues.push({ path: `places[${i}].createdBy`, message: `unknown user "${p.createdBy}"` });
    if (p.id !== `pl-${p.slug}`)
      issues.push({ path: `places[${i}].id`, message: 'must be "pl-" plus the slug' });
    const own = seed.reviews.filter((r) => r.placeId === p.id);
    if (own.length !== p.reviewCount || averageOf(own.map((r) => r.rating)) !== p.averageRating) {
      issues.push({
        path: `places[${i}]`,
        message: 'averageRating and reviewCount must match its reviews',
      });
    }
  });
  seed.reviews.forEach((r, i) => {
    if (!placeIds.has(r.placeId))
      issues.push({ path: `reviews[${i}].placeId`, message: `unknown place "${r.placeId}"` });
    if (!userIds.has(r.userId))
      issues.push({ path: `reviews[${i}].userId`, message: `unknown user "${r.userId}"` });
    if (r.source !== 'seed')
      issues.push({
        path: `reviews[${i}].source`,
        message: 'seed reviews must have source "seed"',
      });
  });
  seed.submissions.forEach((s, i) => {
    if (!userIds.has(s.submittedBy)) {
      issues.push({
        path: `submissions[${i}].submittedBy`,
        message: `unknown user "${s.submittedBy}"`,
      });
    }
    if (s.approvedPlaceId && !placeIds.has(s.approvedPlaceId)) {
      issues.push({
        path: `submissions[${i}].approvedPlaceId`,
        message: `unknown place "${s.approvedPlaceId}"`,
      });
    }
  });

  return result(issues, seed);
}

/* ------------------------------------------------------------------ */
/* Persisted demo state                                                */
/* ------------------------------------------------------------------ */

export function createEmptyDemoState(): DemoState {
  return {
    schemaVersion: DEMO_STATE_SCHEMA_VERSION,
    addedReviews: [],
    addedSubmissions: [],
    submissionUpdates: {},
    createdPlaces: [],
    savedPlaceIds: [],
  };
}

/**
 * Turns persisted JSON back into DemoState. Invalid entries are dropped one by one
 * rather than discarding everything; `dropped` reports how many were removed.
 * Returns null when the value is not a recognisable DemoState at all.
 */
export function sanitizeDemoState(input: unknown): { state: DemoState; dropped: number } | null {
  if (!isRecord(input) || input.schemaVersion !== DEMO_STATE_SCHEMA_VERSION) return null;
  const state = createEmptyDemoState();
  let dropped = 0;
  const keep = <T>(list: unknown, check: (item: unknown) => ValidationResult<T>): T[] => {
    if (!Array.isArray(list)) return [];
    const kept: T[] = [];
    for (const item of list) {
      const r = check(item);
      if (r.ok) kept.push(r.value);
      else dropped += 1;
    }
    return kept;
  };

  state.addedReviews = keep(input.addedReviews, (r) => validateReview(r)).filter(
    (r) => r.source === 'demo',
  );
  state.addedSubmissions = keep(input.addedSubmissions, (s) => validateSubmission(s));
  state.createdPlaces = keep(input.createdPlaces, (p) => validatePlace(p));
  state.savedPlaceIds = Array.isArray(input.savedPlaceIds)
    ? [...new Set(input.savedPlaceIds.filter(isNonEmpty))]
    : [];
  if (isRecord(input.submissionUpdates)) {
    for (const [id, update] of Object.entries(input.submissionUpdates)) {
      if (
        isRecord(update) &&
        isSubmissionStatus(update.status) &&
        isNullableString(update.reviewerNote) &&
        isNullableString(update.approvedPlaceId) &&
        isIsoDate(update.updatedAt)
      ) {
        state.submissionUpdates[id] = {
          status: update.status,
          reviewerNote: update.reviewerNote,
          approvedPlaceId: update.approvedPlaceId,
          updatedAt: update.updatedAt,
        };
      } else {
        dropped += 1;
      }
    }
  }
  return { state, dropped };
}

/* ------------------------------------------------------------------ */
/* URL and form query params                                           */
/* ------------------------------------------------------------------ */

const toList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isString)
    : isString(value) && value.length > 0
      ? value.split(',')
      : [];

/** Turns loosely typed input such as URL params into a safe PlaceQuery. Invalid values are dropped. */
export function sanitizePlaceQuery(input: UnknownRecord): PlaceQuery {
  const query: PlaceQuery = {};
  if (isNonEmpty(input.query)) query.query = input.query.trim().slice(0, 100);
  const categoryIds = toList(input.categories ?? input.categoryIds).filter(isCategoryId);
  if (categoryIds.length) query.categoryIds = [...new Set(categoryIds)];
  const districts = toList(input.districts).filter(isKeralaDistrict);
  if (districts.length) query.districts = [...new Set(districts)];
  const minRating =
    isString(input.minRating) && input.minRating.trim() ? Number(input.minRating) : input.minRating;
  if (isNumber(minRating) && minRating >= LIMITS.rating.min && minRating <= LIMITS.rating.max) {
    query.minRating = minRating;
  }
  if (input.withPhotosOnly === true || input.withPhotosOnly === 'true') query.withPhotosOnly = true;
  const radius = isString(input.maxDistanceKm) ? Number(input.maxDistanceKm) : input.maxDistanceKm;
  if (isNumber(radius) && radius > 0 && radius <= 1000) query.maxDistanceKm = radius;
  if (isPlaceSortOption(input.sortBy)) query.sortBy = input.sortBy;
  return query;
}

/** Flat string params for a PlaceQuery, the inverse of sanitizePlaceQuery. */
export function serializePlaceQuery(query: PlaceQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.query) params.query = query.query;
  if (query.categoryIds?.length) params.categories = query.categoryIds.join(',');
  if (query.districts?.length) params.districts = query.districts.join(',');
  if (query.minRating !== undefined) params.minRating = String(query.minRating);
  if (query.withPhotosOnly) params.withPhotosOnly = 'true';
  if (query.maxDistanceKm !== undefined) params.maxDistanceKm = String(query.maxDistanceKm);
  if (query.sortBy && query.sortBy !== 'recommended') params.sortBy = query.sortBy;
  return params;
}
