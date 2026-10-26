import {
  formatDistanceFrom,
  getCoverImage,
  getDistanceFromReference,
  radii,
  semanticColors,
  spacing,
  type Place,
  isValidCoordinates,
} from '@hiddenspot/shared';
import { usePlaces } from '@hiddenspot/shared/react';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiscovery } from '@/lib/discovery';
import { useLocationContext } from '@/lib/location';
import {
  Button,
  CategoryChips,
  ErrorState,
  Icon,
  IconButton,
  MapPanel,
  PlaceCardSkeleton,
  RatingIndicator,
  SpotImage,
  Text,
  useBottomNavClearance,
  useGutter,
} from '@/ui';

const MapListItem = memo(function MapListItem({
  place,
  selected,
  distanceLabel,
  onSelect,
}: {
  place: Place;
  selected: boolean;
  distanceLabel: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onSelect(place.id)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${place.name}. ${distanceLabel ?? place.district}. Show on map`}
      style={({ pressed }) => [
        styles.item,
        selected && styles.itemSelected,
        pressed && styles.pressed,
      ]}
    >
      <SpotImage uri={getCoverImage(place)} alt="" ratio="compact" style={styles.thumb} />
      <View style={styles.flex}>
        <Text variant="title" numberOfLines={1}>
          {place.name}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {distanceLabel ?? place.district}
          {place.locationPrecision === 'area' ? ' · approximate area' : ''}
        </Text>
        <RatingIndicator rating={place.averageRating} reviewCount={place.reviewCount} size="sm" />
      </View>
      <IconButton
        icon="chevron-right"
        label={`Open ${place.name}`}
        variant="soft"
        size="sm"
        onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })}
      />
    </Pressable>
  );
});

export default function MapScreen() {
  const gutter = useGutter();
  const clearance = useBottomNavClearance();
  const { height } = useWindowDimensions();
  const { reference } = useLocationContext();
  const discovery = useDiscovery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<FlatList<Place>>(null);

  // Same categories and radius as Search, so filters carry over between tabs.
  const results = usePlaces({
    categoryIds: discovery.placeQuery.categoryIds,
    maxDistanceKm: discovery.placeQuery.maxDistanceKm,
    sortBy: 'distance',
    reference,
  });
  const { mapped, unmappedCount } = useMemo(() => {
    const all = results.data ?? [];
    const withCoords = all.filter((p) => isValidCoordinates(p));
    return { mapped: withCoords, unmappedCount: all.length - withCoords.length };
  }, [results.data]);

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      const index = mapped.findIndex((p) => p.id === id);
      if (index >= 0) listRef.current?.scrollToIndex({ index, viewPosition: 0.1, animated: true });
    },
    [mapped],
  );

  const mapHeight = Math.round(Math.min(Math.max(height * 0.42, 240), 420));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: gutter }]}>
        <Text variant="h1">Map</Text>
        <Text variant="bodySmall" tone="secondary">
          {reference
            ? reference.kind === 'device'
              ? 'Sorted by distance from you.'
              : `Sorted by distance from ${reference.label} (demo location).`
            : 'Places with a verified location.'}
        </Text>
      </View>
      <View style={styles.chips}>
        <CategoryChips
          inset={gutter}
          selected={discovery.categoryIds}
          onToggle={discovery.toggleCategory}
          onClear={() => discovery.setCategories([])}
        />
      </View>

      <View style={{ paddingHorizontal: gutter }}>
        <MapPanel
          places={mapped}
          selectedId={selectedId}
          onSelect={select}
          reference={reference}
          height={mapHeight}
        />
      </View>

      {results.error ? (
        <ErrorState onRetry={results.reload} />
      ) : !results.data ? (
        <View style={[styles.list, { paddingHorizontal: gutter, paddingTop: spacing.md }]}>
          <PlaceCardSkeleton variant="compact" />
          <PlaceCardSkeleton variant="compact" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={mapped}
          keyExtractor={(p) => p.id}
          extraData={selectedId}
          renderItem={({ item }) => {
            const distance = reference ? getDistanceFromReference(item, reference) : undefined;
            return (
              <MapListItem
                place={item}
                selected={item.id === selectedId}
                distanceLabel={
                  distance !== undefined && reference
                    ? formatDistanceFrom(distance, reference)
                    : null
                }
                onSelect={select}
              />
            );
          }}
          onScrollToIndexFailed={({ index }) =>
            listRef.current?.scrollToOffset({ offset: index * 100, animated: true })
          }
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: gutter, paddingBottom: clearance },
          ]}
          ListHeaderComponent={
            <Text variant="label" tone="secondary">
              {mapped.length} {mapped.length === 1 ? 'place' : 'places'} on the map
            </Text>
          }
          ListFooterComponent={
            unmappedCount > 0 ? (
              <View style={styles.footer}>
                <Text variant="bodySmall" tone="secondary">
                  {unmappedCount} matching {unmappedCount === 1 ? 'place has' : 'places have'} no
                  verified location yet, so
                  {unmappedCount === 1 ? ' it is' : ' they are'} not on the map.
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  leadingIcon="list"
                  onPress={() => router.push('/explore/search')}
                >
                  See all in Search
                </Button>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.footer}>
              <Icon name="map-pin" color={semanticColors.textSecondary} />
              <Text variant="body" tone="secondary">
                No places with a verified location match these filters.
              </Text>
              <Button variant="secondary" size="sm" onPress={discovery.clearAll}>
                Clear filters
              </Button>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: semanticColors.background },
  flex: { flex: 1, gap: 2 },
  pressed: { opacity: 0.85 },
  header: { gap: spacing.xs, paddingTop: spacing.md },
  chips: { marginVertical: spacing.md },
  list: { gap: spacing.sm, paddingTop: spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
  },
  itemSelected: { borderColor: semanticColors.primary, borderWidth: 2, padding: spacing.sm - 1 },
  thumb: { width: 64, borderRadius: radii.md },
  footer: { gap: spacing.sm, alignItems: 'flex-start', paddingVertical: spacing.lg },
});
