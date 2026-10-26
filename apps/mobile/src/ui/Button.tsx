import {
  buttonColors,
  buttonSizes,
  layout,
  opacities,
  radii,
  shadows,
  type ButtonSize,
  type ButtonVariant,
} from '@hiddenspot/shared';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Primary, secondary, outline, ghost and danger buttons. Same API and look as the web Button. */
export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const colors = buttonColors[variant];
  const spec = buttonSizes[size];
  const inactive = disabled || loading;
  // Small buttons extend their hit area to the 44px touch target.
  const hitSlop = Math.max(0, (layout.touchTarget - spec.height) / 2);

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: spec.height,
          paddingHorizontal: spec.paddingX,
          gap: spec.gap,
          backgroundColor: pressed ? colors.backgroundPressed : colors.background,
          borderColor: colors.border,
        },
        variant === 'primary' && styles.raised,
        fullWidth && styles.fullWidth,
        inactive && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.foreground} />
      ) : leadingIcon ? (
        <Icon name={leadingIcon} size={spec.icon} color={colors.foreground} />
      ) : null}
      <Text
        variant="button"
        style={{ color: colors.foreground, fontSize: spec.fontSize }}
        numberOfLines={1}
      >
        {children}
      </Text>
      {trailingIcon && !loading ? (
        <View>
          <Icon name={trailingIcon} size={spec.icon} color={colors.foreground} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  raised: { boxShadow: shadows.xs },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: opacities.disabled },
  pressed: { transform: [{ scale: 0.98 }] },
});
