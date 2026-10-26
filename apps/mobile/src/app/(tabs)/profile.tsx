import {
  copy,
  formatShortDate,
  getSubmissionStatusMeta,
  radii,
  semanticColors,
  spacing,
} from '@hiddenspot/shared';
import {
  useCatalog,
  useCurrentUser,
  useDataService,
  useSavedPlaceIds,
  useStorageStatus,
  useSubmissions,
  useToast,
} from '@hiddenspot/shared/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SORT_CHOICES, useDiscovery } from '@/lib/discovery';
import { useLocationContext } from '@/lib/location';
import { usePreferences } from '@/lib/preferences';
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Icon,
  Screen,
  SectionHeading,
  SelectField,
  Skeleton,
  StatusBadge,
  Text,
  ValidationMessage,
  useGutter,
} from '@/ui';
import type { PlaceSortOption } from '@hiddenspot/shared';

/** Demo profile and local settings. There is no real account in Phase 1. */
export default function ProfileScreen() {
  const gutter = useGutter();
  const data = useDataService();
  const user = useCurrentUser();
  const { savedPlaceIds } = useSavedPlaceIds();
  const { getCategory } = useCatalog();
  const submissions = useSubmissions(user.data ? { submittedBy: user.data.id } : {});
  const storage = useStorageStatus();
  const { showToast } = useToast();
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const { presets, selectPreset } = useLocationContext();
  const discovery = useDiscovery();
  const [confirm, setConfirm] = useState<'data' | 'preferences' | null>(null);
  const mine = user.data ? (submissions.data ?? []) : [];

  return (
    <Screen withBottomNav contentStyle={[styles.content, { paddingHorizontal: gutter }]}>
      <View style={styles.identity}>
        {user.data ? (
          <Avatar
            person={{
              id: user.data.id,
              name: user.data.displayName,
              avatarUrl: user.data.avatarUrl,
            }}
            size="xl"
          />
        ) : (
          <Skeleton shape="circle" width={80} height={80} />
        )}
        <View style={styles.flex}>
          <Text variant="h2">{user.data?.displayName ?? ' '}</Text>
          <Badge
            tone="highlight"
            size="sm"
            renderIcon={(c) => <Icon name="info" size="xs" color={c} />}
          >
            Demo profile, not signed in
          </Badge>
        </View>
      </View>
      <Text variant="bodySmall" tone="secondary">
        This is a sample account so you can try the app. There is no real sign-in, and nothing you
        do here is sent to a server.
      </Text>

      <View style={styles.stats}>
        <Pressable
          style={styles.stat}
          onPress={() => router.push('/saved')}
          accessibilityRole="button"
        >
          <Text variant="h2">{savedPlaceIds.length}</Text>
          <Text variant="caption" tone="secondary">
            Saved places
          </Text>
        </Pressable>
        <View style={styles.stat}>
          <Text variant="h2">{mine.length}</Text>
          <Text variant="caption" tone="secondary">
            Submissions
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading
          size="subsection"
          title="Your submissions"
          action={
            <Button
              variant="ghost"
              size="sm"
              leadingIcon="plus"
              onPress={() => router.push('/add')}
            >
              Add
            </Button>
          }
        />
        {submissions.isLoading && !submissions.data ? (
          <Skeleton height={120} />
        ) : mine.length === 0 ? (
          <Text variant="body" tone="secondary">
            You have not suggested any places yet.
          </Text>
        ) : (
          mine.map((submission) => {
            const firstCategory = submission.place.categoryIds[0];
            const category = firstCategory ? getCategory(firstCategory) : undefined;
            return (
              <View key={submission.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.flex}>
                    <Text variant="title">{submission.place.name}</Text>
                    <Text variant="caption" tone="secondary">
                      {[
                        category?.name,
                        submission.place.district,
                        `Updated ${formatShortDate(submission.updatedAt)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <StatusBadge status={submission.status} size="sm" />
                </View>
                <Text variant="bodySmall" tone="secondary">
                  {getSubmissionStatusMeta(submission.status).description}
                </Text>
                {submission.reviewerNote ? (
                  <ValidationMessage tone="info">{submission.reviewerNote}</ValidationMessage>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <SectionHeading
          size="subsection"
          title="Preferences"
          description="Saved on this device only."
        />
        <SelectField
          label="Default demo location"
          value={preferences.presetId}
          options={presets.map((p) => ({ value: p.id, label: `${p.label} (${p.district})` }))}
          onChange={(id) => selectPreset(id)}
          hint="Used for distances when you have not shared your location."
        />
        <SelectField<PlaceSortOption>
          label="Default sort for search"
          value={preferences.defaultSort}
          options={SORT_CHOICES}
          onChange={(sort) => {
            updatePreferences({ defaultSort: sort });
            discovery.setSortBy(sort);
          }}
        />
        <Checkbox
          label="Show the welcome screen next time"
          checked={!preferences.onboardingComplete}
          onChange={(show) => updatePreferences({ onboardingComplete: !show })}
        />
        <Button variant="ghost" size="sm" onPress={() => setConfirm('preferences')}>
          Restore default preferences
        </Button>
      </View>

      <View style={styles.section}>
        <SectionHeading size="subsection" title="Demo data" description={copy.storage.local} />
        {storage.data === 'memory-only' ? (
          <ValidationMessage tone="info">{copy.storage.memoryOnly}</ValidationMessage>
        ) : null}
        {storage.data === 'recovered-from-corruption' ? (
          <ValidationMessage tone="info">{copy.storage.recovered}</ValidationMessage>
        ) : null}
        <Button variant="outline" leadingIcon="rotate-ccw" onPress={() => setConfirm('data')}>
          Reset demo data
        </Button>
      </View>

      <Pressable
        onPress={() => router.push('/design-system')}
        accessibilityRole="link"
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <Icon name="layers" color={semanticColors.primary} />
        <View style={styles.flex}>
          <Text variant="title">Design system</Text>
          <Text variant="bodySmall" tone="secondary">
            Colours, type and components used in this app.
          </Text>
        </View>
        <Icon name="chevron-right" color={semanticColors.textSecondary} />
      </Pressable>

      <ConfirmDialog
        open={confirm === 'data'}
        tone="danger"
        title={copy.storage.resetTitle}
        message={copy.storage.resetMessage}
        confirmLabel="Reset"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          discovery.clearAll();
          void data
            .resetDemoState()
            .then(() => showToast({ title: 'Demo data reset', tone: 'neutral' }));
        }}
      />
      <ConfirmDialog
        open={confirm === 'preferences'}
        title="Restore default preferences?"
        message="Your demo location and default sort go back to their defaults."
        confirmLabel="Restore"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          resetPreferences();
          showToast({ title: 'Preferences restored', tone: 'neutral' });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingTop: spacing.xl },
  flex: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.85 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: semanticColors.surfaceSecondary,
  },
  section: { gap: spacing.md },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
  },
});
