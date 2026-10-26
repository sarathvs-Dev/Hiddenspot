import { copy, formatShortDate, formatMonthYear, type ReviewWithAuthor } from '@hiddenspot/shared';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { RatingIndicator } from './Indicators';
import styles from './ReviewCard.module.css';
import { cx } from './utils';

export function ReviewCard({
  review,
  className,
}: {
  review: ReviewWithAuthor;
  className?: string;
}) {
  const name = review.author?.displayName ?? 'Former demo user';
  return (
    <article className={cx(styles.card, className)}>
      <header className={styles.header}>
        <Avatar
          person={{ id: review.userId, name, avatarUrl: review.author?.avatarUrl }}
          size="md"
        />
        <div className={styles.author}>
          <p className="ds-type-label">{name}</p>
          <p className={cx('ds-type-caption', styles.muted)}>
            {review.author?.homeDistrict ? `${review.author.homeDistrict} · ` : ''}
            {formatShortDate(review.createdAt)}
          </p>
        </div>
        <RatingIndicator rating={review.rating} appearance="plain" />
      </header>
      {review.title ? <h3 className="ds-type-title">{review.title}</h3> : null}
      <p className={cx('ds-type-body', styles.body)}>{review.body}</p>
      <footer className={cx('ds-type-caption', styles.footer)}>
        <span>
          {review.visitedOn
            ? `Visited ${formatMonthYear(review.visitedOn)}`
            : 'Visit date not given'}
        </span>
        <Badge size="sm" tone={review.source === 'demo' ? 'brand' : 'neutral'}>
          {review.source === 'demo' ? 'Added on this device' : copy.review.sampleLabel}
        </Badge>
      </footer>
    </article>
  );
}
