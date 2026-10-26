import { layout, palette, radii, semanticColors, shadows, spacing } from '@hiddenspot/shared';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** Gap between the floating bar and the bottom edge (or the home indicator). */
function useBarOffset(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, spacing.md);
}

/** Space content must leave at the bottom so the floating bar never covers it. */
export function useBottomNavClearance(): number {
  return layout.bottomNavHeight + useBarOffset() + spacing.lg;
}

/** Tab bar style, positioned above the home indicator on every device. */
export function useBottomNavStyle() {
  const bottom = useBarOffset();
  return [styles.bar, { bottom }];
}

/**
 * Tab item: icon with a short label. The active tab sits on an ivory pill.
 * The "add" tab is a raised amber action so the main contribution path is obvious.
 */
export function BottomNavItem({
  icon,
  label,
  focused,
  emphasis = false,
}: {
  icon: IconName;
  label: string;
  focused: boolean;
  emphasis?: boolean;
}) {
  if (emphasis) {
    return (
      <View style={styles.addWrap}>
        <View style={[styles.add, focused && styles.addFocused]}>
          <Icon name={icon} size="lg" color={semanticColors.textPrimary} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.item, focused && styles.itemActive]}>
      <Icon name={icon} size="md" color={focused ? semanticColors.primary : palette.sage300} />
      <Text
        variant="caption"
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={[styles.label, { color: focused ? semanticColors.primary : palette.sage300 }]}
      >
        {label}
      </Text>
    </View>
  );
}

export const bottomNavStyles = StyleSheet.create({
  item: { height: layout.bottomNavHeight, justifyContent: 'center', alignItems: 'center' },
});

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: layout.bottomNavHeight,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.xl,
    borderTopWidth: 0,
    backgroundColor: semanticColors.surfaceInverse,
    boxShadow: shadows.lg,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 56,
    height: 52,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
  },
  itemActive: { backgroundColor: semanticColors.background },
  label: { fontSize: 11, lineHeight: 14 },
  addWrap: { alignItems: 'center', justifyContent: 'center' },
  add: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.amber300,
    boxShadow: shadows.md,
  },
  addFocused: { backgroundColor: palette.amber500 },
});
