import { describe, expect, it } from 'vitest';
import { KERALA_DISTRICTS, RAW_SEED } from '../data';
import { CATEGORY_IDS } from '../types';
import { validatePlace, validateSeedData, validateSubmission } from '../utils/validation';

const result = validateSeedData(RAW_SEED);
if (!result.ok) console.error(result.issues);
const seed = result.ok ? result.value : null;

describe('seed data', () => {
  it('passes per-file and cross-file validation', () => {
    expect(result.ok).toBe(true);
  });

  it('has at least 30 places, mainly in Kerala', () => {
    expect(seed!.places.length).toBeGreaterThanOrEqual(30);
    const kerala = seed!.places.filter((p) => p.state === 'Kerala');
    expect(kerala.length / seed!.places.length).toBeGreaterThan(0.9);
    for (const p of kerala) expect(KERALA_DISTRICTS).toContain(p.district);
  });

  it('covers every category', () => {
    for (const id of CATEGORY_IDS) {
      expect(seed!.places.some((p) => p.categoryIds.includes(id))).toBe(true);
    }
  });

  it('labels synthetic entries in the name and the flag', () => {
    const synthetic = seed!.places.filter((p) => p.isSyntheticDemo);
    expect(synthetic.length).toBeGreaterThan(0);
    for (const p of synthetic) expect(p.name.endsWith('(demo)')).toBe(true);
    for (const p of seed!.places.filter((x) => !x.isSyntheticDemo))
      expect(p.name).not.toMatch(/\(demo\)/);
  });

  it('cites two agreeing sources for every coordinate and never guesses', () => {
    const located = seed!.places.filter((p) => p.latitude !== null);
    expect(located.length).toBeGreaterThanOrEqual(25);
    for (const p of located) {
      expect(p.isSyntheticDemo).toBe(false);
      expect(['site', 'area']).toContain(p.locationPrecision);
      const names = p.sources.filter((s) => s.field === 'coordinates').map((s) => s.name);
      expect(names).toEqual(expect.arrayContaining(['Wikipedia', 'OpenStreetMap']));
      for (const s of p.sources) {
        expect(s.url).toMatch(
          /^https:\/\/(en\.wikipedia\.org|www\.openstreetmap\.org|nominatim\.openstreetmap\.org)\//,
        );
        expect(s.retrievedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
    for (const p of seed!.places.filter((x) => x.latitude === null)) {
      expect(p.locationPrecision).toBeNull();
      expect(p.sources).toEqual([]);
    }
  });

  it('keeps unverified visitor facts null', () => {
    for (const p of seed!.places) {
      expect(p.address).toBeNull();
      expect(p.openingHours).toBeNull();
      expect(p.entryFee).toBeNull();
    }
  });

  it('includes edge cases the UI must handle', () => {
    expect(seed!.places.some((p) => p.imageUrls.length === 0)).toBe(true);
    expect(seed!.places.some((p) => p.description === null)).toBe(true);
    expect(seed!.places.some((p) => p.reviewCount === 0 && p.averageRating === null)).toBe(true);
  });

  it('uses unique, stable, prefixed ids', () => {
    const ids = [
      ...seed!.places.map((p) => p.id),
      ...seed!.reviews.map((r) => r.id),
      ...seed!.submissions.map((s) => s.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of seed!.places) expect(p.id).toBe(`pl-${p.slug}`);
  });

  it('marks every user as a demo user', () => {
    for (const u of seed!.demoUsers) expect(u.isDemo).toBe(true);
  });
});

describe('seed integrity checks catch mistakes', () => {
  const clone = () =>
    JSON.parse(JSON.stringify(RAW_SEED)) as Record<
      keyof typeof RAW_SEED,
      Record<string, unknown>[]
    >;

  it('rejects a review for an unknown place', () => {
    const raw = clone();
    raw.reviews[0]!.placeId = 'pl-does-not-exist';
    const r = validateSeedData(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.message.includes('unknown place'))).toBe(true);
  });

  it('rejects stored ratings that disagree with reviews', () => {
    const raw = clone();
    const place = raw.places.find((p) => (p.reviewCount as number) > 0)!;
    place.averageRating = 1;
    expect(validateSeedData(raw).ok).toBe(false);
  });

  it('rejects duplicate slugs', () => {
    const raw = clone();
    raw.places[1]!.slug = raw.places[0]!.slug;
    expect(validateSeedData(raw).ok).toBe(false);
  });
});

describe('record validation', () => {
  const base = () => JSON.parse(JSON.stringify(seed!.places[0])) as Record<string, unknown>;

  it('rejects out-of-range ratings and half-set coordinates', () => {
    expect(validatePlace({ ...base(), averageRating: 7 }).ok).toBe(false);
    expect(validatePlace({ ...base(), latitude: 10, longitude: null }).ok).toBe(false);
    expect(validatePlace({ ...base(), latitude: 95, longitude: 76 }).ok).toBe(false);
    expect(validatePlace({ ...base(), latitude: 10.5, longitude: 76.2 }).ok).toBe(true);
  });

  it('requires precision and a source whenever coordinates are set', () => {
    expect(validatePlace({ ...base(), locationPrecision: null }).ok).toBe(false);
    expect(validatePlace({ ...base(), sources: [] }).ok).toBe(false);
    expect(
      validatePlace({ ...base(), latitude: null, longitude: null, locationPrecision: 'site' }).ok,
    ).toBe(false);
    expect(
      validatePlace({
        ...base(),
        latitude: null,
        longitude: null,
        locationPrecision: null,
        sources: [],
      }).ok,
    ).toBe(true);
  });

  it('rejects missing required fields and non-Kerala districts', () => {
    expect(validatePlace({ ...base(), name: '' }).ok).toBe(false);
    expect(validatePlace({ ...base(), categoryIds: [] }).ok).toBe(false);
    expect(validatePlace({ ...base(), district: 'Atlantis' }).ok).toBe(false);
  });

  it('requires a note for rejected submissions', () => {
    const sub = JSON.parse(JSON.stringify(seed!.submissions.find((s) => s.status === 'rejected')));
    expect(validateSubmission(sub).ok).toBe(true);
    expect(validateSubmission({ ...sub, reviewerNote: null }).ok).toBe(false);
  });
});
