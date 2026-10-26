import { layout, radii, semanticColors, shadows, spacing, typography } from '@hiddenspot/shared';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon } from './Icon';
import { useTypeStyle } from './Text';

export interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search places, regions or tags',
  autoFocus,
  onSubmitEditing,
  style,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false);
  const textStyle = useTypeStyle('body');

  return (
    <View style={[styles.field, focused && styles.focused, style]}>
      <Icon name="search" size="md" color={semanticColors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={semanticColors.textTertiary}
        style={[textStyle, styles.input]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Search spots"
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clear}
        >
          <Icon name="x" size="sm" color={semanticColors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: layout.touchTarget + 4,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
    boxShadow: shadows.xs,
  },
  focused: { borderColor: semanticColors.focusRing },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    color: semanticColors.textPrimary,
    lineHeight: typography.body.size * 1.25,
  },
  clear: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
