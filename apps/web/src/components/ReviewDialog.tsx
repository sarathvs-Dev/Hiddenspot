import {
  formatMonthYear,
  LIMITS,
  recentVisitMonths,
  reviewErrorsFromError,
  toNewReviewInput,
  validateReviewFields,
  type ReviewFormErrors,
} from '@hiddenspot/shared';
import { useCurrentUser, useDataService, useToast } from '@hiddenspot/shared/react';
import { useMemo, useState, type FormEvent } from 'react';
import {
  Button,
  Modal,
  SelectField,
  StarRatingInput,
  TextArea,
  TextField,
  ValidationMessage,
} from '../ui';
import styles from './ReviewDialog.module.css';

type Errors = ReviewFormErrors;

/** Add-review form. Uses the shared review rules, which the data service enforces too. */
export function ReviewDialog({
  open,
  onClose,
  placeId,
  placeName,
}: {
  open: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
}) {
  const data = useDataService();
  const user = useCurrentUser();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visitedOn, setVisitedOn] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const months = useMemo(() => recentVisitMonths(), []);
  const formId = `review-${placeId}`;

  const close = () => {
    setErrors({});
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return; // A save is already in progress.
    const values = { rating, title, body, visitedOn };
    const next: Errors = validateReviewFields(values);
    setErrors(next);
    if (Object.keys(next).length || !user.data) return;

    setSaving(true);
    try {
      await data.addDemoReview(toNewReviewInput(values, placeId, user.data.id));
      showToast({
        title: 'Review added',
        message: `Thanks for reviewing ${placeName}.`,
        tone: 'success',
      });
      setRating(0);
      setTitle('');
      setBody('');
      setVisitedOn('');
      close();
    } catch (error) {
      setErrors(reviewErrorsFromError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Write a review"
      description={`Reviewing ${placeName} as ${user.data?.displayName ?? 'the demo user'}. Stored in this browser only.`}
      variant="sheet"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            Post review
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
        <StarRatingInput
          value={rating}
          onChange={(r) => {
            setRating(r);
            setErrors((e) => ({ ...e, rating: undefined }));
          }}
          error={errors.rating}
        />
        <TextField
          label="Title"
          optional
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          maxLength={LIMITS.reviewTitle.max}
        />
        <TextArea
          label="Your review"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          error={errors.body}
          hint={`${body.trim().length}/${LIMITS.reviewBody.max}. What was it like? Any tips for others?`}
        />
        <SelectField
          label="When did you visit?"
          value={visitedOn}
          placeholder="Not sure"
          onChange={(e) => setVisitedOn(e.target.value)}
          options={months.map((m) => ({ value: m, label: formatMonthYear(m) }))}
          error={errors.visitedOn}
        />
        {errors.form ? <ValidationMessage>{errors.form}</ValidationMessage> : null}
      </form>
    </Modal>
  );
}
