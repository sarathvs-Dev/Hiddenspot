import type { IconButtonSize, IconButtonVariant } from '@hiddenspot/shared';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';
import styles from './IconButton.module.css';
import { cx } from './utils';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Required accessible name, because the button has no visible text. */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Fills the icon, for toggles such as save. */
  filled?: boolean;
}

export function IconButton({
  icon,
  label,
  variant = 'soft',
  size = 'md',
  filled,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.iconButton, styles[variant], styles[size], className)}
      {...rest}
    >
      <Icon icon={icon} size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} filled={filled} />
    </button>
  );
}
