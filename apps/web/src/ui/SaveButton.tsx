import { copy, type IconButtonSize, type IconButtonVariant } from '@hiddenspot/shared';
import { useSavedPlaceIds, useToast } from '@hiddenspot/shared/react';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from './IconButton';
import styles from './SaveButton.module.css';
import { cx } from './utils';

export interface SaveButtonProps {
  placeId: string;
  placeName: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
}

/** Save toggle with toast feedback and undo. Persists through the data service. */
export function SaveButton({
  placeId,
  placeName,
  variant = 'soft',
  size = 'md',
  className,
}: SaveButtonProps) {
  const { isSaved, toggleSaved } = useSavedPlaceIds();
  const { showToast } = useToast();
  const saved = isSaved(placeId);
  // True only right after the user saves, so the heart animates on the change itself.
  const [justSaved, setJustSaved] = useState(false);

  return (
    <IconButton
      icon={Heart}
      filled={saved}
      aria-pressed={saved}
      label={saved ? `Remove ${placeName} from saved` : `Save ${placeName}`}
      variant={variant}
      size={size}
      className={cx(className, justSaved && saved && styles.pop)}
      onClick={() => {
        const nowSaved = toggleSaved(placeId);
        setJustSaved(nowSaved);
        showToast({
          ...(nowSaved ? copy.toasts.saved(placeName) : copy.toasts.removed(placeName)),
          tone: nowSaved ? 'success' : 'neutral',
          action: nowSaved ? undefined : { label: 'Undo', onPress: () => toggleSaved(placeId) },
        });
      }}
    />
  );
}
