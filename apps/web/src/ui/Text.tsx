import type { TypeVariant } from '@hiddenspot/shared';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import styles from './Text.module.css';
import { cx } from './utils';

export type TextTone =
  'primary' | 'secondary' | 'tertiary' | 'inverse' | 'brand' | 'danger' | 'inherit';

const DEFAULT_ELEMENT: Partial<Record<TypeVariant, ElementType>> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  title: 'h3',
  label: 'span',
  caption: 'span',
  overline: 'span',
  helper: 'span',
  button: 'span',
};

const kebab = (value: string) => value.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export interface TextProps {
  variant?: TypeVariant;
  /** The HTML element. Defaults to a sensible tag for the variant, so h2 renders an <h2>. */
  as?: ElementType;
  tone?: TextTone;
  align?: 'start' | 'center' | 'end';
  /** Clamp to this many lines with an ellipsis. */
  lines?: number;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** All text uses a typography token, so sizes and weights never drift from the design system. */
export function Text({
  variant = 'body',
  as,
  tone = 'primary',
  align,
  lines,
  className,
  id,
  style,
  children,
}: TextProps) {
  const Element = as ?? DEFAULT_ELEMENT[variant] ?? 'p';
  return (
    <Element
      id={id}
      className={cx(
        `ds-type-${kebab(variant)}`,
        styles[`tone-${tone}`],
        align && styles[`align-${align}`],
        lines ? styles.clamp : undefined,
        className,
      )}
      style={lines ? { ...style, WebkitLineClamp: lines } : style}
    >
      {children}
    </Element>
  );
}
