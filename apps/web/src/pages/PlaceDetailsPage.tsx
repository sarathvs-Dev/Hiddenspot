import {
  copy,
  formatDistanceFrom,
  formatEntryFee,
  getDistanceFromReference,
  formatLocation,
  formatOpeningHours,
  getCoverImage,
  getDirectionsUrl,
  describeLocation,
  getPrimaryCategoryId,
} from '@hiddenspot/shared';
import {
  useCatalog,
  usePlace,
  useReferenceLocation,
  useRelatedPlaces,
  useReviewsForPlace,
} from '@hiddenspot/shared/react';
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  Info,
  MapPin,
  MapPinOff,
  Navigation,
  PenLine,
  Ticket,
} from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { ReviewDialog } from '../components/ReviewDialog';
import { paths } from '../lib/paths';
import { usePageMeta } from '../lib/usePageMeta';
import {
  Badge,
  Button,
  ButtonAnchor,
  ButtonLink,
  CategoryIcon,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  ImageGallery,
  LoadingRegion,
  PlaceCard,
  PlaceGrid,
  RatingIndicator,
  ReviewCard,
  SaveButton,
  SectionHeading,
  Skeleton,
  SpotImage,
} from '../ui';
import styles from './PlaceDetailsPage.module.css';

export function PlaceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: place, error, isLoading, reload } = usePlace(id);
  const reviews = useReviewsForPlace(place?.id);
  const related = useRelatedPlaces(place?.id, 3);
  const { getCategory } = useCatalog();
  const { reference } = useReferenceLocation();
  const [reviewOpen, setReviewOpen] = useState(false);
  usePageMeta(place ? place.name : isLoading ? null : 'Place not found', place?.shortDescription);

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(paths.explore));

  // Links by id (for example from moderation) move to the readable slug URL.
  if (place && id !== place.slug) return <Navigate to={paths.place(place.slug)} replace />;

  if (error) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (isLoading && !place) {
    return (
      <LoadingRegion label="Loading place">
        <div className={`container ${styles.page}`}>
          <Skeleton ratio="hero" className={styles.heroSkeleton} />
          <Skeleton shape="text" width="40%" height={32} />
          <Skeleton shape="text" width="70%" />
        </div>
      </LoadingRegion>
    );
  }

  if (!place) {
    return (
      <div className="container">
        <EmptyState
          icon={MapPinOff}
          title={copy.empty.notFound.title}
          message={copy.empty.notFound.message}
          action={<ButtonLink to={paths.explore}>{copy.actions.explore}</ButtonLink>}
        />
      </div>
    );
  }

  const primary = getCategory(getPrimaryCategoryId(place));
  const gallery = place.imageUrls.map((src, index) => ({
    src,
    alt: `${place.name}, photo ${index + 1}`,
  }));
  // Directions go to exact coordinates only for site-level locations.
  const isSiteLocation = place.locationPrecision === 'site';
  const distance = reference ? getDistanceFromReference(place, reference) : undefined;

  return (
    <article className={`container ${styles.page}`}>
      <div className={styles.hero}>
        <SpotImage
          src={getCoverImage(place)}
          alt={`${place.name}, ${formatLocation(place)}`}
          fill
          priority
        />
        <div className={styles.heroScrim} aria-hidden="true" />
        <div className={styles.heroTop}>
          <IconButton icon={ChevronLeft} label="Go back" variant="glass" onClick={goBack} />
          <SaveButton placeId={place.id} placeName={place.name} variant="glass" />
        </div>
        <div className={styles.heroBottom}>
          {primary ? (
            <Badge appearance="glass" icon={<CategoryIcon icon={primary.icon} size="xs" />}>
              {primary.name}
            </Badge>
          ) : null}
          <h1 className="ds-type-h1">{place.name}</h1>
          <p className={`ds-type-body ${styles.heroLocation}`}>
            <Icon icon={MapPin} size="sm" />
            {formatLocation(place)}
          </p>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <p className={`ds-type-h3 ${styles.tagline}`}>{place.shortDescription}</p>

          {place.isSyntheticDemo ? (
            <p className={`ds-type-body-small ${styles.notice}`}>
              <Icon icon={Info} size="sm" />
              {copy.place.demoListingNote}
            </p>
          ) : null}

          <ul className={styles.stats} aria-label="Key facts">
            <li>
              <RatingIndicator rating={place.averageRating} reviewCount={place.reviewCount} />
            </li>
            {distance !== undefined && reference ? (
              <li className={styles.stat}>
                <Icon icon={Navigation} size="sm" />
                {formatDistanceFrom(distance, reference)}
                {place.locationPrecision === 'area' ? ' (to area centre)' : ''}
              </li>
            ) : null}
            {place.categoryIds.map((categoryId) => {
              const category = getCategory(categoryId);
              return category ? (
                <li key={categoryId} className={styles.stat}>
                  <CategoryIcon icon={category.icon} size="sm" />
                  {category.name}
                </li>
              ) : null;
            })}
          </ul>

          <section className={styles.section} aria-labelledby="about-title">
            <SectionHeading id="about-title" title="About this place" size="subsection" as="h2" />
            <p className={`ds-type-body ${styles.description}`}>
              {place.description ?? copy.place.noDescription}
            </p>
            {place.tags.length ? (
              <div className={styles.tags}>
                {place.tags.map((tag) => (
                  <Badge key={tag} appearance="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </section>

          {place.safetyNotes.length ? (
            <section className={styles.section} aria-labelledby="safety-title">
              <SectionHeading id="safety-title" title="Before you go" size="subsection" as="h2" />
              <ul className={`ds-type-body ${styles.notes}`}>
                {place.safetyNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {gallery.length > 1 ? (
            <section className={styles.section} aria-labelledby="gallery-title">
              <SectionHeading
                id="gallery-title"
                title="Gallery"
                description="Placeholder photos for the demo."
                size="subsection"
                as="h2"
              />
              <ImageGallery images={gallery} title={`${place.name} photos`} />
            </section>
          ) : null}

          <section className={styles.section} aria-labelledby="reviews-title">
            <SectionHeading
              id="reviews-title"
              title="Reviews"
              description={copy.review.sampleNote}
              size="subsection"
              as="h2"
              action={
                <Button
                  variant="secondary"
                  leadingIcon={PenLine}
                  onClick={() => setReviewOpen(true)}
                >
                  Write a review
                </Button>
              }
            />
            {reviews.isLoading && !reviews.data ? (
              <LoadingRegion label="Loading reviews">
                <Skeleton height={140} />
              </LoadingRegion>
            ) : reviews.data && reviews.data.length > 0 ? (
              <ul className={styles.reviews}>
                {reviews.data.map((review) => (
                  <li key={review.id}>
                    <ReviewCard review={review} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                size="inline"
                title={copy.empty.noReviews.title}
                message={copy.empty.noReviews.message}
                action={<Button onClick={() => setReviewOpen(true)}>Write the first review</Button>}
              />
            )}
          </section>

          {related.data && related.data.length > 0 ? (
            <section className={styles.section} aria-labelledby="related-title">
              <SectionHeading
                id="related-title"
                title="You might also like"
                description="Similar places nearby or in the same category."
                size="subsection"
                as="h2"
              />
              <PlaceGrid>
                {related.data.map((p) => (
                  <li key={p.id}>
                    <PlaceCard place={p} />
                  </li>
                ))}
              </PlaceGrid>
            </section>
          ) : null}
        </div>

        <aside className={styles.aside} aria-label="Plan your visit">
          <div className={styles.planCard}>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt className="ds-type-caption">
                  <Icon icon={CalendarDays} size="xs" /> Best time to visit
                </dt>
                <dd className="ds-type-body-small">
                  {place.bestTimeToVisit ?? copy.place.notConfirmed}
                </dd>
              </div>
              <div className={styles.fact}>
                <dt className="ds-type-caption">
                  <Icon icon={Clock} size="xs" /> Opening hours
                </dt>
                <dd className="ds-type-label">{formatOpeningHours(place.openingHours)}</dd>
              </div>
              <div className={styles.fact}>
                <dt className="ds-type-caption">
                  <Icon icon={Ticket} size="xs" /> Entry fee
                </dt>
                <dd className="ds-type-label">{formatEntryFee(place.entryFee)}</dd>
              </div>
              <div className={styles.fact}>
                <dt className="ds-type-caption">
                  <Icon icon={MapPin} size="xs" /> Location
                </dt>
                <dd className={`ds-type-caption ${styles.factHint}`}>
                  {describeLocation(place)}
                  {place.sources.some((s) => s.url) ? (
                    <span className={styles.sourceLinks}>
                      {place.sources
                        .filter((s) => s.url)
                        .map((s) => (
                          <a
                            key={s.url}
                            href={s.url ?? undefined}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            {s.name}
                          </a>
                        ))}
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>
            <ButtonAnchor
              href={getDirectionsUrl(place)}
              leadingIcon={Navigation}
              size="lg"
              fullWidth
            >
              {isSiteLocation ? copy.actions.directions : 'Find on map'}
            </ButtonAnchor>
          </div>
        </aside>
      </div>
      <ReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        placeId={place.id}
        placeName={place.name}
      />
    </article>
  );
}
