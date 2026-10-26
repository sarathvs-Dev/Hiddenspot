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
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheet,
  Button,
  SelectField,
  StarRatingInput,
  Text,
  TextArea,
  TextField,
  ValidationMessage,
} from '@/ui';

interface ReviewSheetProps {
  open: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
}

type Errors = ReviewFormErrors;

/** Add-review form. Uses the shared review rules, which the data service enforces too. */
export function ReviewSheet({ open, onClose, placeId, placeName }: ReviewSheetProps) {
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

  const close = () => {
    setErrors({});
    onClose();
  };

  const submit = async () => {
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
    <BottomSheet
      open={open}
      onClose={close}
      title="Write a review"
      description={`Reviewing as ${user.data?.displayName ?? 'the demo user'}. Stored on this device only.`}
      footer={
        <>
          <Button variant="secondary" onPress={close}>
            Cancel
          </Button>
          <Button onPress={() => void submit()} loading={saving}>
            Post review
          </Button>
        </>
      }
    >
      <View style={styles.field}>
        <Text variant="label">
          Your rating{' '}
          <Text variant="label" tone="danger">
            *
          </Text>
        </Text>
        <StarRatingInput
          value={rating}
          onChange={(r) => {
            setRating(r);
            setErrors((e) => ({ ...e, rating: undefined }));
          }}
          error={Boolean(errors.rating)}
        />
        {errors.rating ? <ValidationMessage>{errors.rating}</ValidationMessage> : null}
      </View>
      <TextField
        label="Title"
        optional
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        maxLength={LIMITS.reviewTitle.max}
      />
      <TextArea
        label="Your review"
        required
        value={body}
        onChangeText={(v) => {
          setBody(v);
          if (errors.body) setErrors((e) => ({ ...e, body: undefined }));
        }}
        error={errors.body}
        hint={`${body.trim().length}/${LIMITS.reviewBody.max}. What was it like? Any tips for others?`}
      />
      <SelectField
        label="When did you visit?"
        value={visitedOn}
        placeholder="Not sure"
        options={months.map((m) => ({ value: m, label: formatMonthYear(m) }))}
        onChange={setVisitedOn}
        error={errors.visitedOn}
      />
      {errors.form ? <ValidationMessage>{errors.form}</ValidationMessage> : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
});
