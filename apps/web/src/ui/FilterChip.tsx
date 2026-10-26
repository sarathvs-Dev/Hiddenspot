import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './FilterChip.module.css';
import { cx } from './utils';

export interface FilterChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selected: boolean;
  label: string;
  icon?: ReactNode;
  /** Optional result count shown after the label. */
  count?: number;
}

/** Toggle chip. Uses aria-pressed so assistive tech announces the selected state. */
export function FilterChip({ selected, label, icon, count, className, ...rest }: FilterChipProps) {
  return (
    <button type="button" aria-pressed={selected} className={cx(styles.chip, className)} {...rest}>
      {icon}
      <span>{label}</span>
      {count !== undefined ? <span className={styles.count}>{count}</span> : null}
    </button>
  );
}

export interface ChipGroupProps {
  label: string;
  children: ReactNode;
  /** "scroll" keeps one row and scrolls sideways on narrow screens. "wrap" always wraps. */
  layout?: 'scroll' | 'wrap';
  className?: string;
}

export function ChipGroup({ label, children, layout = 'scroll', className }: ChipGroupProps) {
  return (
    <div role="group" aria-label={label} className={cx(styles.group, styles[layout], className)}>
      {children}
    </div>
  );
}
