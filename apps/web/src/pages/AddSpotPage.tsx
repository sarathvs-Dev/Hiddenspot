import {
  copy,
  EMPTY_SUBMISSION_FORM,
  firstErrorSection,
  isSubmissionSectionComplete,
  isDemoDataError,
  issuesToSubmissionErrors,
  KERALA_DISTRICTS,
  LIMITS,
  MAX_SUBMISSION_PHOTOS,
  SUBMISSION_FORM_SECTIONS,
  toNewSubmissionInput,
  validateSubmissionForm,
  type Submission,
  type SubmissionFormErrors,
  type SubmissionFormValues,
} from '@hiddenspot/shared';
import { useCatalog, useCurrentUser, useDataService, useToast } from '@hiddenspot/shared/react';
import { Check, Crosshair, ImagePlus, Send, Trash2 } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { resizeImageFile } from '../lib/images';
import { paths } from '../lib/paths';
import { usePageMeta } from '../lib/usePageMeta';
import {
  Button,
  ButtonLink,
  CategoryIcon,
  Checkbox,
  ChipGroup,
  ConfirmDialog,
  FilterChip,
  Icon,
  SectionHeading,
  SelectField,
  StatusBadge,
  TextArea,
  TextField,
  ValidationMessage,
} from '../ui';
import styles from './AddSpotPage.module.css';

const FIELD_IDS: Partial<Record<keyof SubmissionFormValues, string>> = {
  name: 'spot-name',
  categoryIds: 'spot-categories',
  shortDescription: 'spot-short',
  district: 'spot-district',
  latitude: 'spot-lat',
  longitude: 'spot-lng',
  imageUris: 'spot-photos',
  safetyNotes: 'spot-safety',
  openingHours: 'spot-hours',
  feeAmount: 'spot-fee',
};

const FIELD_LABELS: Partial<Record<keyof SubmissionFormValues, string>> = {
  name: 'Place name',
  categoryIds: 'Category',
  shortDescription: 'Short description',
  description: 'Description',
  district: 'District',
  latitude: 'Latitude',
  longitude: 'Longitude',
  imageUris: 'Photos',
  safetyNotes: 'Safety information',
  openingHours: 'Opening hours',
  feeAmount: 'Entry fee',
};

export function AddSpotPage() {
  usePageMeta(
    'Add a spot',
    'Suggest a hidden place in Kerala. Every suggestion is reviewed before it goes live.',
  );
  const navigate = useNavigate();
  const data = useDataService();
  const user = useCurrentUser();
  const { categories } = useCatalog();
  const { showToast } = useToast();
  const [form, setForm] = useState<SubmissionFormValues>(EMPTY_SUBMISSION_FORM);
  const [errors, setErrors] = useState<SubmissionFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [created, setCreated] = useState<Submission | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(EMPTY_SUBMISSION_FORM);
  const sectionsDone = SUBMISSION_FORM_SECTIONS.filter((_, i) =>
    isSubmissionSectionComplete(i, form),
  ).length;

  const set = <K extends keyof SubmissionFormValues>(key: K, value: SubmissionFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const showErrors = (next: SubmissionFormErrors) => {
    setErrors(next);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setErrors((e) => ({
        ...e,
        latitude: 'This browser cannot share a location. Type coordinates instead.',
      }));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(5),
          longitude: pos.coords.longitude.toFixed(5),
        }));
        setErrors((e) => ({ ...e, latitude: undefined, longitude: undefined }));
        setLocating(false);
      },
      () => {
        setErrors((e) => ({
          ...e,
          latitude: copy.location.coordinatesUnavailable,
        }));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].slice(
      0,
      MAX_SUBMISSION_PHOTOS - form.imageUris.length,
    );
    event.target.value = '';
    if (!files.length) return;
    setProcessingPhotos(true);
    try {
      const uris = await Promise.all(files.map((file) => resizeImageFile(file)));
      set('imageUris', [...form.imageUris, ...uris].slice(0, MAX_SUBMISSION_PHOTOS));
    } catch (error) {
      setErrors((e) => ({
        ...e,
        imageUris: error instanceof Error ? error.message : 'A photo could not be added.',
      }));
    } finally {
      setProcessingPhotos(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return; // Already sending: ignore repeat presses and Enter.
    const all = validateSubmissionForm(form);
    if (Object.keys(all).length > 0) return showErrors(all);
    if (!user.data) return;
    setSubmitting(true);
    try {
      const submission = await data.addDemoSubmission(toNewSubmissionInput(form, user.data.id));
      setCreated(submission);
      showToast({
        title: 'Spot submitted',
        message: 'It is now waiting for review.',
        tone: 'success',
      });
      window.scrollTo({ top: 0 });
    } catch (error) {
      if (isDemoDataError(error) && error.issues.length)
        showErrors(issuesToSubmissionErrors(error.issues));
      else showToast({ title: 'Could not submit', message: 'Please try again.', tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className={`container ${styles.success}`} role="status">
        <span className={styles.successIcon}>
          <Icon icon={Check} size="xl" />
        </span>
        <h1 className="ds-type-h1">Thanks for sharing</h1>
        <p className="ds-type-body">
          <strong>{created.place.name}</strong> is waiting for a moderator. It will not appear in
          Explore until it is approved.
        </p>
        <StatusBadge status={created.status} />
        <p className={`ds-type-helper ${styles.muted}`}>
          This is a demo. Your submission is stored in this browser only.
        </p>
        <div className={styles.successActions}>
          <ButtonLink to={paths.profile}>See your submissions</ButtonLink>
          <Button
            variant="secondary"
            onClick={() => {
              setForm(EMPTY_SUBMISSION_FORM);
              setErrors({});
              setCreated(null);
            }}
          >
            Add another spot
          </Button>
        </div>
      </div>
    );
  }

  const errorEntries = Object.entries(errors).filter(([, v]) => v) as [
    keyof SubmissionFormValues,
    string,
  ][];
  errorEntries.sort(
    (a, b) => firstErrorSection({ [a[0]]: 'x' }) - firstErrorSection({ [b[0]]: 'x' }),
  );

  return (
    <div className={`container ${styles.page}`}>
      <SectionHeading
        as="h1"
        size="page"
        eyebrow="Contribute"
        title="Add a hidden spot"
        description="Share a place others would love. Fields marked * are required. A moderator reviews every suggestion."
      />

      <div className={styles.progress} role="group" aria-label="Form progress">
        <div className={styles.progressText}>
          <span className="ds-type-label">
            {sectionsDone} of {SUBMISSION_FORM_SECTIONS.length} sections complete
          </span>
        </div>
        <progress
          max={SUBMISSION_FORM_SECTIONS.length}
          value={sectionsDone}
          className={styles.progressBar}
        >
          {sectionsDone} of {SUBMISSION_FORM_SECTIONS.length}
        </progress>
      </div>

      {errorEntries.length > 0 ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          className={styles.summary}
          role="alert"
          aria-labelledby="error-summary-title"
        >
          <h2 id="error-summary-title" className="ds-type-h3">
            Please fix {errorEntries.length === 1 ? 'this' : `these ${errorEntries.length}`} before
            submitting
          </h2>
          <ul>
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <a href={`#${FIELD_IDS[field] ?? ''}`}>
                  {FIELD_LABELS[field] ?? field}: {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        className={styles.form}
        onSubmit={(e) => void submit(e)}
        noValidate
        aria-busy={submitting}
      >
        <fieldset className={styles.section}>
          <legend className="ds-type-h2">1. Basics</legend>
          <TextField
            id={FIELD_IDS.name}
            label="Place name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
            maxLength={LIMITS.placeName.max}
            hint="The name locals use, if you know it."
            autoComplete="off"
          />
          <fieldset id={FIELD_IDS.categoryIds} className={styles.inner} aria-describedby="cat-help">
            <legend className="ds-type-label">
              Category <span className={styles.required}>*</span>
            </legend>
            <ChipGroup label="Categories" layout="wrap">
              {categories.map((c) => (
                <FilterChip
                  key={c.id}
                  label={c.name}
                  icon={<CategoryIcon icon={c.icon} size="sm" />}
                  selected={form.categoryIds.includes(c.id)}
                  onClick={() =>
                    set(
                      'categoryIds',
                      form.categoryIds.includes(c.id)
                        ? form.categoryIds.filter((x) => x !== c.id)
                        : [...form.categoryIds, c.id].slice(-LIMITS.categoriesPerPlace.max),
                    )
                  }
                />
              ))}
            </ChipGroup>
            {errors.categoryIds ? (
              <ValidationMessage>{errors.categoryIds}</ValidationMessage>
            ) : (
              <p id="cat-help" className={`ds-type-helper ${styles.muted}`}>
                Choose up to {LIMITS.categoriesPerPlace.max}. The first is the main category.
              </p>
            )}
          </fieldset>
          <TextField
            id={FIELD_IDS.shortDescription}
            label="Short description"
            required
            value={form.shortDescription}
            onChange={(e) => set('shortDescription', e.target.value)}
            error={errors.shortDescription}
            maxLength={LIMITS.shortDescription.max}
            hint={`${form.shortDescription.trim().length}/${LIMITS.shortDescription.max}. One sentence that sums it up.`}
          />
          <TextArea
            label="Description"
            optional
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            error={errors.description}
            hint="What makes it special, how to get there, what to expect."
          />
        </fieldset>

        <fieldset className={styles.section}>
          <legend className="ds-type-h2">2. Location</legend>
          <SelectField
            id={FIELD_IDS.district}
            label="District"
            required
            value={form.district}
            placeholder="Choose a district"
            onChange={(e) => set('district', e.target.value)}
            options={KERALA_DISTRICTS.map((d) => ({ value: d, label: d }))}
            error={errors.district}
          />
          <TextField
            label="Address or landmark"
            optional
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            hint="For example: near the temple car park."
          />
          <div className={styles.coords}>
            <TextField
              id={FIELD_IDS.latitude}
              label="Latitude"
              optional
              inputMode="decimal"
              value={form.latitude}
              placeholder="10.2847"
              onChange={(e) => set('latitude', e.target.value)}
              error={errors.latitude}
            />
            <TextField
              id={FIELD_IDS.longitude}
              label="Longitude"
              optional
              inputMode="decimal"
              value={form.longitude}
              placeholder="76.5686"
              onChange={(e) => set('longitude', e.target.value)}
              error={errors.longitude}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            leadingIcon={Crosshair}
            loading={locating}
            onClick={useMyLocation}
          >
            Use where I am now
          </Button>
        </fieldset>

        <fieldset className={styles.section}>
          <legend className="ds-type-h2">3. Photos and safety</legend>
          <div className={styles.inner} id={FIELD_IDS.imageUris}>
            <span className="ds-type-label">
              Photos <span className={styles.muted}>(optional)</span>
            </span>
            <ul className={styles.photos}>
              {form.imageUris.map((uri, i) => (
                <li key={uri.slice(-40) + i} className={styles.photo}>
                  <img src={uri} alt={`Selected photo ${i + 1}`} />
                  <button
                    type="button"
                    className={styles.removePhoto}
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() =>
                      set(
                        'imageUris',
                        form.imageUris.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Icon icon={Trash2} size="sm" />
                  </button>
                </li>
              ))}
            </ul>
            {form.imageUris.length < MAX_SUBMISSION_PHOTOS ? (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="visually-hidden"
                  onChange={(e) => void addPhotos(e)}
                  aria-label="Choose photos"
                />
                <Button
                  type="button"
                  variant="outline"
                  leadingIcon={ImagePlus}
                  loading={processingPhotos}
                  onClick={() => fileInput.current?.click()}
                >
                  Add photos
                </Button>
              </>
            ) : null}
            {errors.imageUris ? (
              <ValidationMessage>{errors.imageUris}</ValidationMessage>
            ) : (
              <p className={`ds-type-helper ${styles.muted}`}>
                Up to {MAX_SUBMISSION_PHOTOS} of your own photos. They are resized and kept in this
                browser only.
              </p>
            )}
          </div>
          <TextArea
            id={FIELD_IDS.safetyNotes}
            label="Safety information"
            optional
            value={form.safetyNotes}
            onChange={(e) => set('safetyNotes', e.target.value)}
            error={errors.safetyNotes}
            hint="One note per line. For example: slippery rocks after rain."
          />
        </fieldset>

        <fieldset className={styles.section}>
          <legend className="ds-type-h2">4. Visit info</legend>
          <TextField
            id={FIELD_IDS.openingHours}
            label="Opening hours"
            optional
            value={form.openingHours}
            onChange={(e) => set('openingHours', e.target.value)}
            error={errors.openingHours}
            hint="Leave empty if you are not sure."
          />
          <fieldset className={styles.inner}>
            <legend className="ds-type-label">Entry fee</legend>
            {(
              [
                ['unknown', 'Not sure'],
                ['free', 'Free'],
                ['paid', 'Paid'],
              ] as const
            ).map(([value, label]) => (
              <Checkbox
                key={value}
                type="radio"
                name="fee"
                label={label}
                checked={form.feeChoice === value}
                onChange={() => set('feeChoice', value)}
              />
            ))}
          </fieldset>
          {form.feeChoice === 'paid' ? (
            <TextField
              id={FIELD_IDS.feeAmount}
              label="Fee in rupees"
              required
              inputMode="numeric"
              value={form.feeAmount}
              onChange={(e) => set('feeAmount', e.target.value)}
              error={errors.feeAmount}
            />
          ) : null}
        </fieldset>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => (dirty ? setConfirmCancel(true) : navigate(paths.home))}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            leadingIcon={Send}
            loading={submitting}
            disabled={!user.data}
          >
            {submitting ? 'Submitting…' : 'Submit for review'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmCancel}
        tone="danger"
        title="Discard this spot?"
        message="Everything you have entered will be cleared."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          setForm(EMPTY_SUBMISSION_FORM);
          navigate(paths.home);
        }}
      />
    </div>
  );
}
