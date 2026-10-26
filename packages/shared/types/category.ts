/** Stable category identifiers. Must match data/categories.json. */
export const CATEGORY_IDS = [
  'waterfalls',
  'beaches',
  'hill-viewpoints',
  'forests-lakes',
  'temples-churches',
  'peaceful',
  'photoshoot',
  'hidden-gems',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

/**
 * Platform-neutral icon key. Each app maps it to its own icon library,
 * so shared code never imports UI packages.
 */
export const CATEGORY_ICON_KEYS = [
  'droplets',
  'umbrella',
  'mountain',
  'trees',
  'landmark',
  'leaf',
  'camera',
  'compass',
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];

export interface Category {
  id: CategoryId;
  slug: string;
  name: string;
  description: string;
  icon: CategoryIconKey;
  /** Display order, starting at 1. */
  sortOrder: number;
}
