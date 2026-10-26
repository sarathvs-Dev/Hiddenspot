import { buttonSizes, type ButtonSize, type ButtonVariant } from '@hiddenspot/shared';
import type { LucideIcon } from 'lucide-react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import styles from './Button.module.css';
import { Icon } from './Icon';
import { cx } from './utils';

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
}

function buttonClassName(
  { variant = 'primary', size = 'md', fullWidth }: ButtonStyleProps,
  extra?: string,
) {
  return cx(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, extra);
}

function Content({
  size = 'md',
  leadingIcon,
  trailingIcon,
  loading,
  children,
}: ButtonStyleProps & { loading?: boolean; children: ReactNode }) {
  const iconSize = buttonSizes[size].icon;
  return (
    <>
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : leadingIcon ? (
        <Icon icon={leadingIcon} size={iconSize} />
      ) : null}
      <span>{children}</span>
      {trailingIcon && !loading ? <Icon icon={trailingIcon} size={iconSize} /> : null}
    </>
  );
}

export interface ButtonProps extends ButtonStyleProps, ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/** Primary, secondary, outline, ghost and danger buttons in three sizes. */
export function Button({
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  loading = false,
  className,
  children,
  type = 'button',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <Content size={size} leadingIcon={leadingIcon} trailingIcon={trailingIcon} loading={loading}>
        {children}
      </Content>
    </button>
  );
}

export interface ButtonLinkProps extends ButtonStyleProps, Omit<LinkProps, 'className'> {
  className?: string;
}

/** A router link that looks like a button. Use for navigation, not for actions. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName({ variant, size, fullWidth }, className)} {...rest}>
      <Content size={size} leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children as ReactNode}
      </Content>
    </Link>
  );
}

export interface ButtonAnchorProps
  extends ButtonStyleProps, AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

/** An external link styled as a button. Opens in a new tab with safe rel attributes. */
export function ButtonAnchor({
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...rest
}: ButtonAnchorProps) {
  return (
    <a
      target="_blank"
      rel="noreferrer noopener"
      className={buttonClassName({ variant, size, fullWidth }, className)}
      {...rest}
    >
      <Content size={size} leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </Content>
    </a>
  );
}
