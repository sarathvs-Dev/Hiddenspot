import type { PlaceQuery } from '../types';

/**
 * Editorial collections. Each is only a query over the shared place data,
 * so there is never a second copy of any place.
 */
export interface PlaceCollection {
  id: string;
  title: string;
  description: string;
  query: Omit<PlaceQuery, 'reference' | 'limit'>;
}

export const COLLECTIONS: readonly PlaceCollection[] = [
  {
    id: 'after-the-rain',
    title: 'Waterfalls after the rain',
    description: 'Falls that are usually fullest during and after the monsoon.',
    query: { categoryIds: ['waterfalls'], sortBy: 'rating' },
  },
  {
    id: 'slow-days',
    title: 'Slow, peaceful days',
    description: 'Backwaters, lakes and quiet corners to unwind.',
    query: { categoryIds: ['peaceful'], sortBy: 'recommended' },
  },
  {
    id: 'above-the-clouds',
    title: 'Above the clouds',
    description: 'Hill viewpoints for sunrise and mist.',
    query: { categoryIds: ['hill-viewpoints'], sortBy: 'rating' },
  },
  {
    id: 'faith-and-heritage',
    title: 'Faith and heritage',
    description: 'Historic temples and churches. Visit respectfully.',
    query: { categoryIds: ['temples-churches'], sortBy: 'recommended' },
  },
  {
    id: 'weekend-in-wayanad',
    title: 'A weekend in Wayanad',
    description: 'Peaks, caves, lakes and falls in one district.',
    query: { districts: ['Wayanad'], sortBy: 'recommended' },
  },
];
