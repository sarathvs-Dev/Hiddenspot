import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { iconSizes, semanticColors, type CategoryIconKey, type IconSize } from '@hiddenspot/shared';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Maps the platform-neutral icon keys from the shared package to Material Community Icons. */
const ICONS: Record<CategoryIconKey, IconName> = {
  droplets: 'waterfall',
  umbrella: 'beach',
  mountain: 'image-filter-hdr',
  trees: 'pine-tree',
  landmark: 'temple-hindu',
  leaf: 'leaf',
  camera: 'camera-outline',
  compass: 'compass-outline',
};

export function CategoryIcon({
  icon,
  size = 'sm',
  color = semanticColors.textPrimary,
}: {
  icon: CategoryIconKey;
  size?: IconSize;
  color?: string;
}) {
  return (
    <MaterialCommunityIcons
      name={ICONS[icon]}
      size={iconSizes[size]}
      color={color}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
