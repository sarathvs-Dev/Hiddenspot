import {
  COLLECTIONS,
  copy,
  getCoverImage,
  serializePlaceQuery,
  type PlaceCollection,
} from '@hiddenspot/shared';
import { useCatalog, usePlaces } from '@hiddenspot/shared/react';
import { ArrowRight, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { paths } from '../lib/paths';
import { usePageMeta } from '../lib/usePageMeta';
import {
  Button,
  ButtonLink,
  CategoryIcon,
  ErrorState,
  LoadingRegion,
  LocationSelector,
  PlaceCard,
  PlaceCardSkeleton,
  PlaceGrid,
  SearchField,
  SectionHeading,
  Skeleton,
  SpotImage,
} from '../ui';
import styles from './HomePage.module.css';

const HERO_IMAGE = 'https://picsum.photos/seed/hs-welcome-terraces/1920/1080';

const exploreUrl = (query: PlaceCollection['query']) =>
  `${paths.explore}?${new URLSearchParams(serializePlaceQuery(query)).toString()}`;

function PlaceRow({
  title,
  description,
  query,
  seeAll,
}: {
  title: string;
  description: string;
  query: Parameters<typeof usePlaces>[0];
  seeAll: string;
}) {
  const places = usePlaces(query);
  const id = title.toLowerCase().replace(/\W+/g, '-');
  return (
    <section className={`container ${styles.section}`} aria-labelledby={id}>
      <SectionHeading
        id={id}
        title={title}
        description={description}
        action={
          <ButtonLink to={seeAll} variant="ghost" trailingIcon={ArrowRight}>
            {copy.actions.viewAll}
          </ButtonLink>
        }
      />
      {places.error ? (
        <ErrorState error={places.error} onRetry={places.reload} size="inline" />
      ) : places.data ? (
        <PlaceGrid>
          {places.data.map((place, index) => (
            <li key={place.id}>
              <PlaceCard place={place} priority={index < 2} />
            </li>
          ))}
        </PlaceGrid>
      ) : (
        <LoadingRegion label={`Loading ${title}`}>
          <PlaceGrid>
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>
                <PlaceCardSkeleton />
              </li>
            ))}
          </PlaceGrid>
        </LoadingRegion>
      )}
    </section>
  );
}

function CollectionCard({ collection }: { collection: PlaceCollection }) {
  const places = usePlaces({ ...collection.query, withPhotosOnly: true, limit: 1 });
  const all = usePlaces(collection.query);
  const cover = places.data?.[0];
  return (
    <Link to={exploreUrl(collection.query)} className={styles.collection}>
      {cover ? (
        <SpotImage src={getCoverImage(cover)} alt="" fill className={styles.collectionImage} />
      ) : (
        <Skeleton className={styles.collectionImage} />
      )}
      <span className={styles.collectionScrim} aria-hidden="true" />
      <span className={styles.collectionText}>
        <span className="ds-type-h3">{collection.title}</span>
        <span className="ds-type-body-small">{collection.description}</span>
        <span className="ds-type-label">
          {all.data ? `${all.data.length} places` : ' '}
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

export function HomePage() {
  usePageMeta(null);
  const navigate = useNavigate();
  const { categories } = useCatalog();
  const [query, setQuery] = useState('');

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(exploreUrl({ query: query.trim() || undefined }));
  };

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <SpotImage src={HERO_IMAGE} alt="" fill priority className={styles.heroImage} />
        <div className={styles.heroScrim} aria-hidden="true" />
        <div className={`container ${styles.heroContent}`}>
          <p className={`ds-type-overline ${styles.heroEyebrow}`}>{copy.brand.name} · Kerala</p>
          <h1 id="hero-title" className={`ds-type-display ${styles.heroTitle}`}>
            Find the quiet places worth the detour.
          </h1>
          <p className={`ds-type-body ${styles.heroLead}`}>
            Waterfalls, backwaters, misty hills and old temples across Kerala, picked for people who
            would rather not follow the crowd.
          </p>
          <form role="search" onSubmit={onSearch} className={styles.heroSearch}>
            <SearchField
              value={query}
              onChange={setQuery}
              size="lg"
              label="Search places, districts or moods"
              placeholder="Try “Wayanad” or “waterfall”"
              trailing={
                <Button type="submit" size="md">
                  Discover
                </Button>
              }
            />
          </form>
          <div className={styles.heroLocation}>
            <LocationSelector />
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="categories-title">
        <SectionHeading id="categories-title" title="Browse by category" />
        <ul className={styles.categories}>
          {categories.map((category) => (
            <li key={category.id}>
              <Link to={exploreUrl({ categoryIds: [category.id] })} className={styles.category}>
                <span className={styles.categoryIcon}>
                  <CategoryIcon icon={category.icon} size="lg" />
                </span>
                <span className="ds-type-label">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PlaceRow
        title="Featured hidden destinations"
        description="Well rated, well photographed and worth the detour."
        query={{ sortBy: 'recommended', withPhotosOnly: true, limit: 4 }}
        seeAll={exploreUrl({ sortBy: 'recommended' })}
      />

      <section className={`container ${styles.section}`} aria-labelledby="collections-title">
        <SectionHeading
          id="collections-title"
          eyebrow="Curated"
          title="Collections"
          description="Hand-picked sets to plan a day or a weekend."
        />
        <ul className={styles.collections}>
          {COLLECTIONS.map((collection) => (
            <li key={collection.id}>
              <CollectionCard collection={collection} />
            </li>
          ))}
        </ul>
      </section>

      <PlaceRow
        title="Trending"
        description="Most popular in this demo right now."
        query={{ sortBy: 'popularity', withPhotosOnly: true, limit: 4 }}
        seeAll={exploreUrl({ sortBy: 'popularity' })}
      />

      <PlaceRow
        title="Newly added"
        description="The latest places on HiddenSpot."
        query={{ sortBy: 'newest', limit: 4 }}
        seeAll={exploreUrl({ sortBy: 'newest' })}
      />

      <section className={`container ${styles.section}`}>
        <div className={styles.cta}>
          <div>
            <h2 className="ds-type-h2">Know a place most people miss?</h2>
            <p className="ds-type-body">
              Share it with the community. Every suggestion is reviewed before it goes live.
            </p>
          </div>
          <ButtonLink to={paths.addSpot} size="lg" leadingIcon={Plus}>
            Add a hidden spot
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
