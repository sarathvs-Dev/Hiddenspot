import {
  copy,
  describeReference,
  getGreeting,
  radii,
  semanticColors,
  shadows,
  spacing,
  type CategoryId,
  type Place,
  type PlaceSortOption,
} from '@hiddenspot/shared';
import { useCatalog, usePlaces } from '@hiddenspot/shared/react';
import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useDiscovery } from '@/lib/discovery';
import { useLocationContext } from '@/lib/location';
import {
  Button,
  CategoryIcon,
  EditorialCard,
  EmptyState,
  ErrorState,
  Icon,
  LocationSelector,
  PlaceCard,
  PlaceCardSkeleton,
  Screen,
  SectionHeading,
  Skeleton,
  Text,
  useGutter,
} from '@/ui';

const NEARBY_RADIUS_KM = 50;

function BrandMark() {
  return (
    <View style={styles.brandMark} accessible={false}>
      <Icon name="map-pin" size="sm" color={semanticColors.onPrimary} />
    </View>
  );
}

const HorizontalCards = memo(function HorizontalCards({
  places,
  width,
  inset,
  variant,
}: {
  places: Place[];
  width: number;
  inset: number;
  variant: 'editorial' | 'card';
}) {
  return (
    <FlatList
      horizontal
      data={places}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) =>
        variant === 'editorial' ? (
          <EditorialCard place={item} width={width} size="large" priority={index < 2} />
        ) : (
          <PlaceCard place={item} width={width} />
        )
      }
      showsHorizontalScrollIndicator={false}
      snapToInterval={width + spacing.lg}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: inset, gap: spacing.lg }}
      initialNumToRender={3}
      windowSize={5}
    />
  );
});

function RowSkeleton({ width, inset }: { width: number; inset: number }) {
  return (
    <View style={[styles.row, { paddingHorizontal: inset }]}>
      <PlaceCardSkeleton width={width} />
      <PlaceCardSkeleton width={width} />
    </View>
  );
}

export default function ExploreHomeScreen() {
  const gutter = useGutter();
  const { width } = useWindowDimensions();
  const { categories } = useCatalog();
  const { reference } = useLocationContext();
  const discovery = useDiscovery();

  const featuredWidth = Math.min(320, Math.round(width - gutter * 2 - 40));
  const cardWidth = Math.min(240, Math.round((width - gutter) / 1.6));

  const featured = usePlaces({ withPhotosOnly: true, sortBy: 'recommended', limit: 6 });
  const nearby = usePlaces({
    reference,
    maxDistanceKm: NEARBY_RADIUS_KM,
    sortBy: 'distance',
    limit: 8,
  });
  const popular = usePlaces({ sortBy: 'popularity', withPhotosOnly: true, limit: 8 });
  const recent = usePlaces({ sortBy: 'newest', limit: 4 });

  const openSearch = useCallback(
    (options: { sort?: PlaceSortOption; category?: CategoryId; radius?: number } = {}) => {
      if (options.sort) discovery.setSortBy(options.sort);
      if (options.category) discovery.setCategories([options.category]);
      if (options.radius !== undefined) discovery.setMaxDistanceKm(options.radius);
      router.push('/explore/search');
    },
    [discovery],
  );

  return (
    <Screen withBottomNav contentStyle={styles.content}>
      <View style={[styles.header, { paddingHorizontal: gutter }]}>
        <View style={styles.brandRow}>
          <BrandMark />
          <Text variant="title" tone="brand">
            {copy.brand.name}
          </Text>
        </View>
        <Text variant="bodySmall" tone="secondary">
          {getGreeting()}
        </Text>
        <Text variant="h1">Find a quiet corner of Kerala</Text>
      </View>

      <View style={[styles.searchBlock, { paddingHorizontal: gutter }]}>
        <Pressable
          onPress={() => openSearch()}
          accessibilityRole="search"
          accessibilityLabel="Search places by name or district"
          style={({ pressed }) => [styles.searchShortcut, pressed && styles.pressed]}
        >
          <Icon name="search" color={semanticColors.textSecondary} />
          <Text variant="body" tone="tertiary" numberOfLines={1} style={styles.flex}>
            Search places or districts
          </Text>
          <View style={styles.searchGo}>
            <Icon name="sliders" size="sm" color={semanticColors.onPrimary} />
          </View>
        </Pressable>
        <LocationSelector />
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: gutter, gap: spacing.md }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openSearch({ category: item.id })}
            accessibilityRole="button"
            accessibilityLabel={`Browse ${item.name}`}
            style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
          >
            <View style={styles.shortcutIcon}>
              <CategoryIcon icon={item.icon} size="lg" color={semanticColors.primary} />
            </View>
            <Text variant="caption" align="center" numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.row}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width={72} height={88} />
            ))}
          </View>
        }
      />

      <View style={styles.section}>
        <SectionHeading
          title="Featured hidden spots"
          description="Well rated and worth the detour."
          style={{ paddingHorizontal: gutter }}
        />
        {featured.error ? (
          <ErrorState
            size="inline"
            onRetry={featured.reload}
            style={{ marginHorizontal: gutter }}
          />
        ) : featured.data ? (
          <HorizontalCards
            places={featured.data}
            width={featuredWidth}
            inset={gutter}
            variant="editorial"
          />
        ) : (
          <RowSkeleton width={featuredWidth} inset={gutter} />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeading
          title="Nearby discoveries"
          description={
            reference
              ? `Within ${NEARBY_RADIUS_KM} km of ${describeReference(reference)}.`
              : 'Choose a location to see nearby places.'
          }
          style={{ paddingHorizontal: gutter }}
          action={
            <Button
              variant="ghost"
              size="sm"
              onPress={() => openSearch({ sort: 'distance', radius: NEARBY_RADIUS_KM })}
            >
              See all
            </Button>
          }
        />
        {nearby.error ? (
          <ErrorState size="inline" onRetry={nearby.reload} style={{ marginHorizontal: gutter }} />
        ) : !nearby.data ? (
          <RowSkeleton width={cardWidth} inset={gutter} />
        ) : nearby.data.length > 0 ? (
          <HorizontalCards places={nearby.data} width={cardWidth} inset={gutter} variant="card" />
        ) : (
          <EmptyState
            size="inline"
            icon="map-pin"
            title="Nothing verified nearby"
            message="No places with a confirmed location are within 50 km. Try another location."
            style={{ marginHorizontal: gutter }}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeading
          title="Popular now"
          description="Most saved and visited in this demo."
          style={{ paddingHorizontal: gutter }}
          action={
            <Button variant="ghost" size="sm" onPress={() => openSearch({ sort: 'popularity' })}>
              See all
            </Button>
          }
        />
        {popular.data ? (
          <HorizontalCards places={popular.data} width={cardWidth} inset={gutter} variant="card" />
        ) : (
          <RowSkeleton width={cardWidth} inset={gutter} />
        )}
      </View>

      <View style={[styles.section, { paddingHorizontal: gutter }]}>
        <SectionHeading
          title="Recently added"
          action={
            <Button variant="ghost" size="sm" onPress={() => openSearch({ sort: 'newest' })}>
              See all
            </Button>
          }
        />
        {recent.data
          ? recent.data.map((place) => <PlaceCard key={place.id} place={place} variant="compact" />)
          : [0, 1].map((i) => <PlaceCardSkeleton key={i} variant="compact" />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingTop: spacing.lg },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  header: { gap: spacing.xs },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColors.primary,
  },
  searchBlock: { gap: spacing.md },
  searchShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 56,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
    boxShadow: shadows.sm,
  },
  searchGo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColors.primary,
  },
  shortcut: { width: 76, alignItems: 'center', gap: spacing.xs },
  shortcutIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColors.primarySubtle,
  },
  section: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.lg },
});
