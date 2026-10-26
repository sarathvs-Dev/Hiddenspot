import type { CategoryIconKey, IconSize } from '@hiddenspot/shared';
import {
  Camera,
  Compass,
  Droplets,
  Landmark,
  Leaf,
  Mountain,
  Trees,
  Umbrella,
  type LucideIcon,
} from 'lucide-react';
import { Icon } from './Icon';

/** Maps the platform-neutral icon keys from the shared package to Lucide icons. */
const CATEGORY_ICONS: Record<CategoryIconKey, LucideIcon> = {
  droplets: Droplets,
  umbrella: Umbrella,
  mountain: Mountain,
  trees: Trees,
  landmark: Landmark,
  leaf: Leaf,
  camera: Camera,
  compass: Compass,
};

export function CategoryIcon({
  icon,
  size = 'sm',
  className,
}: {
  icon: CategoryIconKey;
  size?: IconSize;
  className?: string;
}) {
  return <Icon icon={CATEGORY_ICONS[icon]} size={size} className={className} />;
}
