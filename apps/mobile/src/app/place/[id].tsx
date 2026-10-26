import {
  copy,
  formatEntryFee,
  formatLocation,
  formatOpeningHours,
  getCoverImage,
  getDirectionsUrl,
  describeLocation,
  formatDistance,
  formatDistanceFrom,
  getDistanceFromReference,
  getPrimaryCategoryId,
  radii,
  semanticColors,
  shadows,
  spacing,
} from '@hiddenspot/shared';
import {
  useCatalog,
  usePlace,
  useReferenceLocation,
  useRelatedPlaces,
  useReviewsForPlace,
} from '@hiddenspot/shared/react';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  CategoryIcon,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  ImageGallery,
  PlaceCard,
  RatingIndicator,
  ReviewCard,
  SaveButton,
  SectionHeading,
  Skeleton,
  SpotImage,
  Text,
  useGutter,
  type IconName,
} from '@/ui';
import { ReviewSheet } from '@/components/ReviewSheet';

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/explore');
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size="sm" color={semanticColors.textSecondary} />
      <View style={styles.flex}>
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
        <Text variant="bodySmall">{value}</Text>
      </View>
    </View>
  );
}

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: place, error, isLoading, reload } = usePlace(id);
  const reviews = useReviewsForPlace(place?.id);
  const related = useRelatedPlaces(place?.id, 6);
  const { getCategory } = useCatalog();
  const { reference } = useReferenceLocation();
  const [reviewOpen, setReviewOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const gutter = useGutter();

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <ErrorState onRetry={reload} />
      </SafeAreaView>
    );
  }

  if (isLoading && !place) {
    return (
      <View style={styles.root}>
        <Skeleton ratio="featured" style={styles.heroSkeleton} />
        <View style={[styles.body, { paddingHorizontal: gutter }]}>
          <Skeleton shape="text" width="60%" height={24} />
          <Skeleton shape="text" width="80%" />
        </View>
      </View>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.center}>
        <EmptyState
          icon="map-pin"
          title={copy.empty.notFound.title}
          message={copy.empty.notFound.message}
          action={<Button onPress={goBack}>Go back</Button>}
        />
      </SafeAreaView>
    );
  }

  const primary = getCategory(getPrimaryCategoryId(place));
  // Directions go to exact coordinates only for site-level locations.
  const isSiteLocation = place.locationPrecision === 'site';
  const distance = reference ? getDistanceFromReference(place, reference) : undefined;
  // The action bar leads with the most useful known fact, never with "Not confirmed".
  const footerFact =
    distance !== undefined && reference
      ? {
          label: reference.kind === 'device' ? 'From you' : `From ${reference.label} (demo)`,
          value: formatDistance(distance),
        }
      : place.entryFee
        ? { label: 'Entry fee', value: formatEntryFee(place.entryFee) }
        : { label: 'District', value: place.district };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <SpotImage
            uri={getCoverImage(place)}
            alt={`${place.name}, ${formatLocation(place)}`}
            fill
            priority
          />
          <View style={styles.heroScrim} />
          <View
            style={[
              styles.heroTop,
              { paddingTop: insets.top + spacing.sm, paddingHorizontal: gutter },
            ]}
          >
            <IconButton icon="chevron-left" label="Go back" variant="glass" onPress={goBack} />
            <SaveButton placeId={place.id} placeName={place.name} variant="glass" />
          </View>
          <View style={[styles.heroBottom, { paddingHorizontal: gutter }]}>
            {primary ? (
              <Badge
                appearance="glass"
                renderIcon={(color) => <CategoryIcon icon={primary.icon} size="xs" color={color} />}
              >
                {primary.name}
              </Badge>
            ) : null}
            <Text variant="h1" tone="onImage">
              {place.name}
            </Text>
            <View style={styles.row}>
              <Icon name="map-pin" size="sm" color={semanticColors.textOnImage} />
              <Text variant="body" tone="onImage">
                {formatLocation(place)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.body, { paddingHorizontal: gutter }]}>
          <Text variant="h3" tone="secondary">
            {place.shortDescription}
          </Text>

          {place.isSyntheticDemo ? (
            <View style={styles.notice}>
              <Icon name="info" size="sm" color={semanticColors.onHighlight} />
              <Text variant="bodySmall" tone="highlight" style={styles.flex}>
                {copy.place.demoListingNote}
              </Text>
            </View>
          ) : null}

          <View style={styles.facts}>
            <RatingIndicator rating={place.averageRating} reviewCount={place.reviewCount} />
            <Fact
              icon="calendar"
              label="Best time to visit"
              value={place.bestTimeToVisit ?? copy.place.notConfirmed}
            />
            <Fact
              icon="clock"
              label="Opening hours"
              value={formatOpeningHours(place.openingHours)}
            />
            <Fact icon="tag" label="Entry fee" value={formatEntryFee(place.entryFee)} />
            {distance !== undefined && reference ? (
              <Fact
                icon="navigation"
                label="Distance (straight line)"
                value={`${formatDistanceFrom(distance, reference)}${place.locationPrecision === 'area' ? ', to the area centre' : ''}`}
              />
            ) : null}
            <Fact icon="map-pin" label="Location" value={describeLocation(place)} />
          </View>

          <View style={styles.section}>
            <SectionHeading size="subsection" title="About this place" />
            <Text variant="body" tone="secondary">
              {place.description ?? copy.place.noDescription}
            </Text>
            <View style={styles.tags}>
              {place.categoryIds.map((categoryId) => {
                const category = getCategory(categoryId);
                return category ? (
                  <Badge
                    key={categoryId}
                    tone="brand"
                    size="sm"
                    renderIcon={(color) => (
                      <CategoryIcon icon={category.icon} size="xs" color={color} />
                    )}
                  >
                    {category.name}
                  </Badge>
                ) : null;
              })}
              {place.tags.map((tag) => (
                <Badge key={tag} appearance="outline" size="sm">
                  {`#${tag}`}
                </Badge>
              ))}
            </View>
          </View>

          {place.safetyNotes.length ? (
            <View style={styles.section}>
              <SectionHeading size="subsection" title="Before you go" />
              {place.safetyNotes.map((note) => (
                <View key={note} style={styles.noteRow}>
                  <Icon name="alert-circle" size="sm" color={semanticColors.textSecondary} />
                  <Text variant="body" tone="secondary" style={styles.flex}>
                    {note}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {place.imageUrls.length > 1 ? (
          <View style={[styles.section, styles.sectionSpaced]}>
            <SectionHeading
              size="subsection"
              title="Gallery"
              description="Placeholder photos for the demo."
              style={{ paddingHorizontal: gutter }}
            />
            <ImageGallery
              inset={gutter}
              images={place.imageUrls.map((uri, i) => ({
                uri,
                alt: `${place.name}, photo ${i + 1}`,
              }))}
            />
          </View>
        ) : null}

        <View style={[styles.section, styles.sectionSpaced, { paddingHorizontal: gutter }]}>
          <SectionHeading
            size="subsection"
            title="Reviews"
            description={copy.review.sampleNote}
            action={
              <Button
                variant="secondary"
                size="sm"
                leadingIcon="edit-3"
                onPress={() => setReviewOpen(true)}
              >
                Write a review
              </Button>
            }
          />
          {reviews.isLoading && !reviews.data ? (
            <Skeleton height={140} />
          ) : reviews.data && reviews.data.length > 0 ? (
            reviews.data.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <EmptyState
              size="inline"
              icon="message-circle"
              title={copy.empty.noReviews.title}
              message={copy.empty.noReviews.message}
              action={<Button onPress={() => setReviewOpen(true)}>Write the first review</Button>}
            />
          )}
        </View>

        {related.data && related.data.length > 0 ? (
          <View style={[styles.section, styles.sectionSpaced]}>
            <SectionHeading
              size="subsection"
              title="You might also like"
              description="Similar places nearby or in the same category."
              style={{ paddingHorizontal: gutter }}
            />
            <FlatList
              horizontal
              data={related.data}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => <PlaceCard place={item} width={220} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: gutter, gap: spacing.lg }}
            />
          </View>
        ) : null}
      </ScrollView>

      <ReviewSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        placeId={place.id}
        placeName={place.name}
      />

      <View
        style={[
          styles.actionBar,
          { paddingBottom: insets.bottom + spacing.md, paddingHorizontal: gutter },
        ]}
      >
        <View style={styles.flex}>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {footerFact.label}
          </Text>
          <Text variant="title" numberOfLines={1}>
            {footerFact.value}
          </Text>
        </View>
        <Button
          size="lg"
          leadingIcon="navigation"
          onPress={() => void Linking.openURL(getDirectionsUrl(place))}
          accessibilityHint="Opens your maps app"
        >
          {isSiteLocation ? copy.actions.directions : 'Find on map'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semanticColors.background },
  center: { flex: 1, justifyContent: 'center', backgroundColor: semanticColors.background },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  heroSkeleton: {
    borderRadius: 0,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
  hero: {
    height: 440,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    backgroundColor: semanticColors.skeleton,
  },
  heroScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 36, 27, 0.32)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  heroBottom: { gap: spacing.sm, paddingBottom: spacing.xl },
  body: { gap: spacing.xl, paddingTop: spacing.xl },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: semanticColors.highlight,
  },
  facts: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: semanticColors.surfaceSecondary,
  },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  section: { gap: spacing.md },
  sectionSpaced: { marginTop: spacing.xl },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: semanticColors.surface,
    borderTopWidth: 1,
    borderTopColor: semanticColors.border,
    boxShadow: shadows.lg,
  },
});
