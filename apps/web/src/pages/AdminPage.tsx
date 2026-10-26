import {
  formatEntryFee,
  formatShortDate,
  getSubmissionStatusMeta,
  isDemoDataError,
  STATUSES_REQUIRING_NOTE,
  validateModerationNote,
  SUBMISSION_STATUSES,
  SUBMISSION_TRANSITIONS,
  type Submission,
  type SubmissionStatus,
} from '@hiddenspot/shared';
import {
  useCatalog,
  useDataService,
  useDemoUsers,
  usePlaces,
  useSubmissions,
  useToast,
} from '@hiddenspot/shared/react';
import { ExternalLink, Inbox, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { paths } from '../lib/paths';
import { usePageMeta } from '../lib/usePageMeta';
import {
  Button,
  ChipGroup,
  EmptyState,
  ErrorState,
  FilterChip,
  Icon,
  Modal,
  SectionHeading,
  Skeleton,
  SpotImage,
  StatusBadge,
  TextArea,
} from '../ui';
import styles from './AdminPage.module.css';

type StatusFilter = SubmissionStatus | 'all';

/** Moderator actions, worded as verbs. Only moderator transitions appear here. */
const ACTION_LABELS: Partial<Record<SubmissionStatus, string>> = {
  in_review: 'Start review',
  approved: 'Approve',
  changes_requested: 'Request changes',
  rejected: 'Reject',
};

const ACTION_EXPLANATIONS: Partial<Record<SubmissionStatus, string>> = {
  in_review: 'Marks this spot as being checked, so other moderators know it is taken.',
  approved: 'Publishes this spot as a new place in Explore on this device.',
  changes_requested:
    'Sends it back to the submitter with your note. It stays hidden until they resubmit.',
  rejected: 'Closes this submission for good. The submitter sees your note.',
};

const STATUS_ORDER: SubmissionStatus[] = [
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'rejected',
];

/**
 * Moderation demo. This route is NOT protected: there is no sign-in and no server.
 * Actions run as the fictional demo moderator against local demo data only.
 */
export function AdminPage() {
  usePageMeta(
    'Moderation demo',
    'Demonstration of how suggested spots are reviewed. Not a secured admin area.',
  );
  const data = useDataService();
  const submissions = useSubmissions();
  const users = useDemoUsers();
  const places = usePlaces();
  const { getCategory } = useCatalog();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const [action, setAction] = useState<{ submission: Submission; to: SubmissionStatus } | null>(
    null,
  );
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const status = (params.get('status') ?? 'all') as StatusFilter;
  // Drafts are private to their author, so moderators never see them.
  const all = (submissions.data ?? []).filter((s) => s.status !== 'draft');
  const counts = Object.fromEntries(
    SUBMISSION_STATUSES.map((s) => [s, all.filter((x) => x.status === s).length]),
  ) as Record<SubmissionStatus, number>;
  const visible = all
    .filter((s) => status === 'all' || s.status === status)
    .sort(
      (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
        (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0),
    );
  const selectedId = params.get('id');
  const selected = visible.find((s) => s.id === selectedId) ?? visible[0];
  const moderator = users.data?.find((u) => u.role === 'moderator');
  const userName = (id: string) =>
    users.data?.find((u) => u.id === id)?.displayName ?? 'Unknown demo user';

  const updateParams = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true });
  };

  const openAction = (submission: Submission, to: SubmissionStatus) => {
    setNote('');
    setNoteError(undefined);
    setAction({ submission, to });
  };

  const confirmAction = async () => {
    if (!action || !moderator || saving) return;
    // Same rule the data service enforces.
    const error = validateModerationNote(action.to, note);
    if (error) {
      setNoteError(error);
      return;
    }
    setSaving(true);
    try {
      const updated = await data.updateDemoSubmissionStatus(action.submission.id, {
        status: action.to,
        actorId: moderator.id,
        reviewerNote: note.trim() || null,
      });
      setAction(null);
      // Follow the submission into its new status so the details panel stays on it.
      updateParams({ id: updated.id, status: status === 'all' ? null : updated.status });
      showToast({
        title: `${updated.place.name}: ${getSubmissionStatusMeta(updated.status).label}`,
        message:
          updated.status === 'approved' ? 'It is now live in Explore on this device.' : undefined,
        tone: updated.status === 'rejected' ? 'warning' : 'success',
      });
    } catch (error) {
      const message = isDemoDataError(error) ? error.message : 'Please try again.';
      showToast({ title: 'Could not update', message, tone: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const filters: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: all.length },
    ...STATUS_ORDER.map((s) => ({
      value: s,
      label: getSubmissionStatusMeta(s).label,
      count: counts[s],
    })),
  ];

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.banner} role="note">
        <Icon icon={ShieldAlert} size="lg" />
        <div>
          <p className="ds-type-label">Demonstration interface only</p>
          <p className="ds-type-body-sm">
            This page has no sign-in and is not protected. Anyone with the link can open it. Actions
            run as the fictional <strong>{moderator?.displayName ?? 'Demo Moderator'}</strong> and
            only change demo data in this browser. A real product would check moderator permissions
            on a server.
          </p>
        </div>
      </div>

      <SectionHeading as="h1" size="page" eyebrow="Moderation" title="Suggested spots" />

      <ul className={styles.stats} aria-label="Overview">
        <li className={styles.stat}>
          <span className="ds-type-h2">{places.data?.length ?? '–'}</span>
          <span className="ds-type-caption">Live places</span>
        </li>
        <li className={styles.stat}>
          <span className="ds-type-h2">{counts.submitted ?? 0}</span>
          <span className="ds-type-caption">Pending review</span>
        </li>
        <li className={styles.stat}>
          <span className="ds-type-h2">{counts.in_review ?? 0}</span>
          <span className="ds-type-caption">In review</span>
        </li>
        <li className={styles.stat}>
          <span className="ds-type-h2">{counts.approved ?? 0}</span>
          <span className="ds-type-caption">Approved</span>
        </li>
        <li className={styles.stat}>
          <span className="ds-type-h2">{counts.rejected ?? 0}</span>
          <span className="ds-type-caption">Not accepted</span>
        </li>
      </ul>

      <ChipGroup label="Filter by status">
        {filters.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            count={f.count}
            selected={status === f.value}
            onClick={() => updateParams({ status: f.value === 'all' ? null : f.value, id: null })}
          />
        ))}
      </ChipGroup>

      {submissions.error ? (
        <ErrorState error={submissions.error} onRetry={submissions.reload} />
      ) : submissions.isLoading && !submissions.data ? (
        <div className={styles.layout}>
          <Skeleton height={320} />
          <Skeleton height={320} />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing here"
          message="No submissions have this status."
          action={
            <Button variant="secondary" onClick={() => updateParams({ status: null, id: null })}>
              Show all
            </Button>
          }
        />
      ) : (
        <div className={styles.layout}>
          <nav aria-label="Submissions">
            <ul className={styles.list}>
              {visible.map((s) => {
                const isSelected = s.id === selected?.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={styles.item}
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => updateParams({ id: s.id })}
                    >
                      <span className={styles.itemHead}>
                        <span className={styles.itemName}>{s.place.name}</span>
                        <StatusBadge status={s.status} size="sm" />
                      </span>
                      <span className="ds-type-caption">
                        {s.place.district} · {userName(s.submittedBy)} ·{' '}
                        {formatShortDate(s.createdAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {selected ? (
            <article className={styles.detail} aria-labelledby="detail-title">
              <header className={styles.detailHead}>
                <div>
                  <h2 id="detail-title" className="ds-type-h2">
                    {selected.place.name}
                  </h2>
                  <p className="ds-type-caption">
                    Suggested by {userName(selected.submittedBy)} on{' '}
                    {formatShortDate(selected.createdAt)}
                    {selected.updatedAt !== selected.createdAt
                      ? ` · updated ${formatShortDate(selected.updatedAt)}`
                      : ''}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </header>

              {selected.place.imageUrls.length > 0 ? (
                <ul className={styles.images} aria-label="Submitted photos">
                  {selected.place.imageUrls.map((url, i) => (
                    <li key={url.slice(-40) + i}>
                      <SpotImage
                        src={url}
                        alt={`Photo ${i + 1} of ${selected.place.name}`}
                        ratio="compact"
                        rounded
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`ds-type-body-sm ${styles.muted}`}>No photos were submitted.</p>
              )}

              <p className="ds-type-body">{selected.place.shortDescription}</p>
              {selected.place.description ? (
                <p className="ds-type-body-sm">{selected.place.description}</p>
              ) : null}

              <dl className={styles.facts}>
                <div>
                  <dt>Categories</dt>
                  <dd>
                    {selected.place.categoryIds.map((id) => getCategory(id)?.name ?? id).join(', ')}
                  </dd>
                </div>
                <div>
                  <dt>District</dt>
                  <dd>{selected.place.district}</dd>
                </div>
                <div>
                  <dt>Address or landmark</dt>
                  <dd>{selected.place.address ?? 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Coordinates</dt>
                  <dd>
                    {selected.place.latitude !== null && selected.place.longitude !== null
                      ? `${selected.place.latitude}, ${selected.place.longitude} (unverified)`
                      : 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt>Opening hours</dt>
                  <dd>{selected.place.openingHours ?? 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Entry fee</dt>
                  <dd>
                    {selected.place.entryFee
                      ? formatEntryFee(selected.place.entryFee)
                      : 'Not provided'}
                  </dd>
                </div>
                <div className={styles.wide}>
                  <dt>Safety notes</dt>
                  <dd>
                    {selected.place.safetyNotes?.length ? (
                      <ul className={styles.notes}>
                        {selected.place.safetyNotes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    ) : (
                      'None provided'
                    )}
                  </dd>
                </div>
              </dl>

              {selected.reviewerNote ? (
                <p className={`ds-type-body-sm ${styles.reviewerNote}`}>
                  <strong>Moderator note:</strong> {selected.reviewerNote}
                </p>
              ) : null}

              <p className={`ds-type-helper ${styles.muted}`}>
                {getSubmissionStatusMeta(selected.status).description}
              </p>

              {selected.status === 'approved' && selected.approvedPlaceId ? (
                <Link to={paths.place(selected.approvedPlaceId)} className={styles.liveLink}>
                  View the live place <Icon icon={ExternalLink} size="xs" />
                </Link>
              ) : null}

              <div className={styles.actions}>
                {SUBMISSION_TRANSITIONS[selected.status]
                  .filter((t) => t.by === 'moderator')
                  .map((t) => (
                    <Button
                      key={t.to}
                      variant={
                        t.to === 'rejected'
                          ? 'danger'
                          : t.to === 'approved'
                            ? 'primary'
                            : 'secondary'
                      }
                      disabled={!moderator}
                      onClick={() => openAction(selected, t.to)}
                    >
                      {ACTION_LABELS[t.to] ?? t.to}
                    </Button>
                  ))}
                {SUBMISSION_TRANSITIONS[selected.status].every((t) => t.by !== 'moderator') ? (
                  <p className={`ds-type-body-sm ${styles.muted}`}>
                    {selected.status === 'changes_requested'
                      ? 'Waiting for the submitter to update and resubmit.'
                      : 'This decision is final. No further actions.'}
                  </p>
                ) : null}
              </div>
            </article>
          ) : null}
        </div>
      )}

      <Modal
        open={action !== null}
        onClose={() => (saving ? undefined : setAction(null))}
        title={action ? `${ACTION_LABELS[action.to]}: ${action.submission.place.name}` : ''}
        description={action ? ACTION_EXPLANATIONS[action.to] : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)} disabled={saving} autoFocus>
              Cancel
            </Button>
            <Button
              variant={action?.to === 'rejected' ? 'danger' : 'primary'}
              loading={saving}
              onClick={() => void confirmAction()}
            >
              {action ? ACTION_LABELS[action.to] : 'Confirm'}
            </Button>
          </>
        }
      >
        {action ? (
          <TextArea
            label="Note to the submitter"
            required={STATUSES_REQUIRING_NOTE.includes(action.to)}
            optional={!STATUSES_REQUIRING_NOTE.includes(action.to)}
            value={note}
            rows={3}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteError(undefined);
            }}
            error={noteError}
            hint={
              STATUSES_REQUIRING_NOTE.includes(action.to)
                ? 'Required. Be kind and specific.'
                : undefined
            }
          />
        ) : null}
      </Modal>
    </div>
  );
}
