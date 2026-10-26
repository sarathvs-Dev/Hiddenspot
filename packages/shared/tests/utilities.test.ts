import { describe, expect, it } from 'vitest';
import { SUBMISSION_STATUSES } from '../types';
import {
  createToast,
  email,
  findSubmissionTransition,
  formatEntryFee,
  formatMonthYear,
  formatRating,
  formatShortDate,
  getDirectionsUrl,
  getDistanceFromReference,
  getInitials,
  getSubmissionStatusMeta,
  haversineKm,
  MAX_VISIBLE_TOASTS,
  minLength,
  optional,
  pickAvatarColors,
  required,
  slugify,
  toastReducer,
  uniqueSlug,
  validateForm,
} from '../utils';

describe('avatars', () => {
  it('derives initials', () => {
    expect(getInitials('Anu Thomas')).toBe('AT');
    expect(getInitials('  meera  ')).toBe('M');
    expect(getInitials('Jean Luc Picard')).toBe('JP');
    expect(getInitials('')).toBe('?');
  });

  it('picks a stable colour per seed', () => {
    expect(pickAvatarColors('usr-anu')).toEqual(pickAvatarColors('usr-anu'));
  });
});

describe('geo', () => {
  it('measures a known distance', () => {
    const london = { latitude: 51.5074, longitude: -0.1278 };
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    expect(haversineKm(london, paris)).toBeGreaterThan(340);
    expect(haversineKm(london, paris)).toBeLessThan(345);
  });

  it('returns undefined without a reference or without coordinates', () => {
    const reference = { label: 'Here', latitude: 10, longitude: 76 };
    expect(getDistanceFromReference({ latitude: 10, longitude: 77 }, null)).toBeUndefined();
    expect(
      getDistanceFromReference({ latitude: null, longitude: null }, reference),
    ).toBeUndefined();
    expect(getDistanceFromReference({ latitude: 10, longitude: 77 }, reference)).toBeGreaterThan(
      100,
    );
  });
});

describe('formatting', () => {
  it('never presents unknown facts as known', () => {
    expect(formatEntryFee(null)).toBe('Not confirmed');
    expect(formatEntryFee({ kind: 'free' })).toBe('Free');
    expect(formatEntryFee({ kind: 'paid', amount: 50, currency: 'INR', note: null })).toBe('₹50');
    expect(formatRating(null)).toBe('New');
    expect(formatRating(4.25)).toBe('4.3');
  });

  it('uses coordinates only for site-level locations', () => {
    const base = { name: 'Varkala Beach', district: 'Thiruvananthapuram', state: 'Kerala' };
    const search = 'search/?api=1&query=Varkala%20Beach%2C%20Thiruvananthapuram%2C%20Kerala';
    expect(
      getDirectionsUrl({ ...base, latitude: null, longitude: null, locationPrecision: null }),
    ).toContain(search);
    expect(
      getDirectionsUrl({ ...base, latitude: 8.7, longitude: 76.7, locationPrecision: 'area' }),
    ).toContain(search);
    expect(
      getDirectionsUrl({ ...base, latitude: 8.7, longitude: 76.7, locationPrecision: 'site' }),
    ).toContain('destination=8.7,76.7');
  });

  it('formats dates without locale differences', () => {
    expect(formatMonthYear('2026-07')).toBe('Jul 2026');
    expect(formatShortDate('2026-07-04')).toBe('4 Jul 2026');
    expect(formatMonthYear('garbage')).toBe('garbage');
  });
});

describe('slugs', () => {
  it('creates readable, unique slugs', () => {
    expect(slugify('Sunset Ridge Viewpoint (demo)')).toBe('sunset-ridge-viewpoint-demo');
    expect(slugify("Jatayu Earth's Center")).toBe('jatayu-earth-s-center');
    expect(uniqueSlug('Varkala Beach', new Set(['varkala-beach', 'varkala-beach-2']))).toBe(
      'varkala-beach-3',
    );
  });
});

describe('toast queue', () => {
  it('caps visible toasts and dismisses by id', () => {
    let state = toastReducer([], { type: 'clear' });
    const created = Array.from({ length: MAX_VISIBLE_TOASTS + 2 }, (_, i) =>
      createToast({ title: `T${i}` }),
    );
    for (const toast of created) state = toastReducer(state, { type: 'show', toast });
    expect(state).toHaveLength(MAX_VISIBLE_TOASTS);
    expect(state.at(-1)?.title).toBe(`T${created.length - 1}`);
    const first = state[0]!;
    expect(toastReducer(state, { type: 'dismiss', id: first.id })).toHaveLength(
      MAX_VISIBLE_TOASTS - 1,
    );
  });
});

describe('form validation', () => {
  it('returns friendly messages for the first failing rule', () => {
    const errors = validateForm(
      { name: '', email: 'nope', note: 'hi' },
      {
        name: [required('Name')],
        email: [required('Email'), email],
        note: [minLength('Note', 10)],
      },
    );
    expect(errors).toEqual({
      name: 'Name is required.',
      email: 'Enter an email like name@example.com.',
      note: 'Note needs at least 10 characters.',
    });
  });

  it('accepts empty optional fields but validates filled ones', () => {
    const rule = optional(minLength('Note', 5));
    expect(rule('')).toBeUndefined();
    expect(rule('hi')).toBe('Note needs at least 5 characters.');
    expect(rule('hello there')).toBeUndefined();
  });
});

describe('submission statuses', () => {
  it('has display metadata for every status', () => {
    for (const status of SUBMISSION_STATUSES) {
      expect(getSubmissionStatusMeta(status).label.length).toBeGreaterThan(0);
    }
  });

  it('only allows the documented lifecycle', () => {
    expect(findSubmissionTransition('draft', 'submitted')?.by).toBe('submitter');
    expect(findSubmissionTransition('in_review', 'approved')?.by).toBe('moderator');
    expect(findSubmissionTransition('draft', 'approved')).toBeUndefined();
    expect(findSubmissionTransition('approved', 'rejected')).toBeUndefined();
    expect(findSubmissionTransition('rejected', 'submitted')).toBeUndefined();
  });
});

describe('location descriptions', () => {
  it('explains site, area and unknown locations', async () => {
    const { describeLocation } = await import('../utils/format');
    const source = (name: string) => ({
      field: 'coordinates' as const,
      name,
      url: null,
      retrievedOn: '2026-10-25',
    });
    expect(describeLocation({ locationPrecision: null, sources: [] })).toMatch(/not verified/);
    expect(describeLocation({ locationPrecision: 'area', sources: [source('Wikipedia')] })).toMatch(
      /Approximate area/,
    );
    expect(
      describeLocation({
        locationPrecision: 'site',
        sources: [source('Wikipedia'), source('OpenStreetMap')],
      }),
    ).toBe('Location checked against Wikipedia and OpenStreetMap.');
  });
});

describe('add-a-spot form rules', () => {
  it('validates sections and converts to service input', async () => {
    const f = await import('../utils/submissionForm');
    const empty = f.EMPTY_SUBMISSION_FORM;
    expect(Object.keys(f.validateSubmissionSection(0, empty)).sort()).toEqual([
      'categoryIds',
      'name',
      'shortDescription',
    ]);
    expect(
      f.validateSubmissionSection(1, { ...empty, district: 'Idukki', latitude: '10' }).latitude,
    ).toMatch(/both/);
    expect(
      f.validateSubmissionSection(3, { ...empty, feeChoice: 'paid', feeAmount: '0' }).feeAmount,
    ).toBeDefined();
    expect(f.firstErrorSection({ district: 'x', feeAmount: 'y' })).toBe(1);
    const input = f.toNewSubmissionInput(
      {
        ...empty,
        name: 'X Place',
        categoryIds: ['peaceful'],
        shortDescription: 'A quiet test place.',
        district: 'Idukki',
        safetyNotes: ' a \n\n b ',
        feeChoice: 'free',
      },
      'usr-anu',
    );
    expect(input.place).toMatchObject({
      safetyNotes: ['a', 'b'],
      entryFee: { kind: 'free' },
      latitude: null,
      description: null,
    });
    expect(f.issuesToSubmissionErrors([{ path: 'place.imageUrls', message: 'bad' }])).toEqual({
      imageUris: 'bad',
    });
  });
});
