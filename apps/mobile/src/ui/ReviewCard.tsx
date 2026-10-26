import {
  copy,
  formatMonthYear,
  formatShortDate,
  radii,
  semanticColors,
  spacing,
  type ReviewWithAuthor,
} from '@hiddenspot/shared';
import { StyleSheet, View } from 'react-native';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { RatingIndicator } from './Indicators';
import { Text } from './Text';

export function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  const name = review.author?.displayName ?? 'Former demo user';
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar
          person={{ id: review.userId, name, avatarUrl: review.author?.avatarUrl }}
          size="md"
        />
        <View style={styles.author}>
          <Text variant="label">{name}</Text>
          <Text variant="caption" tone="secondary">
            {review.author?.homeDistrict ? `${review.author.homeDistrict} · ` : ''}
            {formatShortDate(review.createdAt)}
          </Text>
        </View>
        <RatingIndicator rating={review.rating} />
      </View>
      {review.title ? <Text variant="title">{review.title}</Text> : null}
      <Text variant="body" tone="secondary">
        {review.body}
      </Text>
      <View style={styles.footer}>
        <Text variant="caption" tone="tertiary">
          {review.visitedOn
            ? `Visited ${formatMonthYear(review.visitedOn)}`
            : 'Visit date not given'}
        </Text>
        <Badge size="sm" tone={review.source === 'demo' ? 'brand' : 'neutral'}>
          {review.source === 'demo' ? 'Added on this device' : copy.review.sampleLabel}
        </Badge>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  author: { flex: 1 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
