import { beforeEach, describe, expect, it } from 'vitest';
import {
  createMemoryStorage,
  DEMO_STATE_STORAGE_KEY,
  DemoDataError,
  DemoDataService,
  type DemoDataServiceOptions,
} from '../services';
import type { KeyValueStorage, NewSubmissionInput } from '../types';
import { haversineKm } from '../utils/geo';

const FIXED_NOW = new Date('2026-10-25T12:00:00.000Z');

function makeService(overrides: DemoDataServiceOptions = {}) {
  let n = 0;
  return new DemoDataService({
    storage: createMemoryStorage(),
    now: () => FIXED_NOW,
    generateId: (prefix) => `${prefix}-${++n}`,
    ...overrides,
  });
}

async function expectError(promise: Promise<unknown>, code: DemoDataError['code']) {
  await expect(promise).rejects.toBeInstanceOf(DemoDataError);
  await promise.catch((e: DemoDataError) => expect(e.code).toBe(code));
}

const submission = (over: Partial<NewSubmissionInput['place']> = {}): NewSubmissionInput => ({
  submittedBy: 'usr-anu',
  place: {
    name: 'Hidden Paddy View (demo)',
    shortDescription: 'A fictional viewpoint over paddy fields for testing.',
    categoryIds: ['peaceful'],
    district: 'Palakkad',
    ...over,
  },
});

describe('places', () => {
  let service: DemoDataService;
  beforeEach(() => {
    service = makeService();
  });

  it('returns only approved places, with ratings computed from reviews', async () => {
    const places = await service.getPlaces();
    expect(places.length).toBeGreaterThanOrEqual(30);
    expect(places.every((p) => p.moderationStatus === 'approved')).toBe(true);
  });

  it('finds a place by id or slug and returns null when missing', async () => {
    expect((await service.getPlaceById('pl-varkala-beach'))?.name).toBe('Varkala Beach');
    expect((await service.getPlaceById('varkala-beach'))?.id).toBe('pl-varkala-beach');
    expect(await service.getPlaceById('pl-nope')).toBeNull();
  });

  it('search, filter and sort agree with the shared utilities', async () => {
    const searched = await service.searchPlaces('beach', { sortBy: 'name' });
    expect(searched.length).toBeGreaterThan(0);
    const filtered = await service.filterPlaces({ districts: ['Wayanad'] });
    expect(filtered.every((p) => p.district === 'Wayanad')).toBe(true);
    const sorted = service.sortPlaces(filtered, 'popularity');
    expect(sorted[0]!.popularityCount).toBeGreaterThanOrEqual(sorted.at(-1)!.popularityCount);
  });

  it('returns copies so callers cannot change internal data', async () => {
    const [first] = await service.getPlaces({ sortBy: 'name' });
    first!.name = 'Changed';
    const [again] = await service.getPlaces({ sortBy: 'name' });
    expect(again!.name).not.toBe('Changed');
  });

  it('lists categories in order and districts alphabetically', async () => {
    const categories = await service.getCategories();
    expect(categories.map((c) => c.sortOrder)).toEqual(
      [...categories.map((c) => c.sortOrder)].sort((a, b) => a - b),
    );
    const districts = await service.getDistricts();
    expect(districts).toEqual([...districts].sort());
  });
});

describe('reviews', () => {
  it('lists reviews newest first with authors', async () => {
    const service = makeService();
    const reviews = await service.getReviewsForPlace('pl-athirappilly-falls');
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews.every((r) => r.author !== null)).toBe(true);
    const dates = reviews.map((r) => r.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
    await expectError(service.getReviewsForPlace('pl-nope'), 'NOT_FOUND');
  });

  it('adds a demo review and updates the place rating and count', async () => {
    const service = makeService();
    const before = (await service.getPlaceById('pl-demo-kaattuchola-stream'))!;
    expect(before.reviewCount).toBe(0);
    expect(before.averageRating).toBeNull();

    const review = await service.addDemoReview({
      placeId: 'pl-demo-kaattuchola-stream',
      userId: 'usr-anu',
      rating: 4,
      title: '  ',
      body: '  A calm little stream, great for a short walk.  ',
      visitedOn: '2026-09',
    });
    expect(review).toMatchObject({
      id: 'rv-demo-1',
      source: 'demo',
      title: null,
      body: 'A calm little stream, great for a short walk.',
    });
    expect(review.author?.displayName).toBe('Anu Thomas');

    const after = (await service.getPlaceById('pl-demo-kaattuchola-stream'))!;
    expect(after).toMatchObject({ reviewCount: 1, averageRating: 4 });
  });

  it('validates ratings, text, dates and users', async () => {
    const service = makeService();
    const base = {
      placeId: 'pl-varkala-beach',
      userId: 'usr-anu',
      body: 'Long enough review text.',
    };
    await expectError(service.addDemoReview({ ...base, rating: 6 }), 'VALIDATION');
    await expectError(service.addDemoReview({ ...base, rating: 3.5 }), 'VALIDATION');
    await expectError(service.addDemoReview({ ...base, rating: 4, body: 'short' }), 'VALIDATION');
    await expectError(
      service.addDemoReview({ ...base, rating: 4, visitedOn: '2027-01' }),
      'VALIDATION',
    );
    await expectError(
      service.addDemoReview({ ...base, rating: 4, userId: 'usr-ghost' }),
      'VALIDATION',
    );
    await expectError(
      service.addDemoReview({ ...base, rating: 4, placeId: 'pl-nope' }),
      'NOT_FOUND',
    );
  });

  it('allows one review per user per place', async () => {
    const service = makeService();
    const input = {
      placeId: 'pl-demo-kaattuchola-stream',
      userId: 'usr-rahul',
      rating: 5,
      body: 'Lovely and quiet stream.',
    };
    await service.addDemoReview(input);
    await expectError(service.addDemoReview(input), 'CONFLICT');
  });
});

describe('submissions', () => {
  it('creates a submitted or draft submission with normalised fields', async () => {
    const service = makeService();
    const created = await service.addDemoSubmission(
      submission({ description: '   ', imageUrls: [' https://example.com/a.jpg '] }),
    );
    expect(created).toMatchObject({
      id: 'sub-demo-1',
      status: 'submitted',
      reviewerNote: null,
      approvedPlaceId: null,
      place: {
        state: 'Kerala',
        country: 'India',
        description: null,
        latitude: null,
        imageUrls: ['https://example.com/a.jpg'],
      },
    });
    const draft = await service.addDemoSubmission({
      ...submission({ name: 'Another Spot (demo)' }),
      asDraft: true,
    });
    expect(draft.status).toBe('draft');
    expect(
      (await service.getSubmissions({ submittedBy: 'usr-anu' })).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('rejects invalid drafts with field-level issues', async () => {
    const service = makeService();
    const error = await service
      .addDemoSubmission(
        submission({ name: 'x', categoryIds: [], district: 'Atlantis', latitude: 10 }),
      )
      .catch((e: DemoDataError) => e);
    expect(error).toBeInstanceOf(DemoDataError);
    const paths = (error as DemoDataError).issues.map((i) => i.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        'place.name',
        'place.categoryIds',
        'place.district',
        'place.latitude',
      ]),
    );
  });

  it('rejects duplicates of listed places in the same district', async () => {
    const service = makeService();
    await expectError(
      service.addDemoSubmission(
        submission({ name: 'varkala beach', district: 'Thiruvananthapuram' }),
      ),
      'CONFLICT',
    );
  });

  it('follows the moderation lifecycle and publishes approved places', async () => {
    const service = makeService();
    const created = await service.addDemoSubmission(submission());
    const moderator = 'usr-moderator';

    await expectError(
      service.updateDemoSubmissionStatus(created.id, { status: 'in_review', actorId: 'usr-anu' }),
      'FORBIDDEN',
    );
    // Pending submissions cannot go back to draft.
    await expectError(
      service.updateDemoSubmissionStatus(created.id, { status: 'draft', actorId: moderator }),
      'INVALID_TRANSITION',
    );

    await service.updateDemoSubmissionStatus(created.id, {
      status: 'in_review',
      actorId: moderator,
    });
    await expectError(
      service.updateDemoSubmissionStatus(created.id, {
        status: 'changes_requested',
        actorId: moderator,
      }),
      'VALIDATION',
    );
    await service.updateDemoSubmissionStatus(created.id, {
      status: 'changes_requested',
      actorId: moderator,
      reviewerNote: 'Please add a photo.',
    });
    await expectError(
      service.updateDemoSubmissionStatus(created.id, { status: 'submitted', actorId: 'usr-rahul' }),
      'FORBIDDEN',
    );
    const resubmitted = await service.updateDemoSubmissionStatus(created.id, {
      status: 'submitted',
      actorId: 'usr-anu',
    });
    expect(resubmitted.reviewerNote).toBeNull();

    await service.updateDemoSubmissionStatus(created.id, {
      status: 'in_review',
      actorId: moderator,
    });
    const approved = await service.updateDemoSubmissionStatus(created.id, {
      status: 'approved',
      actorId: moderator,
    });
    expect(approved.approvedPlaceId).toBe('pl-hidden-paddy-view-demo');

    const place = await service.getPlaceById('pl-hidden-paddy-view-demo');
    expect(place).toMatchObject({
      createdBy: 'usr-anu',
      moderationStatus: 'approved',
      averageRating: null,
      isSyntheticDemo: true,
    });
    await expectError(
      service.updateDemoSubmissionStatus(created.id, { status: 'rejected', actorId: moderator }),
      'INVALID_TRANSITION',
    );
  });

  it('updates seed submissions without changing the seed files', async () => {
    const service = makeService();
    await service.updateDemoSubmissionStatus('sub-0004', {
      status: 'in_review',
      actorId: 'usr-moderator',
    });
    expect((await service.getSubmissions()).find((s) => s.id === 'sub-0004')?.status).toBe(
      'in_review',
    );
    expect((await makeService().getSubmissions()).find((s) => s.id === 'sub-0004')?.status).toBe(
      'submitted',
    );
  });
});

describe('saved places', () => {
  it('toggles, orders most recent first and clears', async () => {
    const service = makeService();
    expect(await service.toggleSavedPlace('pl-varkala-beach')).toMatchObject({ saved: true });
    await service.toggleSavedPlace('pl-gavi');
    expect((await service.getSavedPlaces()).map((p) => p.id)).toEqual([
      'pl-gavi',
      'pl-varkala-beach',
    ]);
    expect(await service.toggleSavedPlace('pl-gavi')).toMatchObject({
      saved: false,
      savedPlaceIds: ['pl-varkala-beach'],
    });
    await service.clearSavedPlaces();
    expect(await service.getSavedPlaceIds()).toEqual([]);
  });

  it('rejects unknown places and ignores stale saved ids', async () => {
    const storage = createMemoryStorage({
      [DEMO_STATE_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        addedReviews: [],
        addedSubmissions: [],
        submissionUpdates: {},
        createdPlaces: [],
        savedPlaceIds: ['pl-removed-place', 'pl-gavi'],
      }),
    });
    const service = makeService({ storage });
    expect(await service.getSavedPlaceIds()).toEqual(['pl-gavi']);
    await expectError(service.toggleSavedPlace('pl-nope'), 'NOT_FOUND');
  });

  it('notifies subscribers and bumps the version on change', async () => {
    const service = makeService();
    let calls = 0;
    const unsubscribe = service.subscribe(() => (calls += 1));
    const before = service.getVersion();
    await service.toggleSavedPlace('pl-gavi');
    unsubscribe();
    await service.toggleSavedPlace('pl-gavi');
    expect(calls).toBe(1);
    expect(service.getVersion()).toBe(before + 2);
  });
});

describe('persistence', () => {
  it('keeps demo changes across service instances on the same storage', async () => {
    const storage = createMemoryStorage();
    const first = makeService({ storage });
    await first.toggleSavedPlace('pl-varkala-beach');
    await first.addDemoReview({
      placeId: 'pl-demo-kaattuchola-stream',
      userId: 'usr-lakshmi',
      rating: 5,
      body: 'Peaceful forest stream.',
    });

    const second = makeService({ storage });
    expect(await second.getSavedPlaceIds()).toEqual(['pl-varkala-beach']);
    expect(
      (await second.getReviewsForPlace('pl-demo-kaattuchola-stream')).some(
        (r) => r.source === 'demo',
      ),
    ).toBe(true);
    expect(await second.getStorageStatus()).toBe('persistent');
  });

  it('recovers from corrupted JSON and backs it up', async () => {
    const storage = createMemoryStorage({ [DEMO_STATE_STORAGE_KEY]: '{not json' });
    const service = makeService({ storage });
    expect(await service.getSavedPlaceIds()).toEqual([]);
    expect(await service.getStorageStatus()).toBe('recovered-from-corruption');
    expect(await storage.getItem('hiddenspot:demo-state:corrupt-backup')).toBe('{not json');
    expect(JSON.parse((await storage.getItem(DEMO_STATE_STORAGE_KEY))!)).toMatchObject({
      schemaVersion: 1,
    });
  });

  it('drops individual invalid entries but keeps valid ones', async () => {
    const storage = createMemoryStorage({
      [DEMO_STATE_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        addedReviews: [{ id: 'bad', rating: 99 }],
        addedSubmissions: [],
        submissionUpdates: { 'sub-0004': { status: 'nonsense' } },
        createdPlaces: [],
        savedPlaceIds: ['pl-gavi', 42],
      }),
    });
    const service = makeService({ storage });
    expect(await service.getSavedPlaceIds()).toEqual(['pl-gavi']);
    expect(await service.getStorageStatus()).toBe('recovered-from-corruption');
  });

  it('falls back to memory when storage is unavailable or throws', async () => {
    const throwing: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const service = makeService({ storage: throwing });
    await service.toggleSavedPlace('pl-gavi');
    expect(await service.getSavedPlaceIds()).toEqual(['pl-gavi']);
    expect(await service.getStorageStatus()).toBe('memory-only');

    const memory = makeService({ storage: null });
    expect(await memory.getStorageStatus()).toBe('memory-only');
  });

  it('switches to memory when a write fails, without losing the change', async () => {
    let fail = false;
    const base = createMemoryStorage();
    const flaky: KeyValueStorage = {
      getItem: (k) => base.getItem(k),
      setItem: (k, v) => {
        if (fail) throw new Error('quota exceeded');
        return base.setItem(k, v);
      },
    };
    const service = makeService({ storage: flaky });
    await service.getPlaces();
    fail = true;
    await service.toggleSavedPlace('pl-gavi');
    expect(await service.getSavedPlaceIds()).toEqual(['pl-gavi']);
    expect(await service.getStorageStatus()).toBe('memory-only');
  });

  it('resets demo state back to seed data', async () => {
    const storage = createMemoryStorage();
    const service = makeService({ storage });
    await service.toggleSavedPlace('pl-gavi');
    await service.resetDemoState();
    expect(await service.getSavedPlaceIds()).toEqual([]);
    expect(await makeService({ storage }).getSavedPlaceIds()).toEqual([]);
  });

  it('never writes to the seed: a fresh service sees original data', async () => {
    const service = makeService();
    await service.addDemoReview({
      placeId: 'pl-demo-kaattuchola-stream',
      userId: 'usr-meera',
      rating: 1,
      body: 'Testing seed isolation.',
    });
    const fresh = makeService();
    expect(await fresh.getReviewsForPlace('pl-demo-kaattuchola-stream')).toEqual([]);
  });
});

describe('verified locations', () => {
  it('sorts real places by distance from a reference, unknown locations last', async () => {
    const service = makeService();
    const fortKochi = { label: 'Fort Kochi', latitude: 9.9658, longitude: 76.2421 };
    const places = await service.getPlaces({ sortBy: 'distance', reference: fortKochi });
    expect(
      places
        .slice(0, 2)
        .map((p) => p.id)
        .sort(),
    ).toEqual(['pl-santa-cruz-cathedral-basilica', 'pl-st-francis-church']);
    const firstUnknown = places.findIndex((p) => p.latitude === null);
    expect(places.slice(firstUnknown).every((p) => p.latitude === null)).toBe(true);
  });

  it('cites the source of coordinates on places created from approved submissions', async () => {
    const service = makeService();
    const created = await service.addDemoSubmission(
      submission({ latitude: 10.77, longitude: 76.65 }),
    );
    await service.updateDemoSubmissionStatus(created.id, {
      status: 'in_review',
      actorId: 'usr-moderator',
    });
    const approved = await service.updateDemoSubmissionStatus(created.id, {
      status: 'approved',
      actorId: 'usr-moderator',
    });
    const place = await service.getPlaceById(approved.approvedPlaceId!);
    expect(place).toMatchObject({ latitude: 10.77, longitude: 76.65, locationPrecision: 'site' });
    expect(place!.sources).toEqual([
      expect.objectContaining({ field: 'coordinates', url: null, retrievedOn: '2026-10-25' }),
    ]);
  });
});

describe('mobile discovery rules', () => {
  const kochi = { label: 'Kochi', latitude: 9.931, longitude: 76.267, kind: 'preset' as const };

  it('applies a distance radius from the reference location', async () => {
    const service = makeService();
    const near = await service.getPlaces({
      maxDistanceKm: 25,
      reference: kochi,
      sortBy: 'distance',
    });
    expect(near.length).toBeGreaterThan(0);
    for (const p of near) {
      expect(p.latitude).not.toBeNull();
      expect(
        haversineKm(kochi, { latitude: p.latitude!, longitude: p.longitude! }),
      ).toBeLessThanOrEqual(25);
    }
    const wide = await service.getPlaces({ maxDistanceKm: 100, reference: kochi });
    expect(wide.length).toBeGreaterThan(near.length);
    // Without a reference the radius is ignored rather than hiding everything.
    expect((await service.getPlaces({ maxDistanceKm: 5 })).length).toBe(
      (await service.getPlaces()).length,
    );
  });

  it('returns related places that share a category or district', async () => {
    const service = makeService();
    const place = (await service.getPlaceById('pl-athirappilly-falls'))!;
    const related = await service.getRelatedPlaces(place.id, 4);
    expect(related).toHaveLength(4);
    expect(related.some((p) => p.id === place.id)).toBe(false);
    for (const p of related) {
      expect(
        p.categoryIds.some((c) => place.categoryIds.includes(c)) || p.district === place.district,
      ).toBe(true);
    }
  });

  it('serves demo reference locations with cited sources', async () => {
    const presets = await makeService().getReferenceLocations();
    expect(presets.map((p) => p.id)).toContain('kochi');
    for (const p of presets)
      expect(p.sources.map((s) => s.name)).toEqual(['Wikipedia', 'OpenStreetMap']);
  });

  it('keeps optional visitor info and local photos from a submission through approval', async () => {
    const service = makeService();
    const created = await service.addDemoSubmission(
      submission({
        imageUrls: ['file:///data/user/0/photo.jpg'],
        safetyNotes: [' Slippery steps after rain. '],
        openingHours: '6 am to 6 pm',
        entryFee: { kind: 'free' },
      }),
    );
    expect(created.place).toMatchObject({
      safetyNotes: ['Slippery steps after rain.'],
      openingHours: '6 am to 6 pm',
    });
    await service.updateDemoSubmissionStatus(created.id, {
      status: 'in_review',
      actorId: 'usr-moderator',
    });
    const approved = await service.updateDemoSubmissionStatus(created.id, {
      status: 'approved',
      actorId: 'usr-moderator',
    });
    expect(await service.getPlaceById(approved.approvedPlaceId!)).toMatchObject({
      imageUrls: ['file:///data/user/0/photo.jpg'],
      safetyNotes: ['Slippery steps after rain.'],
      entryFee: { kind: 'free' },
    });
  });

  it('describes demo locations honestly', async () => {
    const { describeReference, formatDistanceFrom } = await import('../utils/format');
    expect(describeReference(kochi)).toBe('Kochi (demo location)');
    expect(describeReference({ ...kochi, kind: 'device' })).toBe('your location');
    expect(formatDistanceFrom(12.34, kochi)).toBe('12 km from Kochi (demo)');
  });
});

describe('curated collections', () => {
  it('every collection returns places from the shared dataset', async () => {
    const { COLLECTIONS } = await import('../content/collections');
    const service = makeService();
    for (const collection of COLLECTIONS) {
      const places = await service.getPlaces(collection.query);
      expect(places.length, collection.id).toBeGreaterThanOrEqual(3);
    }
  });
});
