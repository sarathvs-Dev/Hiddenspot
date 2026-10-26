import { aspectRatios } from '@hiddenspot/shared';
import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';
import { cx } from './utils';

export interface SkeletonProps {
  shape?: 'rect' | 'text' | 'circle';
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  ratio?: keyof typeof aspectRatios;
  className?: string;
}

/** Placeholder block with a gentle shimmer. The shimmer stops when reduced motion is on. */
export function Skeleton({ shape = 'rect', width, height, ratio, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles.skeleton, styles[shape], className)}
      style={{ width, height, aspectRatio: ratio ? aspectRatios[ratio] : undefined }}
    />
  );
}

export function PlaceCardSkeleton({ variant = 'featured' }: { variant?: 'featured' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className={styles.compact} aria-hidden="true">
        <Skeleton ratio="compact" width={96} className={styles.compactImage} />
        <div className={styles.lines}>
          <Skeleton shape="text" width="30%" />
          <Skeleton shape="text" width="70%" height={18} />
          <Skeleton shape="text" width="50%" />
        </div>
      </div>
    );
  }
  return (
    <div className={styles.featured} aria-hidden="true">
      <Skeleton ratio="featured" className={styles.featuredImage} />
      <div className={styles.lines}>
        <Skeleton shape="text" width="65%" height={18} />
        <Skeleton shape="text" width="45%" />
      </div>
    </div>
  );
}

/** Announces loading once for screen readers while showing visual skeletons. */
export function LoadingRegion({
  label = 'Loading',
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}
