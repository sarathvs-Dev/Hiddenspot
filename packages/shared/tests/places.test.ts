import { describe, expect, it } from 'vitest';
import { RAW_SEED } from '../data';
import type { Place } from '../types';
import {
  bayesianRating,
  compareText,
  countActiveFilters,
  filterPlaces,
  queryPlaces,
  sanitizePlaceQuery,
  serializePlaceQuery,
  sortPlaces,
  toggleInList,
  validateSeedData,
} from '../utils';

const seed = (() => {
  const r = validateSeedData(RAW_SEED);
  if (!r.ok) throw new Error('seed invalid');
  return r.value;
})();
const places = seed.places;
const categories = seed.categories;

const make = (over: Partial<Place>): Place => ({ ...places[0]!, ...over });

describe('search', () => {
  it('matches name, district, description and category names, ignoring case and accents', () => {
    const ids = (q: string) => queryPlaces(places, { query: q }, categories).map((p) => p.id);
    expect(ids('ATHIRAPPILLY')).toContain('pl-athirappilly-falls');
    expect(ids('wayanad').length).toBeGreaterThan(3);
    expect(ids('cliffs')).toContain('pl-varkala-beach');
    expect(ids('waterfalls').length).toBeGreaterThanOrEqual(7);
  });

  it('requires every word to match', () => {
    expect(queryPlaces(places, { query: 'varkala idukki' }, categories)).toHaveLength(0);
  });

  it('puts name matches first for the default sort', () => {
    const result = queryPlaces(places, { query: 'falls' }, categories);
    expect(result[0]!.name.toLowerCase()).toContain('falls');
  });
});

describe('filters', () => {
  it('matches any selected category', () => {
    const result = filterPlaces(places, { categoryIds: ['beaches', 'temples-churches'] });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((p) => p.categoryIds.some((c) => c === 'beaches' || c === 'temples-churches')),
    ).toBe(true);
  });

  it('filters by district', () => {
    const result = filterPlaces(places, { districts: ['Idukki'] });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.district === 'Idukki')).toBe(true);
  });

  it('excludes unrated places when a minimum rating is set', () => {
    const result = filterPlaces(places, { minRating: 4 });
    expect(result.every((p) => p.averageRating !== null && p.averageRating >= 4)).toBe(true);
  });

  it('can hide places without photos', () => {
    expect(
      filterPlaces(places, { withPhotosOnly: true }).every((p) => p.imageUrls.length > 0),
    ).toBe(true);
  });

  it('counts active filters and toggles list values', () => {
    expect(countActiveFilters({})).toBe(0);
    expect(
      countActiveFilters({ query: ' x ', categoryIds: ['beaches'], withPhotosOnly: true }),
    ).toBe(3);
    expect(toggleInList(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleInList(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('sorting', () => {
  it('sorts by rating with unrated places last', () => {
    const result = sortPlaces(places, 'rating');
    const firstNull = result.findIndex((p) => p.averageRating === null);
    expect(firstNull).toBeGreaterThan(0);
    expect(result.slice(firstNull).every((p) => p.averageRating === null)).toBe(true);
    const scores = result.slice(0, firstNull).map((p) => bayesianRating(p)!);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('sorts by popularity, newest and name', () => {
    const pop = sortPlaces(places, 'popularity').map((p) => p.popularityCount);
    expect(pop).toEqual([...pop].sort((a, b) => b - a));
    const newest = sortPlaces(places, 'newest').map((p) => Date.parse(p.createdAt));
    expect(newest).toEqual([...newest].sort((a, b) => b - a));
    const names = sortPlaces(places, 'name').map((p) => p.name);
    expect(names).toEqual([...names].sort(compareText));
  });

  it('ranks a single 5-star review below a strong multi-review place', () => {
    const one = make({
      id: 'pl-one',
      name: 'One',
      averageRating: 5,
      reviewCount: 1,
      popularityCount: 0,
      isSyntheticDemo: false,
    });
    const many = make({
      id: 'pl-many',
      name: 'Many',
      averageRating: 4.7,
      reviewCount: 20,
      popularityCount: 0,
      isSyntheticDemo: false,
    });
    expect(sortPlaces([one, many], 'recommended').map((p) => p.id)).toEqual(['pl-many', 'pl-one']);
  });

  it('sorts by distance with unknown coordinates last, and falls back without a reference', () => {
    const near = make({ id: 'pl-near', name: 'Near', latitude: 10.0, longitude: 76.3 });
    const far = make({ id: 'pl-far', name: 'Far', latitude: 12.0, longitude: 75.0 });
    const unknown = make({ id: 'pl-unknown', name: 'Unknown', latitude: null, longitude: null });
    const reference = { label: 'Kochi', latitude: 9.97, longitude: 76.28 };
    expect(sortPlaces([unknown, far, near], 'distance', { reference }).map((p) => p.id)).toEqual([
      'pl-near',
      'pl-far',
      'pl-unknown',
    ]);
    expect(sortPlaces([unknown, far, near], 'distance')).toHaveLength(3);
  });

  it('is deterministic and does not mutate the input', () => {
    const copy = [...places];
    const a = sortPlaces(places, 'recommended').map((p) => p.id);
    const b = sortPlaces([...places].reverse(), 'recommended').map((p) => p.id);
    expect(a).toEqual(b);
    expect(places).toEqual(copy);
  });

  it('compares text without locale rules', () => {
    expect(compareText('apple', 'Banana')).toBeLessThan(0);
    expect(compareText('Éclair', 'eclair')).toBe(0);
  });
});

describe('query params', () => {
  it('drops invalid values and round-trips valid ones', () => {
    expect(
      sanitizePlaceQuery({
        query: ' lake ',
        categories: 'beaches,volcano',
        districts: 'Idukki,Atlantis',
        minRating: '9',
        sortBy: 'bogus',
      }),
    ).toEqual({ query: 'lake', categoryIds: ['beaches'], districts: ['Idukki'] });
    const original = {
      query: 'falls',
      categoryIds: ['waterfalls' as const],
      districts: ['Wayanad'],
      minRating: 4,
      sortBy: 'rating' as const,
    };
    expect(sanitizePlaceQuery(serializePlaceQuery(original))).toEqual(original);
  });
});
