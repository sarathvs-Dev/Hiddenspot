import {
  copy,
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
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Badge } from './Badge';
import { FadeIn } from './FadeIn';
import { CategoryIcon } from './CategoryIcon';
import { Icon } from './Icon';
import { DistanceIndicator, RatingIndicator } from './Indicators';
import { SaveButton } from './SaveButton';
import { SpotImage } from './SpotImage';
import { Text } from './Text';

export interface PlaceCardProps {
  place: Place;
  variant?: 'featured' | 'compact';
  /** Override the distance. By default it is measured from the reference location, if both have coordinates. */
  distanceKm?: number;
  /** Fixed width for carousels. Featured cards otherwise fill their container. */
  width?: number;
  priority?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Place card in two variants, matching the web PlaceCard. The save button is a sibling
 * of the pressable card, so each is a separate control for screen readers.
 */
export function PlaceCard({
  place,
  variant = 'featured',
  distanceKm,
  width,
  priority,
  style,
}: PlaceCardProps) {
  // Plain Pressable + router: Link asChild drops function styles on web, breaking sizing.
  const open = () => router.push({ pathname: '/place/[id]', params: { id: place.id } });
  const { reference } = useReferenceLocation();
  const { getCategory } = useCatalog();
  const category = getCategory(getPrimaryCategoryId(place));
  const distance = distanceKm ?? getDistanceFromReference(place, reference);
  const distanceLabel = reference ? copy.distance.fromReference(reference) : undefined;
  const a11yLabel = [
    place.name,
    category?.name,
    formatLocation(place),
    place.isSyntheticDemo ? copy.place.demoListing : null,
  ]
    .filter(Boolean)
    .join(', ');
  const cover = getCoverImage(place);

  const meta = (
    <View style={styles.meta}>
      <RatingIndicator rating={place.averageRating} reviewCount={place.reviewCount} size="sm" />
      <DistanceIndicator distanceKm={distance} label={distanceLabel} size="sm" />
      {place.isSyntheticDemo ? (
        <Badge size="sm" tone="highlight">
          {copy.place.demoListing}
        </Badge>
      ) : null}
    </View>
  );

  if (variant === 'compact') {
    return (
      <FadeIn style={[styles.compact, style]}>
        <Pressable
          onPress={open}
          accessibilityRole="link"
          accessibilityLabel={a11yLabel}
          style={({ pressed }) => [styles.compactPress, pressed && styles.pressed]}
        >
          <SpotImage uri={cover} alt="" ratio="compact" style={styles.thumb} priority={priority} />
          <View style={styles.compactBody}>
            {category ? (
              <View style={styles.categoryRow}>
                <CategoryIcon icon={category.icon} size="xs" color={semanticColors.textSecondary} />
                <Text variant="overline" tone="secondary" numberOfLines={1}>
                  {category.name}
                </Text>
              </View>
            ) : null}
            <Text variant="title" numberOfLines={1}>
              {place.name}
            </Text>
            <Text variant="bodySmall" tone="secondary" numberOfLines={1}>
              {formatLocation(place)}
            </Text>
            {meta}
          </View>
        </Pressable>
        <SaveButton placeId={place.id} placeName={place.name} variant="outline" size="sm" />
      </FadeIn>
    );
  }

  return (
    <FadeIn style={[styles.featured, width !== undefined && { width }, style]}>
      <Pressable
        onPress={open}
        accessibilityRole="link"
        accessibilityLabel={a11yLabel}
        style={({ pressed }) => [styles.featuredPress, pressed && styles.pressed]}
      >
        <SpotImage uri={cover} alt="" fill priority={priority} />
        <View style={styles.topScrim} />
        <View style={styles.top}>
          {category ? (
            <Badge
              appearance="glass"
              renderIcon={(color) => <CategoryIcon icon={category.icon} size="xs" color={color} />}
            >
              {category.name}
            </Badge>
          ) : null}
        </View>
        <View style={styles.panel}>
          <Text variant="h3" numberOfLines={1}>
            {place.name}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="map-pin" size="xs" color={semanticColors.textSecondary} />
            <Text variant="bodySmall" tone="secondary" numberOfLines={1} style={styles.flex}>
              {formatLocation(place)}
            </Text>
          </View>
          {meta}
        </View>
      </Pressable>
      <SaveButton
        placeId={place.id}
        placeName={place.name}
        variant="glass"
        style={styles.featuredSave}
      />
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.92 },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.md,
    rowGap: spacing.xs,
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  featured: {
    aspectRatio: 4 / 5,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: semanticColors.skeleton,
    boxShadow: shadows.sm,
  },
  // Explicit size: on web the link wrapper does not stretch with flex alone.
  featuredPress: { width: '100%', height: '100%', justifyContent: 'space-between' },
  topScrim: {
    ...StyleSheet.absoluteFill,
    bottom: '70%',
    backgroundColor: 'rgba(15, 36, 27, 0.18)',
  },
  top: { padding: spacing.md, paddingRight: 64 },
  featuredSave: { position: 'absolute', top: spacing.md, right: spacing.md },
  panel: {
    margin: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
  },

  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
  },
  compactPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
  },
  thumb: { width: 88, borderRadius: radii.md },
  compactBody: { flex: 1, gap: 2 },
});
