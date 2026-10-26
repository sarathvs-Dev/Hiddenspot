import { aspectRatios } from '@hiddenspot/shared';
import { ImageOff, Mountain } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Icon } from './Icon';
import styles from './SpotImage.module.css';
import { cx } from './utils';

export interface SpotImageProps {
  /** Null when the place has no photos; a calm placeholder is shown instead. */
  src: string | null;
  /** Empty string for decorative images whose content is described nearby. */
  alt: string;
  ratio?: keyof typeof aspectRatios;
  /** Fill the parent instead of using an aspect ratio. */
  fill?: boolean;
  priority?: boolean;
  className?: string;
  rounded?: boolean;
}

/**
 * Image with a fixed aspect ratio, a calm sage placeholder while loading,
 * and a graceful fallback when the image fails.
 */
export function SpotImage({
  src,
  alt,
  ratio = 'featured',
  fill,
  priority,
  className,
  rounded,
}: SpotImageProps) {
  // Status is stored per src, so a new src starts in the loading state again.
  const [result, setResult] = useState<{ src: string; status: 'loaded' | 'error' } | null>(null);
  const state = src === null ? 'missing' : result?.src === src ? result.status : 'loading';
  const style: CSSProperties | undefined = fill ? undefined : { aspectRatio: aspectRatios[ratio] };

  return (
    <div
      className={cx(styles.frame, fill && styles.fill, rounded && styles.rounded, className)}
      style={style}
      data-state={state}
    >
      {state === 'error' || state === 'missing' || src === null ? (
        <div
          className={styles.fallback}
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
        >
          <Icon icon={state === 'missing' ? Mountain : ImageOff} size="lg" />
          <span>{state === 'missing' ? 'No photos yet' : 'Photo unavailable'}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={styles.img}
          onLoad={() => setResult({ src, status: 'loaded' })}
          onError={() => setResult({ src, status: 'error' })}
        />
      )}
    </div>
  );
}
