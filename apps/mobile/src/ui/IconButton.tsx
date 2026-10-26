import {
  iconButtonColors,
  iconButtonSizes,
  layout,
  opacities,
  semanticColors,
  type IconButtonSize,
  type IconButtonVariant,
} from '@hiddenspot/shared';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';

export interface IconButtonProps {
  icon: IconName;
  /** Required accessible name, because the button has no visible text. */
  label: string;
  onPress?: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Toggle state, announced as "selected". */
  selected?: boolean;
  /** Overrides the variant icon colour. */
  iconColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'soft',
  size = 'md',
  selected,
  iconColor,
  disabled,
  style,
}: IconButtonProps) {
  const colors = iconButtonColors[variant];
  const dimension = iconButtonSizes[size];
  const hitSlop = Math.max(0, (layout.touchTarget - dimension) / 2);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: pressed ? colors.backgroundPressed : colors.background,
          borderColor: colors.border,
        },
        variant === 'glass' && selected && styles.glassSelected,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon
        name={icon}
        size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
        color={
          iconColor ??
          (selected && variant !== 'glass' ? semanticColors.favorite : colors.foreground)
        }
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  glassSelected: { backgroundColor: semanticColors.favorite, borderColor: semanticColors.favorite },
  disabled: { opacity: opacities.disabled },
  pressed: { transform: [{ scale: 0.94 }] },
});
