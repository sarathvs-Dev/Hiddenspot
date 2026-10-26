import { describe, expect, it } from 'vitest';
import {
  createMemoryStorage,
  DemoDataError,
  DemoDataService,
  type DemoDataServiceOptions,
} from '../services';
import type { NewSubmissionInput } from '../types';
import {
  EMPTY_REVIEW_FORM,
  getSubmissionStatusMeta,
  recentVisitMonths,
  reviewErrorsFromError,
  toNewReviewInput,
  validateModerationNote,
  validateReviewFields,
} from '../utils';

const NOW = new Date('2026-10-25T12:00:00.000Z');
const MODERATOR = 'usr-moderator';

function makeService(overrides: DemoDataServiceOptions = {}) {
  let n = 0;
  return new DemoDataService({
    storage: createMemoryStorage(),
    now: () => NOW,
    generateId: (prefix) => `${prefix}-${++n}`,
    ...overrides,
  });
}

async function expectCode(promise: Promise<unknown>, code: DemoDataError['code']) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(DemoDataError);
  expect((error as DemoDataError).code).toBe(code);
  return error as DemoDataError;
}

const input = (
  over: Partial<NewSubmissionInput['place']> = {},
  submittedBy = 'usr-anu',
): NewSubmissionInput => ({
  submittedBy,
  place: {
    name: 'Quiet Canal Bend (demo)',
    shortDescription: 'A fictional calm canal bend used for contribution tests.',
    categoryIds: ['peaceful'],
    district: 'Alappuzha',
    ...over,
  },
});

describe('review rules shared by the service and both apps', () => {
  it('rejects empty and invalid reviews with friendly messages', () => {
    expect(Object.keys(validateReviewFields(EMPTY_REVIEW_FORM, NOW)).sort()).toEqual([
      'body',
      'rating',
    ]);
    for (const rating of [0, 6, 3.5, Number.NaN, '4']) {
      expect(
        validateReviewFields({ rating, body: 'A perfectly fine review.' }, NOW).rating,
      ).toBeDefined();
    }
    expect(validateReviewFields({ rating: 4, body: '   short  ' }, NOW).body).toMatch(
      /at least 10/,
    );
    expect(validateReviewFields({ rating: 4, body: 'x'.repeat(1001) }, NOW).body).toMatch(
      /under 1000/,
    );
    expect(
      validateReviewFields({ rating: 4, body: 'Lovely quiet place.', title: 't'.repeat(81) }, NOW)
        .title,
    ).toBeDefined();
    expect(
      validateReviewFields({ rating: 4, body: 'Lovely quiet place.', visitedOn: '2026-13' }, NOW)
        .visitedOn,
    ).toBeDefined();
    expect(
      validateReviewFields({ rating: 4, body: 'Lovely quiet place.', visitedOn: '2026-11' }, NOW)
        .visitedOn,
    ).toMatch(/future/);
    expect(
      validateReviewFields({ rating: 5, body: 'Lovely quiet place.', visitedOn: '2026-10' }, NOW),
    ).toEqual({});
  });

  it('offers only past or current visit months', () => {
    const months = recentVisitMonths(NOW);
    expect(months[0]).toBe('2026-10');
    expect(months).toHaveLength(12);
    expect(
      months.every(
        (m) =>
          Object.keys(
            validateReviewFields({ rating: 4, body: 'Lovely quiet place.', visitedOn: m }, NOW),
          ).length === 0,
      ),
    ).toBe(true);
  });

  it('the service rejects exactly what the forms reject, with the same messages', async () => {
    const service = makeService();
    const bad = { placeId: 'pl-munroe-island', userId: 'usr-anu', rating: 9, body: 'short' };
    const error = await expectCode(service.addDemoReview(bad), 'VALIDATION');
    const form = validateReviewFields(bad, NOW);
    expect(reviewErrorsFromError(error)).toEqual(form);
  });

  it('adds a review, updates the summary and shows the reviewer, then blocks a second review', async () => {
    const service = makeService();
    const before = (await service.getPlaceById('pl-munroe-island'))!;
    const values = {
      ...EMPTY_REVIEW_FORM,
      rating: 1,
      body: '  Too crowded on the weekend we went.  ',
      title: '  ',
    };
    const review = await service.addDemoReview(toNewReviewInput(values, before.id, 'usr-anu'));
    expect(review).toMatchObject({
      rating: 1,
      body: 'Too crowded on the weekend we went.',
      title: null,
      source: 'demo',
    });
    expect(review.author?.displayName).toBeTruthy();
    expect(review.createdAt).toBe(NOW.toISOString());

    const after = (await service.getPlaceById(before.id))!;
    expect(after.reviewCount).toBe(before.reviewCount + 1);
    const ratings = (await service.getReviewsForPlace(before.id)).map((r) => r.rating);
    const mean = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    expect(after.averageRating).toBe(mean);

    const conflict = await expectCode(
      service.addDemoReview(toNewReviewInput(values, before.id, 'usr-anu')),
      'CONFLICT',
    );
    expect(reviewErrorsFromError(conflict).form).toMatch(/already reviewed/);
  });
});

describe('submission creation', () => {
  it('creates a pending submission with a unique id', async () => {
    const service = makeService();
    const a = await service.addDemoSubmission(input());
    const b = await service.addDemoSubmission(input({ name: 'Second Canal Bend (demo)' }));
    expect(a.status).toBe('submitted');
    expect(getSubmissionStatusMeta(a.status).label).toBe('Pending review');
    expect(a.id).not.toBe(b.id);
    const mine = await service.getSubmissions({ submittedBy: 'usr-anu' });
    expect(mine.map((s) => s.id)).toEqual(expect.arrayContaining([a.id, b.id]));
  });

  it('never reuses an existing id, even if the generator repeats itself', async () => {
    const ids = ['sub-demo-x', 'sub-demo-x', 'sub-demo-y'];
    const service = makeService({ generateId: () => ids.shift() ?? 'sub-demo-z' });
    const a = await service.addDemoSubmission(input());
    const b = await service.addDemoSubmission(input({ name: 'Other Canal Bend (demo)' }));
    expect([a.id, b.id]).toEqual(['sub-demo-x', 'sub-demo-y']);
  });

  it('rejects missing or invalid required information without saving anything', async () => {
    const service = makeService();
    const before = (await service.getSubmissions()).length;
    const error = await expectCode(
      service.addDemoSubmission(
        input({ name: '', shortDescription: 'tiny', categoryIds: [], district: 'Atlantis' }),
      ),
      'VALIDATION',
    );
    const paths = error.issues.map((i) => i.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        'place.name',
        'place.shortDescription',
        'place.categoryIds',
        'place.district',
      ]),
    );
    expect(await service.getSubmissions()).toHaveLength(before);
    await expectCode(service.addDemoSubmission(input({}, 'usr-nobody')), 'VALIDATION');
    await expectCode(
      service.addDemoSubmission(input({ latitude: 95, longitude: 76 })),
      'VALIDATION',
    );
  });
});

describe('moderation', () => {
  it('approves straight from the pending queue and publishes the place', async () => {
    const service = makeService();
    const created = await service.addDemoSubmission(input());
    const approved = await service.updateDemoSubmissionStatus(created.id, {
      status: 'approved',
      actorId: MODERATOR,
    });
    expect(approved.status).toBe('approved');
    const place = await service.getPlaceById(approved.approvedPlaceId!);
    expect(place?.name).toBe('Quiet Canal Bend (demo)');
    expect((await service.getPlaces()).some((p) => p.id === place!.id)).toBe(true);
  });

  it('rejects with a required note and never publishes', async () => {
    const service = makeService();
    const created = await service.addDemoSubmission(input());
    const missing = await expectCode(
      service.updateDemoSubmissionStatus(created.id, {
        status: 'rejected',
        actorId: MODERATOR,
        reviewerNote: ' no ',
      }),
      'VALIDATION',
    );
    expect(missing.issues[0]!.message).toBe(validateModerationNote('rejected', ' no '));
    const rejected = await service.updateDemoSubmissionStatus(created.id, {
      status: 'rejected',
      actorId: MODERATOR,
      reviewerNote: 'Duplicate of an existing listing.',
    });
    expect(rejected).toMatchObject({
      status: 'rejected',
      reviewerNote: 'Duplicate of an existing listing.',
      approvedPlaceId: null,
    });
    expect((await service.getPlaces({ query: 'Quiet Canal Bend' })).length).toBe(0);
    // Final decisions cannot be changed.
    await expectCode(
      service.updateDemoSubmissionStatus(created.id, { status: 'approved', actorId: MODERATOR }),
      'INVALID_TRANSITION',
    );
  });

  it('only demo moderators can moderate, and the note rule is shared with the admin UI', async () => {
    const service = makeService();
    const created = await service.addDemoSubmission(input());
    await expectCode(
      service.updateDemoSubmissionStatus(created.id, { status: 'approved', actorId: 'usr-anu' }),
      'FORBIDDEN',
    );
    await expectCode(
      service.updateDemoSubmissionStatus('sub-missing', { status: 'approved', actorId: MODERATOR }),
      'NOT_FOUND',
    );
    expect(validateModerationNote('approved', '')).toBeUndefined();
    expect(validateModerationNote('changes_requested', '')).toBeDefined();
    expect(validateModerationNote('approved', 'x'.repeat(501))).toBeDefined();
  });
});

describe('saved places', () => {
  it('toggles on and off, persists on the same storage, and rejects unknown places', async () => {
    const storage = createMemoryStorage();
    const service = makeService({ storage });
    expect(await service.toggleSavedPlace('pl-munroe-island')).toMatchObject({ saved: true });
    expect(await service.getSavedPlaceIds()).toEqual(['pl-munroe-island']);

    // A second service on the same storage, like reopening the app, sees the same list.
    const reopened = makeService({ storage });
    expect(await reopened.getSavedPlaceIds()).toEqual(['pl-munroe-island']);
    expect((await reopened.getSavedPlaces()).map((p) => p.id)).toEqual(['pl-munroe-island']);

    expect(await reopened.toggleSavedPlace('pl-munroe-island')).toMatchObject({ saved: false });
    expect(await reopened.getSavedPlaceIds()).toEqual([]);
    await expectCode(reopened.toggleSavedPlace('pl-not-a-place'), 'NOT_FOUND');
  });
});
