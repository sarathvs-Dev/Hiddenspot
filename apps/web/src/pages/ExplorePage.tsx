import {
  copy,
  countActiveFilters,
  DISTANCE_RADIUS_OPTIONS,
  sanitizePlaceQuery,
  serializePlaceQuery,
  SORT_CHOICES,
  sortLabel,
  toggleInList,
  type PlaceQuery,
  type PlaceSortOption,
  isValidCoordinates,
} from '@hiddenspot/shared';
import { useCatalog, useDebouncedValue, useDistricts, usePlaces } from '@hiddenspot/shared/react';
import { LayoutGrid, List, Map as MapIcon, SearchX, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useLocationContext } from '../lib/location';
import { isMapConfigured } from '../lib/mapConfig';
import { usePageMeta } from '../lib/usePageMeta';
import {
  Button,
  CategoryChips,
  Checkbox,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingRegion,
  LocationSelector,
  Modal,
  PlaceCard,
  PlaceCardSkeleton,
  PlaceGrid,
  PlaceList,
  PlaceMap,
  RemovableChip,
  SearchField,
  SectionHeading,
  SelectField,
} from '../ui';
import styles from './ExplorePage.module.css';

const PAGE_SIZE = 12;
type ViewMode = 'grid' | 'list' | 'map';

const RATING_OPTIONS = [
  { value: '3', label: '3 stars and up' },
  { value: '4', label: '4 stars and up' },
  { value: '4.5', label: '4.5 stars and up' },
];

interface FilterPanelProps {
  filters: PlaceQuery;
  update: (next: PlaceQuery) => void;
  districts: string[];
  referenceLabel: string;
}

/** Same controls in the desktop sidebar and the phone sheet. */
function FilterPanel({ filters, update, districts, referenceLabel }: FilterPanelProps) {
  return (
    <div className={styles.panel}>
      <SelectField
        label="Sort by"
        value={filters.sortBy ?? 'recommended'}
        onChange={(e) => update({ ...filters, sortBy: e.target.value as PlaceSortOption })}
        options={SORT_CHOICES}
      />
      <SelectField
        label="Distance"
        value={filters.maxDistanceKm?.toString() ?? ''}
        placeholder="Any distance"
        hint={`Straight line from ${referenceLabel}. Places without a verified location are hidden when set.`}
        onChange={(e) =>
          update({ ...filters, maxDistanceKm: e.target.value ? Number(e.target.value) : undefined })
        }
        options={DISTANCE_RADIUS_OPTIONS.map((km) => ({
          value: String(km),
          label: `Within ${km} km`,
        }))}
      />
      <SelectField
        label="Minimum rating"
        value={filters.minRating?.toString() ?? ''}
        placeholder="Any rating"
        onChange={(e) =>
          update({ ...filters, minRating: e.target.value ? Number(e.target.value) : undefined })
        }
        options={RATING_OPTIONS}
      />
      <fieldset className={styles.fieldset}>
        <legend className="ds-type-label">District</legend>
        <div className={styles.districts}>
          {districts.map((district) => (
            <Checkbox
              key={district}
              label={district}
              checked={filters.districts?.includes(district) ?? false}
              onChange={() =>
                update({ ...filters, districts: toggleInList(filters.districts, district) })
              }
            />
          ))}
        </div>
      </fieldset>
      <Checkbox
        label="With photos only"
        checked={filters.withPhotosOnly ?? false}
        onChange={(e) => update({ ...filters, withPhotosOnly: e.target.checked || undefined })}
      />
    </div>
  );
}

/** Filters live in the URL, so results are shareable and survive reloads. */
export function ExplorePage() {
  usePageMeta(
    'Explore',
    'Search and filter hidden places across Kerala by category, district and distance.',
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const { getCategory } = useCatalog();
  const { reference } = useLocationContext();
  const districts = useDistricts();

  const filters = useMemo(
    () => sanitizePlaceQuery(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );
  const requestedView = searchParams.get('view');
  const view: ViewMode =
    requestedView === 'list' ? 'list' : requestedView === 'map' && isMapConfigured ? 'map' : 'grid';

  const [queryInput, setQueryInput] = useState(filters.query ?? '');
  // Debounced so the URL and results update after a pause in typing, not on every key.
  const deferredQuery = useDebouncedValue(queryInput);
  const [sheetOpen, setSheetOpen] = useState(false);
  const filterKey = searchParams.toString();
  const [shown, setShown] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = shown.key === filterKey ? shown.count : PAGE_SIZE;

  const writeParams = (next: PlaceQuery, nextView: ViewMode = view) => {
    const params = serializePlaceQuery(next);
    if (nextView !== 'grid') params.view = nextView;
    setSearchParams(params, { replace: true });
  };
  const update = (next: PlaceQuery) => writeParams(next);

  // Keep the input in step with the URL (back/forward), and the URL in step with typing.
  const [lastUrlQuery, setLastUrlQuery] = useState(filters.query ?? '');
  if ((filters.query ?? '') !== lastUrlQuery) {
    setLastUrlQuery(filters.query ?? '');
    if ((filters.query ?? '') !== deferredQuery.trim()) setQueryInput(filters.query ?? '');
  }
  useEffect(() => {
    const trimmed = deferredQuery.trim();
    if (trimmed === (filters.query ?? '')) return;
    const params = serializePlaceQuery({ ...filters, query: trimmed || undefined });
    if (view !== 'grid') params.view = view;
    setSearchParams(params, { replace: true });
  }, [deferredQuery, filters, view, setSearchParams]);

  const { data, error, isLoading, reload } = usePlaces({ ...filters, reference });
  const total = data?.length ?? 0;
  const visible = useMemo(() => (data ?? []).slice(0, visibleCount), [data, visibleCount]);
  const mapped = useMemo(() => (data ?? []).filter((p) => isValidCoordinates(p)), [data]);
  const referenceLabel = reference
    ? reference.kind === 'device'
      ? 'your location'
      : `${reference.label} (demo location)`
    : 'your chosen location';

  const clearAll = () => {
    setQueryInput('');
    setSearchParams(view !== 'grid' ? { view } : {}, { replace: true });
  };

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(filters.query
      ? [
          {
            key: 'q',
            label: `“${filters.query}”`,
            remove: () => {
              setQueryInput('');
              update({ ...filters, query: undefined });
            },
          },
        ]
      : []),
    ...(filters.categoryIds ?? []).map((id) => ({
      key: `c-${id}`,
      label: getCategory(id)?.name ?? id,
      remove: () => update({ ...filters, categoryIds: toggleInList(filters.categoryIds, id) }),
    })),
    ...(filters.districts ?? []).map((d) => ({
      key: `d-${d}`,
      label: d,
      remove: () => update({ ...filters, districts: toggleInList(filters.districts, d) }),
    })),
    ...(filters.maxDistanceKm !== undefined
      ? [
          {
            key: 'r',
            label: `Within ${filters.maxDistanceKm} km`,
            remove: () => update({ ...filters, maxDistanceKm: undefined }),
          },
        ]
      : []),
    ...(filters.minRating !== undefined
      ? [
          {
            key: 'm',
            label: `${filters.minRating}+ stars`,
            remove: () => update({ ...filters, minRating: undefined }),
          },
        ]
      : []),
    ...(filters.withPhotosOnly
      ? [
          {
            key: 'p',
            label: 'With photos',
            remove: () => update({ ...filters, withPhotosOnly: undefined }),
          },
        ]
      : []),
    ...(filters.sortBy && filters.sortBy !== 'recommended'
      ? [
          {
            key: 's',
            label: `Sort: ${sortLabel(filters.sortBy)}`,
            remove: () => update({ ...filters, sortBy: undefined }),
          },
        ]
      : []),
  ];

  const panelCount = countActiveFilters({ ...filters, query: undefined, categoryIds: undefined });
  const panel = (
    <FilterPanel
      filters={filters}
      update={update}
      districts={districts.data ?? []}
      referenceLabel={referenceLabel}
    />
  );

  return (
    <div className={`container ${styles.page}`}>
      <SectionHeading
        as="h1"
        size="page"
        eyebrow="Explore Kerala"
        title="Find your hidden spot"
        description="Search by name or district, then narrow it down."
      />

      <div className={styles.searchRow}>
        <SearchField
          value={queryInput}
          onChange={setQueryInput}
          className={styles.search}
          label="Search places"
          placeholder="Place name or district"
        />
        <Button
          variant="secondary"
          leadingIcon={SlidersHorizontal}
          className={styles.filtersButton}
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
        >
          Filters{panelCount > 0 ? ` (${panelCount})` : ''}
        </Button>
      </div>
      <div className={styles.locationRow}>
        <LocationSelector compact />
      </div>

      <CategoryChips
        selected={filters.categoryIds ?? []}
        onToggle={(id) =>
          update({ ...filters, categoryIds: toggleInList(filters.categoryIds, id) })
        }
        onClear={() => update({ ...filters, categoryIds: [] })}
      />

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-labelledby="filters-title">
          <div className={styles.sidebarHead}>
            <h2 id="filters-title" className="ds-type-h3">
              Filters
            </h2>
          </div>
          {panel}
        </aside>

        <section className={styles.results} aria-labelledby="results-title">
          <div className={styles.resultsHead}>
            <p id="results-title" className="ds-type-label" aria-live="polite">
              {isLoading && !data
                ? 'Searching…'
                : `${total} ${total === 1 ? 'place' : 'places'} found`}
            </p>
            <div className={styles.viewToggle} role="group" aria-label="Layout">
              <IconButton
                icon={LayoutGrid}
                label="Grid view"
                size="sm"
                variant={view === 'grid' ? 'solid' : 'outline'}
                aria-pressed={view === 'grid'}
                onClick={() => writeParams(filters, 'grid')}
              />
              <IconButton
                icon={List}
                label="List view"
                size="sm"
                variant={view === 'list' ? 'solid' : 'outline'}
                aria-pressed={view === 'list'}
                onClick={() => writeParams(filters, 'list')}
              />
              <IconButton
                icon={MapIcon}
                label={isMapConfigured ? 'Map view' : 'Map view needs a tile provider (see README)'}
                size="sm"
                variant={view === 'map' ? 'solid' : 'outline'}
                aria-pressed={view === 'map'}
                disabled={!isMapConfigured}
                onClick={() => writeParams(filters, 'map')}
              />
            </div>
          </div>

          {chips.length > 0 ? (
            <div className={styles.chips} aria-label="Active filters">
              {chips.map((chip) => (
                <RemovableChip key={chip.key} label={chip.label} onRemove={chip.remove} />
              ))}
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear filters
              </Button>
            </div>
          ) : null}

          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : isLoading && !data ? (
            <LoadingRegion label="Loading places">
              <PlaceGrid>
                {Array.from({ length: 6 }, (_, i) => (
                  <li key={i}>
                    <PlaceCardSkeleton />
                  </li>
                ))}
              </PlaceGrid>
            </LoadingRegion>
          ) : total === 0 ? (
            <EmptyState
              icon={SearchX}
              title={copy.empty.noResults.title}
              message={copy.empty.noResults.message}
              action={<Button onClick={clearAll}>{copy.actions.clearFilters}</Button>}
            />
          ) : (
            <>
              {view === 'map' ? (
                <>
                  <PlaceMap places={mapped} reference={reference} />
                  <p className="ds-type-body-small">
                    {mapped.length} of {total} places have a verified location and appear on the
                    map.
                  </p>
                </>
              ) : null}
              {view === 'grid' ? (
                <PlaceGrid>
                  {visible.map((place) => (
                    <li key={place.id}>
                      <PlaceCard place={place} />
                    </li>
                  ))}
                </PlaceGrid>
              ) : (
                <PlaceList>
                  {visible.map((place) => (
                    <li key={place.id}>
                      <PlaceCard place={place} variant="compact" />
                    </li>
                  ))}
                </PlaceList>
              )}
              <div className={styles.more}>
                <p className="ds-type-body-small" aria-live="polite">
                  Showing {visible.length} of {total}
                </p>
                {visible.length < total ? (
                  <Button
                    variant="secondary"
                    onClick={() => setShown({ key: filterKey, count: visibleCount + PAGE_SIZE })}
                  >
                    Load {Math.min(PAGE_SIZE, total - visible.length)} more
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        variant="sheet"
        footer={
          <>
            <Button variant="secondary" onClick={clearAll}>
              Clear all
            </Button>
            <Button onClick={() => setSheetOpen(false)}>
              Show {total} {total === 1 ? 'place' : 'places'}
            </Button>
          </>
        }
      >
        {panel}
      </Modal>
    </div>
  );
}
