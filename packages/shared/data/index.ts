/**
 * Immutable seed data. Only the data service reads these files; UI code must
 * go through HiddenSpotDataService instead of importing JSON.
 */
import categoriesJson from './categories.json';
import demoUsersJson from './demoUsers.json';
import placesJson from './places.json';
import referenceLocationsJson from './referenceLocations.json';
import reviewsJson from './reviews.json';
import submissionsJson from './submissions.json';

export { isKeralaDistrict, KERALA_DISTRICTS, type KeralaDistrict } from './kerala';

/** Raw seed JSON, typed as unknown so it must pass validateSeedData before use. */
export const RAW_SEED = {
  categories: categoriesJson as unknown,
  demoUsers: demoUsersJson as unknown,
  places: placesJson as unknown,
  reviews: reviewsJson as unknown,
  submissions: submissionsJson as unknown,
} as const;

/** Demo reference locations (town centres) with cited coordinates. */
export const RAW_REFERENCE_LOCATIONS: unknown = referenceLocationsJson;
