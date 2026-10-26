import {
  copy,
  formatLocation,
  getCoverImage,
  getDistanceFromReference,
  getPrimaryCategoryId,
  type Place,
} from '@hiddenspot/shared';
import { useCatalog, useReferenceLocation } from '@hiddenspot/shared/react';
import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '../lib/paths';
import { Badge } from './Badge';
import { CategoryIcon } from './CategoryIcon';
import { Icon } from './Icon';
import { DistanceIndicator, RatingIndicator } from './Indicators';
import styles from './PlaceCard.module.css';
import { SaveButton } from './SaveButton';
import { SpotImage } from './SpotImage';
import { cx } from './utils';

export interface PlaceCardProps {
  place: Place;
  variant?: 'featured' | 'compact';
  /** Override the distance. By default it is measured from the reference location, if both have coordinates. */
  distanceKm?: number;
  /** Load the image eagerly, for cards visible on first paint. */
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

/**
 * Place card in two variants. The whole card is clickable through a stretched link
 * on the name, so the save button stays a separate, valid control.
 */
export function PlaceCard({
  place,
  variant = 'featured',
  distanceKm,
  priority,
  headingLevel: Heading = 'h3',
  className,
}: PlaceCardProps) {
  const { reference } = useReferenceLocation();
  const { getCategory } = useCatalog();
  const category = getCategory(getPrimaryCategoryId(place));
  const distance = distanceKm ?? getDistanceFromReference(place, reference);
  const distanceLabel = reference ? copy.distance.fromReference(reference) : undefined;
  const cover = getCoverImage(place);

  const categoryLabel: ReactNode = category ? (
    <>
      <CategoryIcon icon={category.icon} size="xs" />
      {category.name}
    </>
  ) : null;

  const meta = (
    <div className={styles.meta}>
      <RatingIndicator rating={place.averageRating} reviewCount={place.reviewCount} size="sm" />
      <DistanceIndicator distanceKm={distance} label={distanceLabel} size="sm" />
      {place.isSyntheticDemo ? (
        <Badge size="sm" tone="highlight">
          {copy.place.demoListing}
        </Badge>
      ) : null}
    </div>
  );

  if (variant === 'compact') {
    return (
      <article className={cx(styles.card, styles.compact, className)}>
        <SpotImage
          src={cover}
          alt=""
          ratio="compact"
          className={styles.thumb}
          priority={priority}
        />
        <div className={styles.compactBody}>
          <span className={cx('ds-type-overline', styles.category)}>{categoryLabel}</span>
          <Heading className={cx('ds-type-title', styles.name)}>
            <Link to={paths.place(place.slug)} className={styles.link}>
              {place.name}
            </Link>
          </Heading>
          <p className={cx('ds-type-body-small', styles.location)}>
            <Icon icon={MapPin} size="xs" />
            {formatLocation(place)}
          </p>
          {meta}
        </div>
        <SaveButton
          placeId={place.id}
          placeName={place.name}
          variant="outline"
          size="sm"
          className={styles.save}
        />
      </article>
    );
  }

  return (
    <article className={cx(styles.card, styles.featured, className)}>
      <SpotImage src={cover} alt="" fill priority={priority} className={styles.image} />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.top}>
        {category ? (
          <Badge appearance="glass" icon={<CategoryIcon icon={category.icon} size="xs" />}>
            {category.name}
          </Badge>
        ) : (
          <span />
        )}
        <SaveButton
          placeId={place.id}
          placeName={place.name}
          variant="glass"
          className={styles.save}
        />
      </div>
      <div className={styles.panel}>
        <Heading className={cx('ds-type-h3', styles.name)}>
          <Link to={paths.place(place.slug)} className={styles.link}>
            {place.name}
          </Link>
        </Heading>
        <p className={cx('ds-type-body-small', styles.location)}>
          <Icon icon={MapPin} size="xs" />
          {formatLocation(place)}
        </p>
        {meta}
      </div>
    </article>
  );
}

/** Responsive grid for featured cards: one column on phones, up to four on wide screens. */
export function PlaceGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx(styles.grid, className)}>{children}</ul>;
}

/** Vertical list for compact cards. */
export function PlaceList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx(styles.list, className)}>{children}</ul>;
}
