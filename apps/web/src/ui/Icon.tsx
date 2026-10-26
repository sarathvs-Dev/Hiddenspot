import { iconSizes, type IconSize } from '@hiddenspot/shared';
import type { LucideIcon } from 'lucide-react';

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  /** Icons are decorative by default. Pass a label only when the icon carries meaning on its own. */
  label?: string;
  className?: string;
  filled?: boolean;
}

/** Lucide icon locked to the icon size tokens. */
export function Icon({ icon: Glyph, size = 'md', label, className, filled }: IconProps) {
  return (
    <Glyph
      size={iconSizes[size]}
      strokeWidth={1.75}
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  );
}
