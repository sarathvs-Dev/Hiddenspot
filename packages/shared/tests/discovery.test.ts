import { describe, expect, it } from 'vitest';
import { RAW_SEED } from '../data';
import type { Category, Place, ReferenceLocation, Review } from '../types';
import {
  bayesianRating,
  countActiveFilters,
  createDistanceLookup,
  EARTH_RADIUS_KM,
  filterPlaces,
  getDistanceFromReference,
  haversineKm,
  isValidCoordinates,
  matchesPlaceText,
  queryPlaces,
  sortPlaces,
  uniqueById,
  validateSeedData,
  withReviewStats,
} from '../utils';

const seed = (() => {
  const r = validateSeedData(RAW_SEED);
  if (!r.ok) throw new Error('seed invalid');
  return r.value;
})();

const categories: Category[] = seed.categories;

/** A neutral place; tests override only what they need. */
const base: Place = {
  id: 'pl-base',
  slug: 'base',
  name: 'Base',
  shortDescription: 'Plain test place.',
  description: null,
  categoryIds: ['peaceful'],
  tags: [],
  address: null,
  district: 'Ernakulam',
  state: 'Kerala',
  country: 'India',
  latitude: null,
  longitude: null,
  locationPrecision: null,
  imageUrls: [],
  averageRating: null,
  reviewCount: 0,
  popularityCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  openingHours: null,
  entryFee: null,
  bestTimeToVisit: null,
  safetyNotes: [],
  moderationStatus: 'approved',
  createdBy: 'usr-anu',
  isSyntheticDemo: false,
  sources: [],
};
const make = (over: Partial<Place>): Place => ({ ...base, ...over });
const ids = (list: Place[]) => list.map((p) => p.id);
const kochi: ReferenceLocation = {
  label: 'Kochi',
  latitude: 9.9312,
  longitude: 76.2673,
  kind: 'preset',
};

/** One degree of latitude along a meridian is exactly R × π / 180. */
const ONE_DEGREE_KM = (EARTH_RADIUS_KM * Math.PI) / 180;

describe('haversine distance', () => {
  it('is zero for the same point and symmetric', () => {
    expect(haversineKm(kochi, kochi)).toBe(0);
    const tvm = { latitude: 8.5241, longitude: 76.9366 };
    expect(haversineKm(kochi, tvm)).toBeCloseTo(haversineKm(tvm, kochi), 10);
  });

  it('matches exact geometry: one degree of latitude and a quarter meridian', () => {
    expect(
      haversineKm({ latitude: 10, longitude: 76 }, { latitude: 11, longitude: 76 }),
    ).toBeCloseTo(ONE_DEGREE_KM, 6);
    expect(haversineKm({ latitude: 0, longitude: 0 }, { latitude: 90, longitude: 0 })).toBeCloseTo(
      ONE_DEGREE_KM * 90,
      6,
    );
    // Antipodal points: half the circumference, no NaN from rounding.
    expect(haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 })).toBeCloseTo(
      ONE_DEGREE_KM * 180,
      6,
    );
  });

  it('agrees with an independent flat-earth approximation over a short distance', () => {
    // Kochi to Thiruvananthapuram. Over ~170 km the equirectangular approximation is within 0.1%.
    const tvm = { latitude: 8.5241, longitude: 76.9366 };
    const rad = Math.PI / 180;
    const meanLat = ((kochi.latitude + tvm.latitude) / 2) * rad;
    const x = (tvm.longitude - kochi.longitude) * rad * Math.cos(meanLat);
    const y = (tvm.latitude - kochi.latitude) * rad;
    const approx = Math.sqrt(x * x + y * y) * EARTH_RADIUS_KM;
    const km = haversineKm(kochi, tvm);
    expect(Math.abs(km - approx) / approx).toBeLessThan(0.001);
    expect(km).toBeGreaterThan(170);
    expect(km).toBeLessThan(176);
  });

  it('returns NaN, never a fake number, for invalid coordinates', () => {
    const bad = [
      { latitude: Number.NaN, longitude: 76 },
      { latitude: 91, longitude: 76 },
      { latitude: 10, longitude: -181 },
      { latitude: Number.POSITIVE_INFINITY, longitude: 76 },
    ];
    for (const point of bad) {
      expect(isValidCoordinates(point)).toBe(false);
      expect(haversineKm(kochi, point)).toBeNaN();
    }
    expect(isValidCoordinates({ latitude: '10', longitude: 76 })).toBe(false);
    expect(isValidCoordinates(null)).toBe(false);
  });
});

describe('missing coordinates', () => {
  it('has no distance when the place or reference lacks valid coordinates', () => {
    const located = make({ latitude: 10, longitude: 76 });
    expect(getDistanceFromReference(make({}), kochi)).toBeUndefined();
    expect(
      getDistanceFromReference(make({ latitude: 10, longitude: null }), kochi),
    ).toBeUndefined();
    expect(getDistanceFromReference(make({ latitude: 200, longitude: 76 }), kochi)).toBeUndefined();
    expect(getDistanceFromReference(located, null)).toBeUndefined();
    expect(
      getDistanceFromReference(located, { label: 'Bad', latitude: Number.NaN, longitude: 76 }),
    ).toBeUndefined();
    expect(getDistanceFromReference(located, kochi)).toBeGreaterThan(0);
  });

  it('sorts places without coordinates last when sorting by nearest', () => {
    const near = make({ id: 'pl-near', name: 'Near', latitude: 10, longitude: 76.3 });
    const far = make({ id: 'pl-far', name: 'Far', latitude: 12, longitude: 75 });
    const unknown = make({ id: 'pl-unknown', name: 'Aaa unknown' });
    expect(ids(sortPlaces([unknown, far, near], 'distance', { reference: kochi }))).toEqual([
      'pl-near',
      'pl-far',
      'pl-unknown',
    ]);
  });

  it('computes each distance once per query', () => {
    let calls = 0;
    const place = make({ latitude: 10, longitude: 76 });
    const lookup = createDistanceLookup(kochi);
    const counted = (p: Place) => {
      calls += 1;
      return lookup(p);
    };
    expect(counted(place)).toBe(lookup(place));
    expect(calls).toBe(1);
    // The lookup caches: same object, same number, no recomputation needed.
    expect(lookup(place)).toBe(lookup(place));
  });
});

describe('radius filter', () => {
  const at = (km: number, id: string) =>
    // Due north of the reference by `km` kilometres.
    make({
      id,
      name: id,
      latitude: kochi.latitude + km / ONE_DEGREE_KM,
      longitude: kochi.longitude,
    });

  it('includes places exactly on the boundary and excludes those just outside', () => {
    const edge = make({ id: 'pl-edge', name: 'pl-edge', latitude: 10.0, longitude: 76.2673 });
    const edgeKm = getDistanceFromReference(edge, kochi)!;
    const inside = at(edgeKm - 1, 'pl-inside');
    const outside = at(edgeKm + 0.01, 'pl-outside');
    const result = filterPlaces(
      [inside, edge, outside],
      { maxDistanceKm: edgeKm },
      categories,
      kochi,
    );
    expect(ids(result)).toEqual(['pl-inside', 'pl-edge']);
  });

  it('excludes places without coordinates only while a radius applies', () => {
    const unknown = make({ id: 'pl-unknown' });
    expect(filterPlaces([unknown], { maxDistanceKm: 25 }, categories, kochi)).toHaveLength(0);
    expect(filterPlaces([unknown], {}, categories, kochi)).toHaveLength(1);
  });

  it('is ignored without a valid reference location or a valid radius', () => {
    const far = at(300, 'pl-far');
    expect(filterPlaces([far], { maxDistanceKm: 5 }, categories, null)).toHaveLength(1);
    expect(
      filterPlaces([far], { maxDistanceKm: 5 }, categories, {
        label: 'Bad',
        latitude: 999,
        longitude: 0,
      }),
    ).toHaveLength(1);
    expect(filterPlaces([far], { maxDistanceKm: Number.NaN }, categories, kochi)).toHaveLength(1);
    expect(filterPlaces([far], { maxDistanceKm: -1 }, categories, kochi)).toHaveLength(1);
    expect(countActiveFilters({ maxDistanceKm: Number.NaN })).toBe(0);
  });
});

describe('category filter', () => {
  const water = make({ id: 'pl-water', categoryIds: ['waterfalls'] });
  const beach = make({ id: 'pl-beach', categoryIds: ['beaches', 'photoshoot'] });
  const hill = make({ id: 'pl-hill', categoryIds: ['hill-viewpoints'] });

  it('keeps places in any selected category, including secondary categories', () => {
    expect(
      ids(filterPlaces([water, beach, hill], { categoryIds: ['waterfalls', 'photoshoot'] })),
    ).toEqual(['pl-water', 'pl-beach']);
  });

  it('returns everything when no category is selected', () => {
    expect(filterPlaces([water, beach, hill], { categoryIds: [] })).toHaveLength(3);
  });
});

describe('search matching', () => {
  const index = new Map(categories.map((c) => [c.id, c]));
  const place = make({
    name: 'Kuttikkanam Pine Grove',
    shortDescription: 'Shady forest walks.',
    description: 'Misty mornings under tall trees.',
    categoryIds: ['forests-lakes'],
    district: 'Idukki',
    address: 'Near Peermade junction',
    tags: ['picnic'],
    state: 'Kerala',
  });
  const match = (q: string) => matchesPlaceText(place, q, index);

  it('searches name, description, category, district and address, ignoring case', () => {
    expect(match('KUTTIKKANAM')).toBe(true);
    expect(match('shady')).toBe(true);
    expect(match('misty')).toBe(true);
    expect(match('lakes')).toBe(true);
    expect(match('idukki')).toBe(true);
    expect(match('peermade')).toBe(true);
  });

  it('does not match unrelated fields or the middle of words', () => {
    expect(match('kerala')).toBe(false);
    expect(match('picnic')).toBe(false);
    expect(match('ove')).toBe(false);
    expect(match('pine')).toBe(true);
    expect(match('pin')).toBe(true);
  });

  it('requires every word and ignores punctuation and accents', () => {
    expect(match('pine, idukki!')).toBe(true);
    expect(match('pine wayanad')).toBe(false);
    expect(match('ÍDUKKI')).toBe(true);
    expect(match('   ')).toBe(true);
  });
});

describe('combined filters', () => {
  const near = { latitude: 10.0, longitude: 76.3 };
  const list = [
    make({ id: 'pl-a', name: 'Alpha Falls', categoryIds: ['waterfalls'], ...near }),
    make({
      id: 'pl-b',
      name: 'Beta Falls',
      categoryIds: ['waterfalls'],
      latitude: 11.5,
      longitude: 76.0,
    }),
    make({ id: 'pl-c', name: 'Gamma Beach', categoryIds: ['beaches'], ...near }),
    make({ id: 'pl-d', name: 'Delta Falls', categoryIds: ['beaches'], ...near }),
  ];

  it('applies search, category and distance together without one erasing another', () => {
    const q = (extra: object) => ids(queryPlaces(list, { reference: kochi, ...extra }, categories));
    expect(q({ query: 'falls' })).toHaveLength(3);
    expect(q({ query: 'falls', categoryIds: ['waterfalls'] }).sort()).toEqual(['pl-a', 'pl-b']);
    expect(q({ query: 'falls', categoryIds: ['waterfalls'], maxDistanceKm: 25 })).toEqual(['pl-a']);
    // Changing the sort keeps every filter.
    expect(
      q({ query: 'falls', categoryIds: ['waterfalls'], maxDistanceKm: 25, sortBy: 'newest' }),
    ).toEqual(['pl-a']);
  });

  it('returns an empty list, not an error, when nothing matches', () => {
    expect(queryPlaces(list, { query: 'zzzz' }, categories)).toEqual([]);
    expect(queryPlaces(list, { categoryIds: ['temples-churches'] }, categories)).toEqual([]);
    expect(queryPlaces([], { sortBy: 'distance', reference: kochi }, categories)).toEqual([]);
    expect(queryPlaces(list, { reference: kochi, maxDistanceKm: 0 }, categories)).toEqual([]);
  });

  it('gives the same result for the real seed whatever the input order', () => {
    const forward = ids(
      queryPlaces(
        seed.places,
        { query: 'falls', reference: kochi, sortBy: 'distance' },
        categories,
      ),
    );
    const reversed = ids(
      queryPlaces(
        [...seed.places].reverse(),
        { query: 'falls', reference: kochi, sortBy: 'distance' },
        categories,
      ),
    );
    expect(forward.length).toBeGreaterThan(0);
    expect(reversed).toEqual(forward);
  });
});

describe('sorting order', () => {
  const p = (id: string, over: Partial<Place>) => make({ id, name: id, ...over });

  it('nearest: ascending distance, falling back to recommended without a usable reference', () => {
    const list = [
      p('pl-b', { latitude: 11, longitude: 76.27 }),
      p('pl-a', { latitude: 10, longitude: 76.27 }),
    ];
    expect(ids(sortPlaces(list, 'distance', { reference: kochi }))).toEqual(['pl-a', 'pl-b']);
    const bad = { label: 'Bad', latitude: Number.NaN, longitude: 0 };
    expect(ids(sortPlaces(list, 'distance', { reference: bad }))).toEqual(
      ids(sortPlaces(list, 'recommended')),
    );
  });

  it('most rated: Bayesian score, so few perfect reviews do not beat many strong ones', () => {
    const one = p('pl-one', { averageRating: 5, reviewCount: 1 });
    const many = p('pl-many', { averageRating: 4.7, reviewCount: 20 });
    const none = p('pl-none', { averageRating: null, reviewCount: 0 });
    expect(ids(sortPlaces([none, one, many], 'rating'))).toEqual(['pl-many', 'pl-one', 'pl-none']);
    // Formula: (avg × n + 3.8 × 3) / (n + 3).
    expect(bayesianRating(one)).toBeCloseTo((5 + 3.8 * 3) / 4, 10);
    expect(bayesianRating(none)).toBeNull();
  });

  it('most rated: equal scores fall back to more reviews, then name', () => {
    const a = p('pl-a', { averageRating: 3.8, reviewCount: 2 });
    const b = p('pl-b', { averageRating: 3.8, reviewCount: 9 });
    const c = p('pl-c', { averageRating: 3.8, reviewCount: 9 });
    expect(ids(sortPlaces([c, a, b], 'rating'))).toEqual(['pl-b', 'pl-c', 'pl-a']);
  });

  it('newly added: newest first, invalid dates last', () => {
    const list = [
      p('pl-old', { createdAt: '2025-01-01T00:00:00Z' }),
      p('pl-bad', { createdAt: 'not a date' }),
      p('pl-new', { createdAt: '2026-06-01T00:00:00Z' }),
    ];
    expect(ids(sortPlaces(list, 'newest'))).toEqual(['pl-new', 'pl-old', 'pl-bad']);
  });

  it('most popular: highest count first, bad counts treated as zero, ties by name', () => {
    const list = [
      p('pl-c', { popularityCount: 10 }),
      p('pl-a', { popularityCount: Number.NaN }),
      p('pl-b', { popularityCount: 10 }),
      p('pl-d', { popularityCount: 500 }),
    ];
    expect(ids(sortPlaces(list, 'popularity'))).toEqual(['pl-d', 'pl-b', 'pl-c', 'pl-a']);
  });

  it('is deterministic for every sort and never mutates the input', () => {
    const copy = [...seed.places];
    for (const sortBy of [
      'recommended',
      'rating',
      'newest',
      'popularity',
      'distance',
      'name',
    ] as const) {
      const a = ids(sortPlaces(seed.places, sortBy, { reference: kochi }));
      const b = ids(sortPlaces([...seed.places].reverse(), sortBy, { reference: kochi }));
      expect(b).toEqual(a);
    }
    expect(seed.places).toEqual(copy);
  });
});

describe('rating summaries', () => {
  const review = (id: string, rating: number): Review => ({
    id,
    placeId: 'pl-base',
    userId: `usr-${id}`,
    rating,
    title: null,
    body: 'Sample review text for testing.',
    visitedOn: null,
    createdAt: '2026-01-01T00:00:00Z',
    source: 'demo',
  });

  it('recomputes from reviews and ignores the stored average', () => {
    const stored = make({ averageRating: 1.2, reviewCount: 99 });
    const [result] = withReviewStats([stored], [review('a', 5), review('b', 4)]);
    expect(result!.averageRating).toBe(4.5);
    expect(result!.reviewCount).toBe(2);
  });

  it('ignores invalid ratings', () => {
    const bad = [
      review('a', 0),
      review('b', 6),
      review('c', 3.5),
      review('d', Number.NaN),
      review('e', 4),
    ];
    const [result] = withReviewStats([make({})], bad);
    expect(result!.averageRating).toBe(4);
    expect(result!.reviewCount).toBe(1);
  });

  it('has a null average and no Bayesian score without valid reviews', () => {
    const [result] = withReviewStats(
      [make({ averageRating: 4.9, reviewCount: 3 })],
      [review('a', 9)],
    );
    expect(result!.averageRating).toBeNull();
    expect(result!.reviewCount).toBe(0);
    expect(bayesianRating(result!)).toBeNull();
  });
});

describe('duplicate ids', () => {
  it('keeps the first place for each id in query results', () => {
    const first = make({ id: 'pl-dup', name: 'First' });
    const second = make({ id: 'pl-dup', name: 'Second' });
    expect(uniqueById([first, second])).toEqual([first]);
    const result = queryPlaces([first, second, make({ id: 'pl-other' })], {}, categories);
    expect(result.filter((p) => p.id === 'pl-dup')).toHaveLength(1);
    expect(result.find((p) => p.id === 'pl-dup')!.name).toBe('First');
  });

  it('rejects seed data with duplicate place ids', () => {
    const places = RAW_SEED.places as Place[];
    const result = validateSeedData({ ...RAW_SEED, places: [...places, places[0]] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.message.includes('duplicate'))).toBe(true);
  });

  it('has no duplicate ids or slugs in the real seed', () => {
    expect(new Set(seed.places.map((p) => p.id)).size).toBe(seed.places.length);
    expect(new Set(seed.places.map((p) => p.slug)).size).toBe(seed.places.length);
  });
});
