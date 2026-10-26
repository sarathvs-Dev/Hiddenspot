import { RAW_REFERENCE_LOCATIONS, RAW_SEED } from '../data';
import type {
  Category,
  DemoState,
  DemoStorageStatus,
  DemoUser,
  HiddenSpotDataService,
  KeyValueStorage,
  NewReviewInput,
  NewSubmissionInput,
  Place,
  PlaceDraft,
  PlaceFilters,
  PlaceQuery,
  PlaceSortOption,
  ReferenceLocation,
  ReferenceLocationPreset,
  Review,
  ReviewWithAuthor,
  Submission,
  SubmissionStatusUpdate,
  ValidationIssue,
} from '../types';
import { sortCategories } from '../utils/categories';
import { getRelatedPlaces, queryPlaces } from '../utils/filter';
import { compareText, sortPlaces } from '../utils/sort';
import { uniqueSlug, withReviewStats } from '../utils/stats';
import { findSubmissionTransition } from '../utils/status';
import { validateModerationNote, validateReviewFields } from '../utils/reviewForm';
import { normalizeText } from '../utils/text';
import {
  createEmptyDemoState,
  validatePlace,
  validatePlaceDraft,
  validateSeedData,
  type SeedData,
} from '../utils/validation';
import { DemoStateStore } from './demoStateStore';
import { DemoDataError } from './errors';

export interface DemoDataServiceOptions {
  /** Device storage for demo changes. Null keeps everything in memory. */
  storage?: KeyValueStorage | null;
  /** Override seed data, mainly for tests. Validated before use. */
  seed?: Record<keyof SeedData, unknown>;
  /** The demo user acting in the app. There is no real sign-in in Phase 1. */
  currentUserId?: string;
  /** Simulated network latency so loading states are exercised. */
  latencyMs?: number;
  now?: () => Date;
  generateId?: (prefix: string) => string;
}

export const DEFAULT_DEMO_USER_ID = 'usr-anu';

const delay = (ms: number) =>
  ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

/** Deep copy for plain JSON data, so callers can never mutate internal state. */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const defaultId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const trimOrNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Phase 1 data service: immutable seed JSON plus device-local demo state.
 * All business rules live here or in shared utils, so web and mobile behave identically.
 */
export class DemoDataService implements HiddenSpotDataService {
  private readonly seed: SeedData;
  private readonly store: DemoStateStore;
  private readonly currentUserId: string;
  private readonly latencyMs: number;
  private readonly now: () => Date;
  private readonly generateId: (prefix: string) => string;
  private state: DemoState = createEmptyDemoState();
  private loading: Promise<void> | null = null;
  private readonly listeners = new Set<() => void>();
  private version = 0;

  constructor(options: DemoDataServiceOptions = {}) {
    const seed = validateSeedData(options.seed ?? RAW_SEED);
    if (!seed.ok) {
      const details = seed.issues.map((i) => `${i.path} ${i.message}`).join('\n');
      throw new Error(`Invalid HiddenSpot seed data:\n${details}`);
    }
    this.seed = seed.value;
    this.store = new DemoStateStore(options.storage ?? null);
    this.currentUserId = options.currentUserId ?? DEFAULT_DEMO_USER_ID;
    this.latencyMs = options.latencyMs ?? 0;
    this.now = options.now ?? (() => new Date());
    this.generateId = options.generateId ?? defaultId;
    if (!this.seed.demoUsers.some((u) => u.id === this.currentUserId)) {
      throw new Error(`Unknown current demo user "${this.currentUserId}"`);
    }
  }

  /* ---------------- Lifecycle ---------------- */

  private async ready(): Promise<void> {
    this.loading ??= this.store.load().then(({ state }) => {
      this.state = state;
    });
    await this.loading;
    await delay(this.latencyMs);
  }

  /** Applies a change to a copy of the state, persists it, and notifies listeners. */
  private commit(change: (draft: DemoState) => void): Promise<void> {
    const next = clone(this.state);
    change(next);
    this.state = next;
    this.version += 1;
    this.listeners.forEach((listener) => listener());
    return this.store.save(next);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getVersion(): number {
    return this.version;
  }

  async getStorageStatus(): Promise<DemoStorageStatus> {
    await this.ready();
    return this.store.getStatus();
  }

  async resetDemoState(): Promise<void> {
    await this.ready();
    this.state = createEmptyDemoState();
    this.version += 1;
    await this.store.clear();
    this.listeners.forEach((listener) => listener());
  }

  /** A generated id that is not already taken. Retries instead of trusting randomness. */
  private uniqueId(prefix: string, taken: ReadonlySet<string>): string {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const id = this.generateId(prefix);
      if (!taken.has(id)) return id;
    }
    throw new DemoDataError('CONFLICT', 'Could not create a unique id. Please try again.');
  }

  /* ---------------- Derived views ---------------- */

  private allReviews(): Review[] {
    return [...this.seed.reviews, ...this.state.addedReviews];
  }

  private allPlaces(): Place[] {
    return withReviewStats([...this.seed.places, ...this.state.createdPlaces], this.allReviews());
  }

  /** Only approved places are public. */
  private visiblePlaces(): Place[] {
    return this.allPlaces().filter((p) => p.moderationStatus === 'approved');
  }

  private findVisiblePlace(idOrSlug: string): Place | undefined {
    return this.visiblePlaces().find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  }

  private allSubmissions(): Submission[] {
    const seeded = this.seed.submissions.map((s) => ({
      ...s,
      ...this.state.submissionUpdates[s.id],
    }));
    return [...seeded, ...this.state.addedSubmissions];
  }

  private findUser(id: string): DemoUser | undefined {
    return this.seed.demoUsers.find((u) => u.id === id);
  }

  private withAuthor(review: Review): ReviewWithAuthor {
    return { ...review, author: this.findUser(review.userId) ?? null };
  }

  /* ---------------- Places ---------------- */

  async getPlaces(query: PlaceQuery = {}): Promise<Place[]> {
    await this.ready();
    return clone(queryPlaces(this.visiblePlaces(), query, this.seed.categories));
  }

  async getPlaceById(id: string): Promise<Place | null> {
    await this.ready();
    const place = this.findVisiblePlace(id);
    return place ? clone(place) : null;
  }

  searchPlaces(text: string, query: Omit<PlaceQuery, 'query'> = {}): Promise<Place[]> {
    return this.getPlaces({ ...query, query: text });
  }

  filterPlaces(filters: PlaceFilters): Promise<Place[]> {
    return this.getPlaces(filters);
  }

  sortPlaces(
    places: readonly Place[],
    sortBy: PlaceSortOption,
    reference?: ReferenceLocation | null,
  ): Place[] {
    return sortPlaces(places, sortBy, { reference: reference ?? null });
  }

  async getCategories(): Promise<Category[]> {
    await this.ready();
    return clone(sortCategories(this.seed.categories));
  }

  async getRelatedPlaces(placeId: string, limit = 6): Promise<Place[]> {
    await this.ready();
    const place = this.findVisiblePlace(placeId);
    if (!place) throw new DemoDataError('NOT_FOUND', `Place "${placeId}" was not found.`);
    return clone(getRelatedPlaces(place, this.visiblePlaces(), limit));
  }

  async getReferenceLocations(): Promise<ReferenceLocationPreset[]> {
    await this.ready();
    return clone(RAW_REFERENCE_LOCATIONS as ReferenceLocationPreset[]);
  }

  async getDistricts(): Promise<string[]> {
    await this.ready();
    return [...new Set(this.visiblePlaces().map((p) => p.district))].sort(compareText);
  }

  /* ---------------- Reviews ---------------- */

  async getReviewsForPlace(placeId: string): Promise<ReviewWithAuthor[]> {
    await this.ready();
    const place = this.findVisiblePlace(placeId);
    if (!place) throw new DemoDataError('NOT_FOUND', `Place "${placeId}" was not found.`);
    return clone(
      this.allReviews()
        .filter((r) => r.placeId === place.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || (a.id < b.id ? 1 : -1))
        .map((r) => this.withAuthor(r)),
    );
  }

  async addDemoReview(input: NewReviewInput): Promise<ReviewWithAuthor> {
    await this.ready();
    // Same rules and messages as the web and mobile review forms.
    const fieldErrors = validateReviewFields(input, this.now());
    const issues: ValidationIssue[] = Object.entries(fieldErrors).map(([field, message]) => ({
      path: `review.${field}`,
      message: message as string,
    }));
    const title = trimOrNull(input.title);
    const body = input.body?.trim() ?? '';
    const visitedOn = trimOrNull(input.visitedOn);
    if (!this.findUser(input.userId)) {
      issues.push({ path: 'review.userId', message: 'Unknown demo user.' });
    }
    if (issues.length)
      throw new DemoDataError('VALIDATION', 'The review needs a few fixes.', issues);

    const place = this.findVisiblePlace(input.placeId);
    if (!place) throw new DemoDataError('NOT_FOUND', `Place "${input.placeId}" was not found.`);
    if (this.allReviews().some((r) => r.placeId === place.id && r.userId === input.userId)) {
      throw new DemoDataError('CONFLICT', 'You have already reviewed this place.');
    }

    const review: Review = {
      id: this.uniqueId('rv-demo', new Set(this.allReviews().map((r) => r.id))),
      placeId: place.id,
      userId: input.userId,
      rating: input.rating,
      title,
      body,
      visitedOn,
      createdAt: this.now().toISOString(),
      source: 'demo',
    };
    await this.commit((s) => {
      s.addedReviews.push(review);
    });
    return clone(this.withAuthor(review));
  }

  /* ---------------- Submissions ---------------- */

  async getSubmissions(filter: { submittedBy?: string } = {}): Promise<Submission[]> {
    await this.ready();
    return clone(
      this.allSubmissions()
        .filter((s) => !filter.submittedBy || s.submittedBy === filter.submittedBy)
        .sort(
          (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || (a.id < b.id ? -1 : 1),
        ),
    );
  }

  /** Fills defaults and trims text, without guessing any unknown facts. */
  private normalizeDraft(input: NewSubmissionInput['place']): PlaceDraft {
    return {
      name: input.name?.trim() ?? '',
      shortDescription: input.shortDescription?.trim() ?? '',
      description: trimOrNull(input.description),
      categoryIds: [...new Set(input.categoryIds ?? [])],
      district: input.district?.trim() ?? '',
      state: input.state?.trim() || 'Kerala',
      country: input.country?.trim() || 'India',
      address: trimOrNull(input.address),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      imageUrls: (input.imageUrls ?? []).map((u) => u.trim()).filter(Boolean),
      safetyNotes: (input.safetyNotes ?? []).map((n) => n.trim()).filter(Boolean),
      openingHours: trimOrNull(input.openingHours),
      entryFee: input.entryFee ?? null,
    };
  }

  /** Same name in the same district, ignoring case and accents. */
  private isDuplicateName(draft: PlaceDraft, ignoreSubmissionId?: string): boolean {
    const key = `${normalizeText(draft.name)}|${draft.district}`;
    const places = this.visiblePlaces().some(
      (p) => `${normalizeText(p.name)}|${p.district}` === key,
    );
    const open = this.allSubmissions().some(
      (s) =>
        s.id !== ignoreSubmissionId &&
        s.status !== 'rejected' &&
        s.status !== 'approved' &&
        `${normalizeText(s.place.name)}|${s.place.district}` === key,
    );
    return places || open;
  }

  async addDemoSubmission(input: NewSubmissionInput): Promise<Submission> {
    await this.ready();
    if (!this.findUser(input.submittedBy)) {
      throw new DemoDataError('VALIDATION', 'Unknown demo user.', [
        { path: 'submission.submittedBy', message: 'Unknown demo user.' },
      ]);
    }
    const draft = this.normalizeDraft(input.place);
    const check = validatePlaceDraft(draft, 'place');
    if (!check.ok)
      throw new DemoDataError('VALIDATION', 'The submission needs a few fixes.', check.issues);
    if (this.isDuplicateName(draft)) {
      throw new DemoDataError(
        'CONFLICT',
        'A place with this name is already listed or under review in this district.',
        [{ path: 'place.name', message: 'Already listed or under review in this district.' }],
      );
    }

    const timestamp = this.now().toISOString();
    const submission: Submission = {
      id: this.uniqueId('sub-demo', new Set(this.allSubmissions().map((s) => s.id))),
      submittedBy: input.submittedBy,
      status: input.asDraft ? 'draft' : 'submitted',
      place: draft,
      reviewerNote: null,
      approvedPlaceId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.commit((s) => {
      s.addedSubmissions.push(submission);
    });
    return clone(submission);
  }

  async updateDemoSubmissionStatus(
    id: string,
    update: SubmissionStatusUpdate,
  ): Promise<Submission> {
    await this.ready();
    const current = this.allSubmissions().find((s) => s.id === id);
    if (!current) throw new DemoDataError('NOT_FOUND', `Submission "${id}" was not found.`);
    const actor = this.findUser(update.actorId);
    if (!actor) throw new DemoDataError('FORBIDDEN', 'Unknown demo user.');

    const transition = findSubmissionTransition(current.status, update.status);
    if (!transition) {
      throw new DemoDataError(
        'INVALID_TRANSITION',
        `A submission cannot move from "${current.status}" to "${update.status}".`,
      );
    }
    const isModerator = actor.role === 'moderator' || actor.role === 'curator';
    if (transition.by === 'moderator' && !isModerator) {
      throw new DemoDataError('FORBIDDEN', 'Only a moderator can make this change.');
    }
    if (transition.by === 'submitter' && actor.id !== current.submittedBy) {
      throw new DemoDataError('FORBIDDEN', 'Only the person who submitted this place can do that.');
    }

    const note = trimOrNull(update.reviewerNote);
    const noteError = validateModerationNote(update.status, note);
    if (noteError) {
      throw new DemoDataError('VALIDATION', 'Add a short note explaining the decision.', [
        { path: 'submission.reviewerNote', message: noteError },
      ]);
    }
    if (update.status === 'submitted' && this.isDuplicateName(current.place, current.id)) {
      throw new DemoDataError(
        'CONFLICT',
        'A place with this name is already listed in this district.',
      );
    }

    const timestamp = this.now().toISOString();
    let createdPlace: Place | null = null;
    if (update.status === 'approved') {
      createdPlace = this.placeFromSubmission(current, timestamp);
      const check = validatePlace(createdPlace);
      if (!check.ok)
        throw new DemoDataError('VALIDATION', 'The approved place is not valid.', check.issues);
    }

    const changes = {
      status: update.status,
      // Resubmitting clears the old reviewer note; other moves record the new one.
      reviewerNote: update.status === 'submitted' ? null : (note ?? current.reviewerNote),
      approvedPlaceId: createdPlace?.id ?? null,
      updatedAt: timestamp,
    };
    const updated: Submission = { ...current, ...changes };
    const isSeed = this.seed.submissions.some((s) => s.id === id);

    await this.commit((s) => {
      if (isSeed) s.submissionUpdates[id] = changes;
      else s.addedSubmissions = s.addedSubmissions.map((x) => (x.id === id ? updated : x));
      if (createdPlace) s.createdPlaces.push(createdPlace);
    });
    return clone(updated);
  }

  /** An approved submission becomes a public place. Unknown facts stay null. */
  private placeFromSubmission(submission: Submission, timestamp: string): Place {
    const taken = new Set(this.allPlaces().map((p) => p.slug));
    const slug = uniqueSlug(submission.place.name, taken);
    const { place } = submission;
    return {
      id: `pl-${slug}`,
      slug,
      name: place.name,
      shortDescription: place.shortDescription,
      description: place.description,
      categoryIds: place.categoryIds,
      tags: [],
      address: place.address,
      district: place.district,
      state: place.state,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
      // User-supplied coordinates, accepted by a moderator. Cited so their origin is visible.
      locationPrecision: place.latitude !== null ? 'site' : null,
      imageUrls: place.imageUrls,
      averageRating: null,
      reviewCount: 0,
      popularityCount: 0,
      createdAt: timestamp,
      openingHours: place.openingHours ?? null,
      entryFee: place.entryFee ?? null,
      bestTimeToVisit: null,
      safetyNotes: place.safetyNotes ?? [],
      moderationStatus: 'approved',
      createdBy: submission.submittedBy,
      isSyntheticDemo: place.name.endsWith('(demo)'),
      sources:
        place.latitude !== null
          ? [
              {
                field: 'coordinates',
                name: 'Demo submission approved by a moderator',
                url: null,
                retrievedOn: timestamp.slice(0, 10),
              },
            ]
          : [],
    };
  }

  /* ---------------- Saved places ---------------- */

  /** Saved ids that still point to visible places, most recently saved first. */
  private liveSavedIds(): string[] {
    const visible = new Set(this.visiblePlaces().map((p) => p.id));
    return this.state.savedPlaceIds.filter((id) => visible.has(id));
  }

  async getSavedPlaceIds(): Promise<string[]> {
    await this.ready();
    return this.liveSavedIds();
  }

  async getSavedPlaces(): Promise<Place[]> {
    await this.ready();
    const byId = new Map(this.visiblePlaces().map((p) => [p.id, p]));
    return clone(this.liveSavedIds().flatMap((id) => byId.get(id) ?? []));
  }

  async toggleSavedPlace(placeId: string): Promise<{ saved: boolean; savedPlaceIds: string[] }> {
    await this.ready();
    const place = this.findVisiblePlace(placeId);
    if (!place) throw new DemoDataError('NOT_FOUND', `Place "${placeId}" was not found.`);
    const saved = !this.state.savedPlaceIds.includes(place.id);
    await this.commit((s) => {
      s.savedPlaceIds = saved
        ? [place.id, ...s.savedPlaceIds]
        : s.savedPlaceIds.filter((id) => id !== place.id);
    });
    return { saved, savedPlaceIds: this.liveSavedIds() };
  }

  async clearSavedPlaces(): Promise<void> {
    await this.ready();
    await this.commit((s) => {
      s.savedPlaceIds = [];
    });
  }

  /* ---------------- Users ---------------- */

  async getDemoUsers(): Promise<DemoUser[]> {
    await this.ready();
    return clone(this.seed.demoUsers);
  }

  async getCurrentUser(): Promise<DemoUser> {
    await this.ready();
    const user = this.findUser(this.currentUserId);
    if (!user) throw new DemoDataError('NOT_FOUND', 'Current demo user not found.');
    return clone(user);
  }
}
