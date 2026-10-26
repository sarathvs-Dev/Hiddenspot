import { copy, spacing } from '@hiddenspot/shared';
import {
  useSavedPlaceIds,
  useSavedPlaces,
  useStorageStatus,
  useToast,
} from '@hiddenspot/shared/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PlaceCard,
  PlaceCardSkeleton,
  Screen,
  SectionHeading,
  ValidationMessage,
  useGutter,
} from '@/ui';

export default function SavedScreen() {
  const gutter = useGutter();
  const { isReady, clearSaved } = useSavedPlaceIds();
  const saved = useSavedPlaces();
  const storage = useStorageStatus();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const places = saved.data ?? [];

  return (
    <Screen withBottomNav contentStyle={[styles.content, { paddingHorizontal: gutter }]}>
      <SectionHeading
        size="page"
        eyebrow="Your list"
        title="Saved places"
        description={copy.storage.local}
        action={
          places.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon="trash-2"
              onPress={() => setConfirmOpen(true)}
            >
              Clear
            </Button>
          ) : undefined
        }
      />

      {storage.data === 'memory-only' ? (
        <ValidationMessage tone="info">{copy.storage.memoryOnly}</ValidationMessage>
      ) : null}
      {storage.data === 'recovered-from-corruption' ? (
        <ValidationMessage tone="info">{copy.storage.recovered}</ValidationMessage>
      ) : null}

      {saved.error && !saved.data ? (
        <ErrorState onRetry={saved.reload} />
      ) : !isReady || (saved.isLoading && !saved.data) ? (
        <View style={styles.list}>
          <PlaceCardSkeleton variant="compact" />
          <PlaceCardSkeleton variant="compact" />
        </View>
      ) : places.length > 0 ? (
        <View style={styles.list}>
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} variant="compact" />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="heart"
          title={copy.empty.noSaved.title}
          message={copy.empty.noSaved.message}
          action={<Button onPress={() => router.push('/explore')}>{copy.actions.explore}</Button>}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title={copy.confirm.clearSaved.title}
        message={copy.confirm.clearSaved.message}
        confirmLabel={copy.confirm.clearSaved.confirm}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void clearSaved().then(() => showToast({ ...copy.toasts.clearedSaved, tone: 'neutral' }));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingTop: spacing.lg },
  list: { gap: spacing.md },
});
