import { copy, describeReference, LIMITS } from '@hiddenspot/shared';
import { Check, MapPin, Navigation, Star, X } from 'lucide-react';
import { useId, useState } from 'react';
import { useLocationContext } from '../lib/location';
import { Button } from './Button';
import styles from './Discovery.module.css';
import { ValidationMessage } from './Form';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { cx } from './utils';

/** A selected filter that removes itself when activated. */
export function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      className={styles.removable}
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
    >
      <span>{label}</span>
      <Icon icon={X} size="xs" />
    </button>
  );
}

/** Same wording on web and mobile. */
const STATUS_MESSAGES = copy.location;

/** Shows where distances are measured from. Demo locations are always labelled as demo. */
export function LocationSelector({ compact = false }: { compact?: boolean }) {
  const {
    reference,
    presets,
    activePreset,
    mode,
    deviceStatus,
    enableDeviceLocation,
    selectPreset,
  } = useLocationContext();
  const [open, setOpen] = useState(false);
  const isDevice = reference?.kind === 'device';

  return (
    <>
      <button
        type="button"
        className={cx(styles.locationPill, compact && styles.locationPillCompact)}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <Icon icon={isDevice ? Navigation : MapPin} size="sm" />
        <span>
          {reference
            ? isDevice
              ? 'Near you'
              : `${reference.label} · demo location`
            : 'Choose a location'}
        </span>
        <span className="visually-hidden">. Change where distances are measured from</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Measure distances from"
        description="Used for nearby places and distance filters. Nothing leaves your browser."
        variant="sheet"
        size="sm"
      >
        <div className={styles.locationBody}>
          <Button
            variant={mode === 'device' && isDevice ? 'primary' : 'secondary'}
            leadingIcon={Navigation}
            loading={deviceStatus === 'locating'}
            fullWidth
            onClick={enableDeviceLocation}
          >
            {isDevice ? 'Using your current location' : 'Use my current location'}
          </Button>
          {deviceStatus === 'denied' || deviceStatus === 'unavailable' ? (
            <ValidationMessage tone="info">{STATUS_MESSAGES[deviceStatus]}</ValidationMessage>
          ) : null}
          <fieldset className={styles.presets}>
            <legend className="ds-type-overline">Demo locations</legend>
            {presets.map((preset) => {
              const selected = !isDevice && activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={styles.preset}
                  onClick={() => {
                    selectPreset(preset.id);
                    setOpen(false);
                  }}
                >
                  <span>
                    <span className="ds-type-title">{preset.label}</span>
                    <span className={cx('ds-type-caption', styles.muted)}>
                      {preset.district} district · town centre
                    </span>
                  </span>
                  {selected ? <Icon icon={Check} size="md" /> : null}
                </button>
              );
            })}
          </fieldset>
          <p className={cx('ds-type-helper', styles.muted)}>
            Demo locations are town centres checked against Wikipedia and OpenStreetMap. They are
            not your position.
            {reference ? ` Currently: ${describeReference(reference)}.` : ''}
          </p>
        </div>
      </Modal>
    </>
  );
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Star rating built on native radio inputs, so arrow keys and screen readers work. */
export function StarRatingInput({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (rating: number) => void;
  error?: string;
}) {
  const name = useId();
  return (
    <fieldset className={styles.stars} aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="ds-type-label">
        Your rating <span className={styles.required}>*</span>
      </legend>
      <div className={styles.starRow}>
        {[LIMITS.rating.min, 2, 3, 4, LIMITS.rating.max].map((star) => (
          <label key={star} className={cx(styles.star, star <= value && styles.starOn)}>
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="visually-hidden"
            />
            <Icon icon={Star} size="lg" filled={star <= value} />
            <span className="visually-hidden">
              {star} {star === 1 ? 'star' : 'stars'}, {RATING_LABELS[star]}
            </span>
          </label>
        ))}
        <span className={cx('ds-type-label', styles.muted)} aria-hidden="true">
          {value ? RATING_LABELS[value] : 'Choose a rating'}
        </span>
      </div>
      {error ? <ValidationMessage id={`${name}-error`}>{error}</ValidationMessage> : null}
    </fieldset>
  );
}
