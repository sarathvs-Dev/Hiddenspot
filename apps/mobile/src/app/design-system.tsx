import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  contrastRatio,
  copy,
  email,
  ICON_BUTTON_VARIANTS,
  minLength,
  optional,
  palette,
  radii,
  required,
  semanticColors,
  shadows,
  spacing,
  SUBMISSION_STATUSES,
  TONES,
  typography,
  validateForm,
  type CategoryId,
  type TypeVariant,
} from '@hiddenspot/shared';
import { useCatalog, usePlaces, useReviewsForPlace, useToast } from '@hiddenspot/shared/react';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Avatar,
  Badge,
  BottomSheet,
  Button,
  CategoryIcon,
  ChipGroup,
  Checkbox,
  ConfirmDialog,
  DistanceIndicator,
  EmptyState,
  ErrorState,
  FilterChip,
  IconButton,
  ImageGallery,
  Modal,
  PlaceCard,
  PlaceCardSkeleton,
  RatingIndicator,
  ReviewCard,
  Screen,
  SearchField,
  SectionHeading,
  SelectField,
  Skeleton,
  StatusBadge,
  Text,
  TextArea,
  TextField,
  useGutter,
} from '@/ui';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionHeading title={title} description={description} />
      {children}
    </View>
  );
}

function Panel({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <View style={styles.panel}>
      {label ? (
        <Text variant="overline" tone="secondary">
          {label}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function FormDemo() {
  const { categories } = useCatalog();
  const { showToast } = useToast();
  const [values, setValues] = useState({ name: '', email: '', category: '', note: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [notify, setNotify] = useState(false);

  const submit = () => {
    const next = validateForm(values, {
      name: [required('Name')],
      email: [required('Email'), email],
      category: [required('Category')],
      note: [optional(minLength('Description', 20))],
    });
    setErrors(next);
    showToast(
      Object.keys(next).length > 0
        ? { title: 'Check the highlighted fields', tone: 'warning' }
        : {
            title: 'Thanks for sharing',
            message: 'Your demo submission was received.',
            tone: 'success',
          },
    );
  };

  return (
    <View style={styles.stack}>
      <TextField
        label="Your name"
        required
        value={values.name}
        onChangeText={(name) => setValues((v) => ({ ...v, name }))}
        error={errors.name}
        autoComplete="name"
      />
      <TextField
        label="Email"
        required
        keyboardType="email-address"
        autoCapitalize="none"
        hint="We only use this to tell you when the spot is live."
        value={values.email}
        onChangeText={(value) => setValues((v) => ({ ...v, email: value }))}
        error={errors.email}
      />
      <SelectField<CategoryId>
        label="Category"
        required
        placeholder="Choose a category"
        value={values.category as CategoryId | ''}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(category) => setValues((v) => ({ ...v, category }))}
        error={errors.category}
      />
      <TextArea
        label="What makes it special?"
        optional
        hint="At least 20 characters."
        value={values.note}
        onChangeText={(note) => setValues((v) => ({ ...v, note }))}
        error={errors.note}
      />
      <Checkbox
        label="Notify me about similar spots"
        description="Occasional updates. Turn off any time."
        checked={notify}
        onChange={setNotify}
      />
      <Button onPress={submit}>Submit spot</Button>
    </View>
  );
}

/** Living design-system reference rendered with the production mobile components. */
export default function DesignSystemScreen() {
  const gutter = useGutter();
  const { categories } = useCatalog();
  const { data: places } = usePlaces({ sortBy: 'rating', withPhotosOnly: true });
  const { data: reviews } = useReviewsForPlace('pl-athirappilly-falls');
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>(['waterfalls']);
  const [overlay, setOverlay] = useState<'modal' | 'sheet' | 'confirm' | null>(null);
  const sample = places?.[0];
  const sample2 = places?.[1];

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={[styles.content, { paddingHorizontal: gutter }]}
    >
      <View style={styles.topBar}>
        <IconButton
          icon="chevron-left"
          label="Go back"
          variant="outline"
          onPress={() => router.back()}
        />
      </View>
      <SectionHeading
        size="page"
        eyebrow="HiddenSpot design system"
        title="Calm, premium, nature-first"
        description="Everything here renders with the same components and tokens as the app."
      />

      <Section title="Colours" description="Ratios are measured against the ivory background.">
        <View style={styles.swatches}>
          {(
            [
              'primary',
              'background',
              'surface',
              'surfaceSecondary',
              'textPrimary',
              'textSecondary',
              'highlight',
              'rating',
              'danger',
            ] as const
          ).map((key) => {
            const value = semanticColors[key];
            return (
              <View key={key} style={styles.swatch}>
                <View style={[styles.swatchColor, { backgroundColor: value }]} />
                <Text variant="label">{key}</Text>
                <Text variant="caption" tone="secondary">
                  {value} · {contrastRatio(value, semanticColors.background).toFixed(1)}:1
                </Text>
              </View>
            );
          })}
        </View>
      </Section>

      <Section
        title="Typography"
        description="Fraunces for headings, Inter for everything else. Bundled with the app."
      >
        <Panel>
          {(Object.keys(typography) as TypeVariant[]).map((variant) => (
            <View key={variant} style={styles.typeRow}>
              <Text variant="caption" tone="tertiary">
                {variant} · {typography[variant].size}px
              </Text>
              <Text variant={variant} numberOfLines={2}>
                {variant.startsWith('body')
                  ? 'A quiet hideaway surrounded by forest trails.'
                  : 'Mistwood Retreat'}
              </Text>
            </View>
          ))}
        </Panel>
      </Section>

      <Section title="Spacing and shape">
        <Panel label="Spacing">
          {Object.entries(spacing)
            .filter(([, v]) => v > 0)
            .map(([key, value]) => (
              <View key={key} style={styles.scaleRow}>
                <Text variant="caption" tone="secondary" style={styles.scaleLabel}>
                  {key} · {value}
                </Text>
                <View style={[styles.spaceBar, { width: value }]} />
              </View>
            ))}
        </Panel>
        <Panel label="Radii and shadows">
          <View style={styles.tiles}>
            {(['sm', 'md', 'lg', 'xl'] as const).map((key) => (
              <View key={key} style={[styles.tile, { borderRadius: radii[key] }]}>
                <Text variant="caption">r-{key}</Text>
              </View>
            ))}
            {(['xs', 'sm', 'md', 'lg'] as const).map((key) => (
              <View key={key} style={[styles.tile, { boxShadow: shadows[key], borderWidth: 0 }]}>
                <Text variant="caption">s-{key}</Text>
              </View>
            ))}
          </View>
        </Panel>
      </Section>

      <Section
        title="Buttons"
        description="One primary action per screen. Small sizes keep a 44pt touch area."
      >
        <Panel label="Variants">
          <View style={styles.wrap}>
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant[0]?.toUpperCase() + variant.slice(1)}
              </Button>
            ))}
          </View>
        </Panel>
        <Panel label="Sizes and states">
          <View style={styles.wrap}>
            {BUTTON_SIZES.map((size) => (
              <Button key={size} size={size} leadingIcon="plus">
                {`Size ${size}`}
              </Button>
            ))}
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </View>
        </Panel>
        <Panel label="Icon buttons">
          <View style={styles.wrap}>
            {ICON_BUTTON_VARIANTS.filter((v) => v !== 'glass').map((variant) => (
              <IconButton
                key={variant}
                icon="share-2"
                label={`Share (${variant})`}
                variant={variant}
              />
            ))}
            <IconButton icon="heart-filled" label="Saved" selected />
            <View style={styles.onImage}>
              <IconButton icon="heart" label="Save (on photo)" variant="glass" />
            </View>
          </View>
        </Panel>
      </Section>

      <Section title="Search and chips">
        <SearchField value={query} onChangeText={setQuery} />
        <ChipGroup layout="wrap">
          {categories.slice(0, 5).map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              selected={selectedChips.includes(category.id)}
              renderIcon={(color) => <CategoryIcon icon={category.icon} color={color} />}
              onPress={() =>
                setSelectedChips((c) =>
                  c.includes(category.id)
                    ? c.filter((x) => x !== category.id)
                    : [...c, category.id],
                )
              }
            />
          ))}
          <FilterChip label="Free entry" selected={false} count={8} />
        </ChipGroup>
        <Panel label="Category icons">
          <View style={styles.wrap}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryIcon}>
                  <CategoryIcon icon={category.icon} size="lg" color={semanticColors.primary} />
                </View>
                <Text variant="caption">{category.name}</Text>
              </View>
            ))}
          </View>
        </Panel>
      </Section>

      <Section
        title="Place cards"
        description="Distance appears only when the place and a reference location both have verified coordinates. The first compact card passes a sample distance."
      >
        {sample && sample2 ? (
          <>
            <PlaceCard place={sample} width={280} />
            <PlaceCard place={sample} variant="compact" distanceKm={12.4} />
            <PlaceCard
              place={{
                ...sample2,
                id: 'pl-broken-image-demo',
                name: 'Broken image fallback',
                imageUrls: ['https://invalid.example/missing.jpg'],
              }}
              variant="compact"
            />
            <PlaceCard
              place={{
                ...sample2,
                id: 'pl-no-photo-demo',
                name: 'No photos and no reviews',
                imageUrls: [],
                averageRating: null,
                reviewCount: 0,
              }}
              variant="compact"
            />
            <PlaceCardSkeleton variant="compact" />
          </>
        ) : (
          <PlaceCardSkeleton />
        )}
      </Section>

      <Section title="Indicators and badges">
        <Panel>
          <View style={styles.wrap}>
            <RatingIndicator rating={4.8} reviewCount={184} />
            <DistanceIndicator distanceKm={6.4} label="from Cusco" />
            <View style={styles.onImage}>
              <RatingIndicator rating={4.9} appearance="badge" size="sm" />
            </View>
          </View>
        </Panel>
        <Panel label="Tones">
          <View style={styles.wrap}>
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </View>
        </Panel>
        <Panel label="Submission statuses">
          <View style={styles.wrap}>
            {SUBMISSION_STATUSES.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </View>
        </Panel>
      </Section>

      {sample ? (
        <Section title="Gallery" description="Tap a photo to open the swipeable viewer.">
          <ImageGallery
            inset={0}
            images={sample.imageUrls.map((uri, i) => ({
              uri,
              alt: `${sample.name}, photo ${i + 1}`,
            }))}
          />
        </Section>
      ) : null}

      <Section
        title="Overlays"
        description="Modal, bottom sheet and confirmation dialog. Android back closes them."
      >
        <View style={styles.wrap}>
          <Button variant="secondary" onPress={() => setOverlay('modal')}>
            Modal
          </Button>
          <Button variant="secondary" onPress={() => setOverlay('sheet')}>
            Bottom sheet
          </Button>
          <Button variant="outline" onPress={() => setOverlay('confirm')}>
            Confirm
          </Button>
        </View>
        <Modal
          open={overlay === 'modal'}
          onClose={() => setOverlay(null)}
          title="Share this spot"
          description="Send Mistwood Retreat to a friend who loves quiet places."
          footer={
            <>
              <Button variant="secondary" onPress={() => setOverlay(null)}>
                {copy.actions.cancel}
              </Button>
              <Button
                leadingIcon="share-2"
                onPress={() => {
                  setOverlay(null);
                  showToast({ title: 'Link copied', tone: 'success' });
                }}
              >
                Copy link
              </Button>
            </>
          }
        />
        <BottomSheet
          open={overlay === 'sheet'}
          onClose={() => setOverlay(null)}
          title="Sort spots"
          footer={<Button onPress={() => setOverlay(null)}>Apply</Button>}
        >
          <ChipGroup layout="wrap">
            {['Recommended', 'Top rated', 'Closest', 'Newest'].map((label, i) => (
              <FilterChip key={label} label={label} selected={i === 0} />
            ))}
          </ChipGroup>
        </BottomSheet>
        <ConfirmDialog
          open={overlay === 'confirm'}
          tone="danger"
          title={copy.confirm.clearSaved.title}
          message={copy.confirm.clearSaved.message}
          confirmLabel={copy.confirm.clearSaved.confirm}
          onCancel={() => setOverlay(null)}
          onConfirm={() => {
            setOverlay(null);
            showToast({ title: 'Demo only', message: 'Nothing was deleted.', tone: 'info' });
          }}
        />
      </Section>

      <Section title="Forms" description="Submit the empty form to see validation messages.">
        <Panel>
          <FormDemo />
        </Panel>
      </Section>

      <Section title="Feedback">
        <Panel label="Skeleton">
          <View style={styles.row}>
            <Skeleton shape="circle" width={48} height={48} />
            <View style={[styles.stack, styles.flex]}>
              <Skeleton shape="text" width="60%" />
              <Skeleton shape="text" width="40%" />
            </View>
          </View>
        </Panel>
        <EmptyState
          size="inline"
          icon="search"
          title={copy.empty.noResults.title}
          message={copy.empty.noResults.message}
        />
        <ErrorState size="inline" onRetry={() => showToast({ title: 'Retrying…', tone: 'info' })} />
        <View style={styles.wrap}>
          {(['success', 'info', 'warning', 'danger', 'neutral'] as const).map((tone) => (
            <Button
              key={tone}
              variant="outline"
              size="sm"
              onPress={() =>
                showToast({ title: `${tone} toast`, message: 'Short and specific feedback.', tone })
              }
            >
              {tone}
            </Button>
          ))}
        </View>
      </Section>

      <Section title="Reviews and avatars">
        <View style={styles.wrap}>
          <Avatar
            person={{
              id: 'u-01',
              name: 'Maya Fernandes',
              avatarUrl: 'https://picsum.photos/seed/hs-avatar-maya/96/96',
            }}
            size="xl"
          />
          <Avatar person={{ id: 'u-02', name: 'Tomás Ruiz' }} size="lg" />
          <Avatar person={{ id: 'u-05', name: 'Priya Nair' }} />
          <Avatar
            person={{
              id: 'u-99',
              name: 'Broken Photo',
              avatarUrl: 'https://invalid.example/a.jpg',
            }}
            size="sm"
          />
        </View>
        {(reviews ?? []).slice(0, 2).map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </Section>

      <Text variant="caption" tone="tertiary" align="center">
        Palette: {Object.keys(palette).length} colours · Tokens from @hiddenspot/shared
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xxl, paddingTop: spacing.md },
  topBar: { flexDirection: 'row' },
  flex: { flex: 1 },
  section: { gap: spacing.lg },
  panel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
  },
  stack: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  swatch: { width: '45%', gap: 2 },
  swatchColor: {
    height: 56,
    marginBottom: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: semanticColors.border,
  },
  typeRow: {
    gap: 2,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: semanticColors.border,
  },
  scaleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scaleLabel: { width: 72 },
  spaceBar: { height: 10, borderRadius: radii.xs, backgroundColor: semanticColors.primary },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: 72,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.background,
  },
  onImage: { padding: spacing.md, borderRadius: radii.md, backgroundColor: palette.forest600 },
  categoryItem: { width: 72, alignItems: 'center', gap: spacing.xs },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColors.primarySubtle,
  },
});
