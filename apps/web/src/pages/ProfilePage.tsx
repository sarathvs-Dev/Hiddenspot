import { copy, formatShortDate, getSubmissionStatusMeta } from '@hiddenspot/shared';
import {
  useCatalog,
  useCurrentUser,
  useDataService,
  useSavedPlaceIds,
  useStorageStatus,
  useSubmissions,
  useToast,
} from '@hiddenspot/shared/react';
import { Info, Plus, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { paths } from '../lib/paths';
import { usePageMeta } from '../lib/usePageMeta';
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  ConfirmDialog,
  EmptyState,
  Icon,
  LocationSelector,
  SectionHeading,
  Skeleton,
  StatusBadge,
  ValidationMessage,
} from '../ui';
import styles from './ProfilePage.module.css';

/** Demo profile and local settings. There is no sign-in: this is a sample account in this browser. */
export function ProfilePage() {
  usePageMeta('Profile', 'Your demo profile, submissions and local settings.');
  const data = useDataService();
  const user = useCurrentUser();
  const { savedPlaceIds } = useSavedPlaceIds();
  const { getCategory } = useCatalog();
  const submissions = useSubmissions(user.data ? { submittedBy: user.data.id } : {});
  const storage = useStorageStatus();
  const { showToast } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const mine = user.data ? (submissions.data ?? []) : [];
  const pending = mine.filter((s) =>
    ['submitted', 'in_review', 'changes_requested'].includes(s.status),
  ).length;

  const reset = async () => {
    setConfirmReset(false);
    setResetting(true);
    try {
      await data.resetDemoState();
      showToast({
        title: 'Demo data reset',
        message: 'Everything is back to the starting sample data.',
        tone: 'success',
      });
    } catch {
      showToast({ title: 'Could not reset', message: 'Please try again.', tone: 'danger' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.identity} aria-labelledby="profile-name">
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
        <div className={styles.identityText}>
          <h1 id="profile-name" className="ds-type-h1">
            {user.data?.displayName ?? 'Loading profile'}
          </h1>
          <Badge tone="highlight" size="sm" icon={<Icon icon={Info} size="xs" />}>
            Demo profile, not signed in
          </Badge>
          <p className={`ds-type-body-sm ${styles.muted}`}>
            This is a sample account so you can try HiddenSpot. There is no real sign-in, and
            nothing you do here is sent to a server.
          </p>
        </div>
      </section>

      <ul className={styles.stats} aria-label="Your activity">
        <li>
          <Link to={paths.saved} className={styles.stat}>
            <span className="ds-type-h2">{savedPlaceIds.length}</span>
            <span className={`ds-type-caption ${styles.muted}`}>Saved places</span>
          </Link>
        </li>
        <li>
          <a href="#my-submissions" className={styles.stat}>
            <span className="ds-type-h2">{mine.length}</span>
            <span className={`ds-type-caption ${styles.muted}`}>Submissions</span>
          </a>
        </li>
        <li>
          <a href="#my-submissions" className={styles.stat}>
            <span className="ds-type-h2">{pending}</span>
            <span className={`ds-type-caption ${styles.muted}`}>Waiting for review</span>
          </a>
        </li>
      </ul>

      <section className={styles.section} aria-labelledby="my-submissions">
        <SectionHeading
          id="my-submissions"
          title="Your submissions"
          description="Spots you suggested and where they are in review."
          action={
            <ButtonLink to={paths.addSpot} variant="secondary" leadingIcon={Plus}>
              Add a spot
            </ButtonLink>
          }
        />
        {submissions.isLoading && !submissions.data ? (
          <Skeleton height={96} />
        ) : mine.length === 0 ? (
          <EmptyState
            size="inline"
            title="No submissions yet"
            message="Know a quiet place others would love? Share it."
            action={<ButtonLink to={paths.addSpot}>Add a spot</ButtonLink>}
          />
        ) : (
          <ul className={styles.submissions}>
            {mine.map((s) => {
              const meta = getSubmissionStatusMeta(s.status);
              const category = s.place.categoryIds[0]
                ? getCategory(s.place.categoryIds[0])
                : undefined;
              return (
                <li key={s.id} className={styles.submission}>
                  <div className={styles.submissionHead}>
                    <h3 className="ds-type-h3">
                      {s.status === 'approved' && s.approvedPlaceId ? (
                        <Link to={paths.place(s.approvedPlaceId)}>{s.place.name}</Link>
                      ) : (
                        s.place.name
                      )}
                    </h3>
                    <StatusBadge status={s.status} size="sm" />
                  </div>
                  <p className={`ds-type-caption ${styles.muted}`}>
                    {[category?.name, s.place.district, `Updated ${formatShortDate(s.updatedAt)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p className="ds-type-body-sm">{meta.description}</p>
                  {s.reviewerNote ? (
                    <p className={`ds-type-body-sm ${styles.note}`}>
                      <strong>Moderator note:</strong> {s.reviewerNote}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-labelledby="location-heading">
        <SectionHeading
          id="location-heading"
          title="Distance from"
          description="Distances are measured from here. Your device location is only used when you choose it."
        />
        <div>
          <LocationSelector />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="data-heading">
        <SectionHeading id="data-heading" title="Demo data on this device" />
        <p className="ds-type-body-sm">{copy.storage.local}</p>
        {storage.data === 'memory-only' ? (
          <ValidationMessage tone="info">{copy.storage.memoryOnly}</ValidationMessage>
        ) : null}
        {storage.data === 'recovered-from-corruption' ? (
          <ValidationMessage tone="info">{copy.storage.recovered}</ValidationMessage>
        ) : null}
        <div className={styles.row}>
          <Button
            variant="danger"
            leadingIcon={RotateCcw}
            loading={resetting}
            onClick={() => setConfirmReset(true)}
          >
            Reset demo data
          </Button>
          <ButtonLink to={paths.admin} variant="ghost" leadingIcon={ShieldCheck}>
            Open moderation demo
          </ButtonLink>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        tone="danger"
        title={copy.storage.resetTitle}
        message={copy.storage.resetMessage}
        confirmLabel="Reset"
        cancelLabel="Keep my data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => void reset()}
      />
    </div>
  );
}
