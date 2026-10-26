import type { Category, CategoryId, Place } from '../types';

export function indexCategories(categories: readonly Category[]): Map<CategoryId, Category> {
  return new Map(categories.map((c) => [c.id, c]));
}

/** The first category is the primary one, used for card labels and icons. */
export function getPrimaryCategoryId(place: Pick<Place, 'categoryIds'>): CategoryId {
  const id = place.categoryIds[0];
  if (!id) throw new Error('A place must have at least one category');
  return id;
}

export function sortCategories(categories: readonly Category[]): Category[] {
  return [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
}
