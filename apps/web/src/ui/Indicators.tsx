import {
  describeRating,
  formatDistance,
  formatRating,
  formatReviewCount,
} from '@hiddenspot/shared';
import { Navigation, Star } from 'lucide-react';
import { Icon } from './Icon';
import styles from './Indicators.module.css';
import { cx } from './utils';

export interface RatingIndicatorProps {
  /** Null when there are no reviews yet; shows "New". */
  rating: number | null;
  reviewCount?: number;
  size?: 'sm' | 'md';
  /** "badge" puts the rating on a white pill for use over photos. */
  appearance?: 'plain' | 'badge';
  className?: string;
}

/** Amber star, numeric rating and optional review count, with a full sentence for screen readers. */
export function RatingIndicator({
  rating,
  reviewCount,
  size = 'md',
  appearance = 'plain',
  className,
}: RatingIndicatorProps) {
  return (
    <span
      className={cx(styles.indicator, styles[size], styles[appearance], className)}
      role="img"
      aria-label={describeRating(rating, reviewCount)}
    >
      <Icon icon={Star} size={size === 'sm' ? 'xs' : 'sm'} filled className={styles.star} />
      <span className={styles.value}>{formatRating(rating)}</span>
      {reviewCount !== undefined ? (
        <span className={styles.meta}>({formatReviewCount(reviewCount)})</span>
      ) : null}
    </span>
  );
}

export interface DistanceIndicatorProps {
  /** Renders nothing when undefined, so cards hide distance until a reference location exists. */
  distanceKm: number | undefined;
  /** e.g. "from Kochi". */
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function DistanceIndicator({
  distanceKm,
  label,
  size = 'md',
  className,
}: DistanceIndicatorProps) {
  if (distanceKm === undefined) return null;
  return (
    <span className={cx(styles.indicator, styles[size], className)}>
      <Icon icon={Navigation} size={size === 'sm' ? 'xs' : 'sm'} className={styles.distanceIcon} />
      <span className={styles.value}>{formatDistance(distanceKm)}</span>
      {label ? <span className={styles.meta}>{label}</span> : null}
    </span>
  );
}
