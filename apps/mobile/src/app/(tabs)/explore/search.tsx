import { copy, DISTANCE_RADIUS_OPTIONS, semanticColors, spacing } from '@hiddenspot/shared';
import { useCatalog, useDebouncedValue, usePlaces } from '@hiddenspot/shared/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SORT_CHOICES, sortLabel, useDiscovery } from '@/lib/discovery';
import { useLocationContext } from '@/lib/location';
import {
  BottomSheet,
  Button,
  CategoryIcon,
  ChipGroup,
  EmptyState,
  ErrorState,
  FilterChip,
  IconButton,
  LocationSelector,
  PlaceCard,
  PlaceCardSkeleton,
  RemovableChip,
  SearchField,
  Text,
  useBottomNavClearance,
  useGutter,
} from '@/ui';

export default function SearchScreen() {
  const gutter = useGutter();
  const clearance = useBottomNavClearance();
  const { categories, getCategory } = useCatalog();
  const { reference } = useLocationContext();
  const discovery = useDiscovery();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Typing stays responsive; filtering waits for a short pause (same delay as web).
  const deferredQuery = useDebouncedValue(discovery.query);
  const results = usePlaces({
    ...discovery.placeQuery,
    query: deferredQuery.trim() || undefined,
    reference,
  });
  const count = results.data?.length ?? 0;

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...discovery.categoryIds.map((id) => ({
      key: `cat-${id}`,
      label: getCategory(id)?.name ?? id,
      onRemove: () => discovery.toggleCategory(id),
    })),
    ...(discovery.maxDistanceKm !== undefined
      ? [
          {
            key: 'radius',
            label: `Within ${discovery.maxDistanceKm} km`,
            onRemove: () => discovery.setMaxDistanceKm(undefined),
          },
        ]
      : []),
    ...(discovery.sortBy && discovery.sortBy !== 'recommended'
      ? [
          {
            key: 'sort',
            label: `Sort: ${sortLabel(discovery.sortBy)}`,
            onRemove: () => discovery.setSortBy('recommended'),
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.top, { paddingHorizontal: gutter }]}>
        <View style={styles.searchRow}>
          <IconButton
            icon="chevron-left"
            label="Back to Explore"
            variant="outline"
            onPress={() => router.back()}
          />
          <SearchField
            value={discovery.query}
            onChangeText={discovery.setQuery}
            placeholder="Place name or district"
            autoFocus={!discovery.query && discovery.categoryIds.length === 0}
            style={styles.flex}
          />
        </View>
        <LocationSelector />
      </View>

      {chips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, { paddingHorizontal: gutter }]}
          style={styles.chipsScroll}
        >
          {chips.map((chip) => (
            <RemovableChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.resultsBar, { paddingHorizontal: gutter }]}>
        <Text variant="label" tone="secondary" accessibilityLiveRegion="polite">
          {results.isLoading && !results.data
            ? 'Searching…'
            : `${count} ${count === 1 ? 'place' : 'places'}`}
        </Text>
        <View style={styles.barActions}>
          {discovery.activeCount > 0 || discovery.query ? (
            <Button variant="ghost" size="sm" onPress={discovery.clearAll}>
              Clear all
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            leadingIcon="sliders"
            onPress={() => setSheetOpen(true)}
          >
            Filters
          </Button>
        </View>
      </View>

      {results.error ? (
        <ErrorState onRetry={results.reload} />
      ) : results.isLoading && !results.data ? (
        <View style={[styles.list, { paddingHorizontal: gutter }]}>
          {[0, 1, 2].map((i) => (
            <PlaceCardSkeleton key={i} variant="compact" />
          ))}
        </View>
      ) : (
        <FlatList
          data={results.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlaceCard place={item} variant="compact" />}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: gutter, paddingBottom: clearance },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          ListHeaderComponent={
            discovery.maxDistanceKm !== undefined ? (
              <Text variant="helper" tone="tertiary">
                Places without a verified location are hidden while a distance limit is set.
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title={copy.empty.noResults.title}
              message={copy.empty.noResults.message}
              action={<Button onPress={discovery.clearAll}>Reset search and filters</Button>}
            />
          }
        />
      )}

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <>
            <Button variant="secondary" onPress={discovery.clearAll}>
              Clear all
            </Button>
            <Button
              onPress={() => setSheetOpen(false)}
            >{`Show ${count} ${count === 1 ? 'place' : 'places'}`}</Button>
          </>
        }
      >
        <View style={styles.group}>
          <Text variant="label">Sort by</Text>
          <ChipGroup layout="wrap">
            {SORT_CHOICES.map((choice) => (
              <FilterChip
                key={choice.value}
                label={choice.label}
                selected={discovery.effectiveSort === choice.value}
                onPress={() => discovery.setSortBy(choice.value)}
              />
            ))}
          </ChipGroup>
        </View>
        <View style={styles.group}>
          <Text variant="label">Distance</Text>
          <ChipGroup layout="wrap">
            <FilterChip
              label="Any distance"
              selected={discovery.maxDistanceKm === undefined}
              onPress={() => discovery.setMaxDistanceKm(undefined)}
            />
            {DISTANCE_RADIUS_OPTIONS.map((km) => (
              <FilterChip
                key={km}
                label={`${km} km`}
                selected={discovery.maxDistanceKm === km}
                onPress={() => discovery.setMaxDistanceKm(km)}
              />
            ))}
          </ChipGroup>
          <Text variant="helper" tone="secondary">
            Measured in a straight line from{' '}
            {reference
              ? reference.kind === 'device'
                ? 'your location'
                : `${reference.label} (demo location)`
              : 'your chosen location'}
            .
          </Text>
        </View>
        <View style={styles.group}>
          <Text variant="label">Categories</Text>
          <ChipGroup layout="wrap">
            {categories.map((category) => (
              <FilterChip
                key={category.id}
                label={category.name}
                selected={discovery.categoryIds.includes(category.id)}
                onPress={() => discovery.toggleCategory(category.id)}
                renderIcon={(color) => (
                  <CategoryIcon icon={category.icon} size="sm" color={color} />
                )}
              />
            ))}
          </ChipGroup>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: semanticColors.background },
  flex: { flex: 1 },
  top: { gap: spacing.md, paddingTop: spacing.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chipsScroll: { flexGrow: 0, marginTop: spacing.md },
  chips: { gap: spacing.sm },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  barActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  list: { gap: spacing.md },
  group: { gap: spacing.sm },
});
