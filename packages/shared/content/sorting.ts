import type { PlaceSortOption } from '../types';

/** Sorts offered in the apps: Nearest, Most rated, Newly added and Most popular, plus the default. */
export const SORT_CHOICES: { value: PlaceSortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'distance', label: 'Nearest' },
  { value: 'rating', label: 'Most rated' },
  { value: 'newest', label: 'Newly added' },
  { value: 'popularity', label: 'Most popular' },
];

export const sortLabel = (value: PlaceSortOption): string =>
  SORT_CHOICES.find((s) => s.value === value)?.label ?? value;
