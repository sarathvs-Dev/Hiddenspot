import { getSubmissionStatusMeta, type SubmissionStatus, type Tone } from '@hiddenspot/shared';
import type { ReactNode } from 'react';
import styles from './Badge.module.css';
import { cx } from './utils';

export interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  /** Shows a small coloured dot before the label. */
  dot?: boolean;
  /** "subtle" for tinted backgrounds, "glass" for use on photos. */
  appearance?: 'subtle' | 'outline' | 'glass';
  size?: 'sm' | 'md';
  className?: string;
  children: ReactNode;
}

export function Badge({
  tone = 'neutral',
  icon,
  dot,
  appearance = 'subtle',
  size = 'md',
  className,
  children,
}: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], styles[appearance], styles[size], className)}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {icon}
      {children}
    </span>
  );
}

/** Moderation status for demo submissions. Label and tone come from shared metadata. */
export function StatusBadge({ status, size }: { status: SubmissionStatus; size?: 'sm' | 'md' }) {
  const meta = getSubmissionStatusMeta(status);
  return (
    <Badge tone={meta.tone} dot size={size}>
      {meta.label}
    </Badge>
  );
}
