import type {
  Category,
  DemoStorageStatus,
  DemoUser,
  Place,
  PlaceQuery,
  ReferenceLocationPreset,
  ReviewWithAuthor,
  Submission,
} from '../types';
import { serializePlaceQuery } from '../utils/validation';
import { useDataService, useDataVersion } from './ServicesProvider';
import { useAsync, type AsyncState } from './useAsync';

/** Stable cache key for a query, including fields that are not URL params. */
function queryKey(query: PlaceQuery): string {
  const ref = query.reference ? `${query.reference.latitude},${query.reference.longitude}` : '';
  return `${JSON.stringify(serializePlaceQuery(query))}|${ref}|${query.limit ?? ''}`;
}

export function usePlaces(query: PlaceQuery = {}): AsyncState<Place[]> {
  const data = useDataService();
  const version = useDataVersion();
  return useAsync(() => data.getPlaces(query), `places:${queryKey(query)}:${version}`);
}

export function usePlace(id: string | undefined): AsyncState<Place | null> {
  const data = useDataService();
  const version = useDataVersion();
  return useAsync(
    () => (id ? data.getPlaceById(id) : Promise.resolve(null)),
    `place:${id ?? ''}:${version}`,
  );
}

export function useReviewsForPlace(placeId: string | undefined): AsyncState<ReviewWithAuthor[]> {
  const data = useDataService();
  const version = useDataVersion();
  return useAsync(
    () => (placeId ? data.getReviewsForPlace(placeId) : Promise.resolve([])),
    `reviews:${placeId ?? ''}:${version}`,
  );
}

export function useSubmissions(filter: { submittedBy?: string } = {}): AsyncState<Submission[]> {
  const data = useDataService();
  const version = useDataVersion();
  return useAsync(
    () => data.getSubmissions(filter),
    `submissions:${filter.submittedBy ?? ''}:${version}`,
  );
}

export function useSavedPlaces(): AsyncState<Place[]> {
  const data = useDataService();
  const version = useDataVersion();
  return useAsync(() => data.getSavedPlaces(), `saved:${version}`);
}

export function useCategoriesQuery(): AsyncState<Category[]> {
  const data = useDataService();
  return useAsync(() => data.getCategories(), 'categories');
}

export function useDistricts(): AsyncState<string[]> {
  const data = useDataService();
  const version = useDataVersion();
  return useAsync(() => data.getDistricts(), `districts:${version}`);
}

export function useCurrentUser(): AsyncState<DemoUser> {
  const data = useDataService();
  return useAsync(() => data.getCurrentUser(), 'current-user');
}

export function useStorageStatus(): AsyncState<DemoStorageStatus> {
  const data = useDataService();
  const version = useDataVersion();
  return useAsync(() => data.getStorageStatus(), `storage:${version}`);
}

export function useRelatedPlaces(placeId: string | undefined, limit = 6): AsyncState<Place[]> {
  const data = useDataService();
  const version = useDataVersion();
  return useAsync(
    () => (placeId ? data.getRelatedPlaces(placeId, limit) : Promise.resolve([])),
    `related:${placeId ?? ''}:${limit}:${version}`,
  );
}

export function useReferenceLocations(): AsyncState<ReferenceLocationPreset[]> {
  const data = useDataService();
  return useAsync(() => data.getReferenceLocations(), 'reference-locations');
}

/** Fictional demo accounts, used to show who submitted what. */
export function useDemoUsers(): AsyncState<DemoUser[]> {
  const data = useDataService();
  const version = useDataVersion();
  return useAsync(() => data.getDemoUsers(), `demo-users:${version}`);
}
