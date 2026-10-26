import {
  formatDistanceFrom,
  formatLocation,
  getCoverImage,
  getDistanceFromReference,
  getPrimaryCategoryId,
  radii,
  semanticColors,
  shadows,
  spacing,
  type Place,
} from '@hiddenspot/shared';
import { useCatalog, useReferenceLocation } from '@hiddenspot/shared/react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge } from './Badge';
import { FadeIn } from './FadeIn';
import { CategoryIcon } from './CategoryIcon';
import { RatingIndicator } from './Indicators';
import { SaveButton } from './SaveButton';
import { SpotImage } from './SpotImage';
import { Text } from './Text';

export interface EditorialCardProps {
  place: Place;
  width: number;
  /** Taller cards for the featured row, shorter ones elsewhere. */
  size?: 'large' | 'medium';
  priority?: boolean;
}

/**
 * Magazine-style card: full-bleed photo with the name set on a dark scrim.
 * Image ratio is fixed per size so rows line up on every screen.
 */
export function EditorialCard({ place, width, size = 'medium', priority }: EditorialCardProps) {
  // Plain Pressable + router: Link asChild drops function styles on web, breaking sizing.
  const open = () => router.push({ pathname: '/place/[id]', params: { id: place.id } });
  const { getCategory } = useCatalog();
  const { reference } = useReferenceLocation();
  const category = getCategory(getPrimaryCategoryId(place));
  const distance = reference ? getDistanceFromReference(place, reference) : undefined;
  const height = Math.round(width * (size === 'large' ? 1.25 : 1.05));

  return (
    <FadeIn style={[styles.card, { width, height }]}>
      <Pressable
        onPress={open}
        accessibilityRole="link"
        accessibilityLabel={[place.name, category?.name, formatLocation(place)]
          .filter(Boolean)
          .join(', ')}
        style={({ pressed }) => [styles.fill, pressed && styles.pressed]}
      >
        <SpotImage uri={getCoverImage(place)} alt="" fill priority={priority} />
        <View style={styles.scrim} />
        <View style={styles.top}>
          {category ? (
            <Badge
              appearance="glass"
              size="sm"
              renderIcon={(c) => <CategoryIcon icon={category.icon} size="xs" color={c} />}
            >
              {category.name}
            </Badge>
          ) : null}
        </View>
        <View style={styles.bottom}>
          <Text variant={size === 'large' ? 'h2' : 'h3'} tone="onImage" numberOfLines={2}>
            {place.name}
          </Text>
          <Text variant="bodySmall" tone="onImage" numberOfLines={1} style={styles.muted}>
            {distance !== undefined && reference
              ? `${formatLocation(place)} · ${formatDistanceFrom(distance, reference)}`
              : formatLocation(place)}
          </Text>
          <RatingIndicator
            rating={place.averageRating}
            reviewCount={place.reviewCount}
            size="sm"
            appearance="badge"
            style={styles.rating}
          />
        </View>
      </Pressable>
      <SaveButton
        placeId={place.id}
        placeName={place.name}
        variant="glass"
        size="sm"
        style={styles.save}
      />
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: semanticColors.skeleton,
    boxShadow: shadows.sm,
  },
  // Explicit size: on web the link wrapper does not stretch with flex alone.
  fill: { width: '100%', height: '100%', justifyContent: 'space-between' },
  pressed: { opacity: 0.92 },
  // A gradient, not a solid block, so there is no hard edge across the photo.
  // React Native 0.88 renders CSS gradients natively; react-native-web passes them to CSS.
  scrim: {
    ...StyleSheet.absoluteFill,
    top: '30%',
    backgroundImage:
      'linear-gradient(to bottom, rgba(15, 36, 27, 0) 0%, rgba(15, 36, 27, 0.45) 45%, rgba(15, 36, 27, 0.78) 100%)',
  },
  top: { padding: spacing.md, paddingRight: 56 },
  bottom: { padding: spacing.lg, gap: spacing.xs },
  muted: { opacity: 0.9 },
  rating: { marginTop: spacing.xs },
  save: { position: 'absolute', top: spacing.md, right: spacing.md },
});
