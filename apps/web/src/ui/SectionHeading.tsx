import type { ReactNode } from 'react';
import styles from './SectionHeading.module.css';
import { cx } from './utils';

export interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  description?: string;
  /** Right-aligned action such as a "View all" link. */
  action?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  /** Visual size, independent of the heading level. */
  size?: 'page' | 'section' | 'subsection';
  id?: string;
  className?: string;
}

const SIZE_CLASS = { page: 'ds-type-h1', section: 'ds-type-h2', subsection: 'ds-type-h3' } as const;

export function SectionHeading({
  title,
  eyebrow,
  description,
  action,
  as: Heading = 'h2',
  size = 'section',
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cx(styles.heading, className)}>
      <div className={styles.text}>
        {eyebrow ? <p className={cx('ds-type-overline', styles.eyebrow)}>{eyebrow}</p> : null}
        <Heading id={id} className={SIZE_CLASS[size]}>
          {title}
        </Heading>
        {description ? (
          <p className={cx('ds-type-body', styles.description)}>{description}</p>
        ) : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
