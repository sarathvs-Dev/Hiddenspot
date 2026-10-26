/** Single source for URLs so links and routes cannot drift apart. */
export const paths = {
  home: '/',
  explore: '/explore',
  saved: '/saved',
  addSpot: '/add',
  profile: '/profile',
  admin: '/admin',
  designSystem: '/design-system',
  /** Readable, stable URL: /places/munroe-island. The data service accepts slug or id. */
  place: (slug: string) => `/places/${encodeURIComponent(slug)}`,
} as const;
