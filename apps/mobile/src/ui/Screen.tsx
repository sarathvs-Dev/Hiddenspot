import { breakpoints, layout, semanticColors, spacing } from '@hiddenspot/shared';
import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useBottomNavClearance } from './BottomNav';

/** Horizontal gutter: 24 on phones, wider on tablets. */
export function useGutter(): number {
  const { width } = useWindowDimensions();
  return width >= breakpoints.md ? spacing.xxl : spacing.xl;
}

export interface ScreenProps {
  children: ReactNode;
  /** Wraps content in a ScrollView. */
  scroll?: boolean;
  /** Leaves room for the floating tab bar. */
  withBottomNav?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
}

/**
 * Standard screen: ivory background, safe area, consistent gutters, and content
 * centred at a readable width on tablets instead of stretching edge to edge.
 */
export function Screen({
  children,
  scroll = true,
  withBottomNav = false,
  edges = ['top'],
  contentStyle,
  scrollProps,
}: ScreenProps) {
  const clearance = useBottomNavClearance();
  const bottomPadding = withBottomNav ? clearance : spacing.xxl;
  const content = [styles.content, { paddingBottom: bottomPadding }, contentStyle];

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, ...content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: semanticColors.background },
  fill: { flex: 1 },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
});
