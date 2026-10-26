import { radii, semanticColors, spacing } from '@hiddenspot/shared';
import { Pressable, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';

/** A selected filter, shown as a chip that removes itself when tapped. */
export function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable
      onPress={onRemove}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole="button"
      accessibilityLabel={`Remove filter: ${label}`}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Text variant="label" tone="brand">
        {label}
      </Text>
      <Icon name="x" size="xs" color={semanticColors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: semanticColors.borderStrong,
    backgroundColor: semanticColors.primarySubtle,
  },
  pressed: { opacity: 0.8 },
});
