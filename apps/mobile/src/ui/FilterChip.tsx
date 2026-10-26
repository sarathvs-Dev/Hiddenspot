import { radii, semanticColors, spacing, type CategoryId } from '@hiddenspot/shared';
import { useCatalog } from '@hiddenspot/shared/react';
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import { Text } from './Text';

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress?: () => void;
  /** Renders an icon in the right colour for the selected state. */
  renderIcon?: (color: string) => ReactNode;
  count?: number;
}

/** Toggle chip: forest when selected, outlined when idle. */
export function FilterChip({ label, selected, onPress, renderIcon, count }: FilterChipProps) {
  const color = selected ? semanticColors.onPrimary : semanticColors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {renderIcon?.(color)}
      <Text variant="label" style={{ color }}>
        {label}
      </Text>
      {count !== undefined ? (
        <View style={[styles.count, selected && styles.countSelected]}>
          <Text variant="caption" tone={selected ? 'highlight' : 'secondary'}>
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export interface ChipGroupProps {
  children: ReactNode;
  /** "scroll" keeps one row that scrolls sideways, "wrap" flows onto new lines. */
  layout?: 'scroll' | 'wrap';
  /** Side padding for the scrolling row, so chips align with the screen gutter. */
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

export function ChipGroup({
  children,
  layout = 'scroll',
  inset = spacing.xl,
  style,
}: ChipGroupProps) {
  if (layout === 'wrap') return <View style={[styles.wrap, style]}>{children}</View>;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
      style={style}
    >
      {children}
    </ScrollView>
  );
}

export interface CategoryChipsProps {
  selected: CategoryId[];
  onToggle: (id: CategoryId) => void;
  onClear?: () => void;
  layout?: 'scroll' | 'wrap';
  inset?: number;
}

export function CategoryChips({ selected, onToggle, onClear, layout, inset }: CategoryChipsProps) {
  const { categories } = useCatalog();
  return (
    <ChipGroup layout={layout} inset={inset}>
      {onClear ? (
        <FilterChip label="All" selected={selected.length === 0} onPress={onClear} />
      ) : null}
      {categories.map((category) => (
        <FilterChip
          key={category.id}
          label={category.name}
          selected={selected.includes(category.id)}
          onPress={() => onToggle(category.id)}
          renderIcon={(color) => <CategoryIcon icon={category.icon} size="sm" color={color} />}
        />
      ))}
    </ChipGroup>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
  },
  selected: { backgroundColor: semanticColors.primary, borderColor: semanticColors.primary },
  pressed: { opacity: 0.85 },
  count: {
    minWidth: 20,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    backgroundColor: semanticColors.surfaceSecondary,
    alignItems: 'center',
  },
  countSelected: { backgroundColor: semanticColors.highlight },
  row: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
