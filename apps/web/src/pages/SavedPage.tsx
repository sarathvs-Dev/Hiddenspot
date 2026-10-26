import { copy } from '@hiddenspot/shared';
import {
  useDataService,
  useSavedPlaceIds,
  useSavedPlaces,
  useStorageStatus,
  useToast,
} from '@hiddenspot/shared/react';
import { Heart, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { paths } from '../lib/paths';
import {
  Button,
  ButtonLink,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingRegion,
  PlaceCard,
  PlaceCardSkeleton,
  PlaceGrid,
  SectionHeading,
  ValidationMessage,
} from '../ui';
import styles from './SavedPage.module.css';

export function SavedPage() {
  const data = useDataService();
  const { isReady, clearSaved } = useSavedPlaceIds();
  const saved = useSavedPlaces();
  const storage = useStorageStatus();
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState<'clear' | 'reset' | null>(null);
  const places = saved.data ?? [];

  return (
    <div className={`container ${styles.page}`}>
      <SectionHeading
        as="h1"
        size="page"
        eyebrow="Your list"
        title="Saved places"
        description={copy.storage.local}
        action={
          <div className={styles.actions}>
            {places.length > 0 ? (
              <Button variant="ghost" leadingIcon={Trash2} onClick={() => setConfirm('clear')}>
                Clear saved
              </Button>
            ) : null}
            <Button variant="ghost" leadingIcon={RotateCcw} onClick={() => setConfirm('reset')}>
              Reset demo data
            </Button>
          </div>
        }
      />

      {storage.data === 'memory-only' ? (
        <ValidationMessage tone="info">{copy.storage.memoryOnly}</ValidationMessage>
      ) : null}
      {storage.data === 'recovered-from-corruption' ? (
        <ValidationMessage tone="info">{copy.storage.recovered}</ValidationMessage>
      ) : null}

      {saved.error && !saved.data ? (
        <ErrorState error={saved.error} onRetry={saved.reload} />
      ) : !isReady || (saved.isLoading && !saved.data) ? (
        <LoadingRegion label="Loading saved places">
          <PlaceGrid>
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i}>
                <PlaceCardSkeleton />
              </li>
            ))}
          </PlaceGrid>
        </LoadingRegion>
      ) : places.length > 0 ? (
        <PlaceGrid>
          {places.map((place) => (
            <li key={place.id}>
              <PlaceCard place={place} />
            </li>
          ))}
        </PlaceGrid>
      ) : (
        <EmptyState
          icon={Heart}
          title={copy.empty.noSaved.title}
          message={copy.empty.noSaved.message}
          action={<ButtonLink to={paths.explore}>{copy.actions.explore}</ButtonLink>}
        />
      )}

      <ConfirmDialog
        open={confirm === 'clear'}
        tone="danger"
        title={copy.confirm.clearSaved.title}
        message={copy.confirm.clearSaved.message}
        confirmLabel={copy.confirm.clearSaved.confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          void clearSaved().then(() => showToast({ ...copy.toasts.clearedSaved, tone: 'neutral' }));
        }}
      />
      <ConfirmDialog
        open={confirm === 'reset'}
        tone="danger"
        title={copy.storage.resetTitle}
        message={copy.storage.resetMessage}
        confirmLabel="Reset"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          void data
            .resetDemoState()
            .then(() => showToast({ title: 'Demo data reset', tone: 'neutral' }));
        }}
      />
    </div>
  );
}
