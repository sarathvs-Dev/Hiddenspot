import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { iconSizes, semanticColors, type IconSize } from '@hiddenspot/shared';
import type { ComponentProps } from 'react';

type FeatherName = ComponentProps<typeof Feather>['name'];

/** Feather icons plus filled variants that Feather lacks. */
export type IconName = FeatherName | 'heart-filled' | 'star-filled';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
  /** Icons are decorative by default. Give a label only when the icon stands alone. */
  accessibilityLabel?: string;
}

/** Icon locked to the icon size tokens. */
export function Icon({
  name,
  size = 'md',
  color = semanticColors.textPrimary,
  accessibilityLabel,
}: IconProps) {
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityLabel, accessibilityRole: 'image' as const }
    : { accessible: false, importantForAccessibility: 'no' as const };

  if (name === 'heart-filled')
    return <Ionicons name="heart" size={iconSizes[size]} color={color} {...a11y} />;
  if (name === 'star-filled')
    return <Ionicons name="star" size={iconSizes[size]} color={color} {...a11y} />;
  return <Feather name={name} size={iconSizes[size]} color={color} {...a11y} />;
}
