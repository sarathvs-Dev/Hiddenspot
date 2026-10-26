import {
  getSubmissionStatusMeta,
  radii,
  semanticColors,
  spacing,
  toneColors,
  type SubmissionStatus,
  type Tone,
} from '@hiddenspot/shared';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';

export interface BadgeProps {
  children: string;
  tone?: Tone;
  /** Renders an icon in the badge text colour. */
  renderIcon?: (color: string) => ReactNode;
  dot?: boolean;
  appearance?: 'subtle' | 'outline' | 'glass';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  children,
  tone = 'neutral',
  renderIcon,
  dot,
  appearance = 'subtle',
  size = 'md',
  style,
}: BadgeProps) {
  const colors = toneColors[tone];
  const foreground = appearance === 'glass' ? semanticColors.textOnImage : colors.foreground;

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.sm,
        appearance === 'subtle' && { backgroundColor: colors.background },
        appearance === 'outline' && { borderColor: colors.border },
        appearance === 'glass' && styles.glass,
        style,
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
      {renderIcon?.(foreground)}
      <Text variant="caption" style={{ color: foreground }}>
        {children}
      </Text>
    </View>
  );
}

/** Moderation status for demo submissions. Label and tone come from shared metadata. */
export function StatusBadge({ status, size }: { status: SubmissionStatus; size?: 'sm' | 'md' }) {
  const meta = getSubmissionStatusMeta(status);
  return (
    <Badge tone={meta.tone} dot size={size}>
      {meta.label}
    </Badge>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sm: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  glass: { backgroundColor: semanticColors.glass, borderColor: semanticColors.glassBorder },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
