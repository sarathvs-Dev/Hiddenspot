import {
  describeRating,
  formatDistance,
  formatRating,
  formatReviewCount,
  radii,
  semanticColors,
  shadows,
  spacing,
} from '@hiddenspot/shared';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';

export interface RatingIndicatorProps {
  /** Null when there are no reviews yet; shows "New". */
  rating: number | null;
  reviewCount?: number;
  size?: 'sm' | 'md';
  appearance?: 'plain' | 'badge';
  style?: StyleProp<ViewStyle>;
}

/** Amber star, numeric rating and optional review count, read as one sentence by screen readers. */
export function RatingIndicator({
  rating,
  reviewCount,
  size = 'md',
  appearance = 'plain',
  style,
}: RatingIndicatorProps) {
  const variant = size === 'sm' ? 'caption' : 'label';
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={describeRating(rating, reviewCount)}
      style={[styles.row, appearance === 'badge' && styles.badge, style]}
    >
      <Icon name="star-filled" size={size === 'sm' ? 'xs' : 'sm'} color={semanticColors.rating} />
      <Text variant={variant} style={styles.value}>
        {formatRating(rating)}
      </Text>
      {reviewCount !== undefined ? (
        <Text variant={variant} tone="secondary">
          ({formatReviewCount(reviewCount)})
        </Text>
      ) : null}
    </View>
  );
}

export interface DistanceIndicatorProps {
  /** Renders nothing when undefined, so distance only appears with a reference location. */
  distanceKm: number | undefined;
  label?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function DistanceIndicator({
  distanceKm,
  label,
  size = 'md',
  style,
}: DistanceIndicatorProps) {
  if (distanceKm === undefined) return null;
  const variant = size === 'sm' ? 'caption' : 'label';
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${formatDistance(distanceKm)}${label ? ` ${label}` : ''}`}
      style={[styles.row, style]}
    >
      <Icon
        name="navigation"
        size={size === 'sm' ? 'xs' : 'sm'}
        color={semanticColors.textSecondary}
      />
      <Text variant={variant} style={styles.value}>
        {formatDistance(distanceKm)}
      </Text>
      {label ? (
        <Text variant={variant} tone="secondary">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: semanticColors.surface,
    boxShadow: shadows.sm,
  },
  value: { color: semanticColors.textPrimary },
});
