import { aspectRatios, radii, semanticColors, spacing } from '@hiddenspot/shared';
import { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { easingFor, useReducedMotion } from './useReducedMotion';

export interface SkeletonProps {
  shape?: 'rect' | 'text' | 'circle';
  width?: DimensionValue;
  height?: DimensionValue;
  ratio?: keyof typeof aspectRatios;
  style?: StyleProp<ViewStyle>;
}

/** Placeholder with a soft pulse. Static when reduced motion is on. */
export function Skeleton({ shape = 'rect', width = '100%', height, ratio, style }: SkeletonProps) {
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 700,
          easing: easingFor('standard'),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: easingFor('standard'),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        { width, opacity },
        height !== undefined && { height },
        ratio && { aspectRatio: aspectRatios[ratio] },
        shape === 'text' && styles.text,
        shape === 'circle' && styles.circle,
        style,
      ]}
    />
  );
}

export function PlaceCardSkeleton({
  variant = 'featured',
  width,
}: {
  variant?: 'featured' | 'compact';
  width?: number;
}) {
  if (variant === 'compact') {
    return (
      <View style={styles.compact}>
        <Skeleton width={88} ratio="compact" style={styles.thumb} />
        <View style={styles.lines}>
          <Skeleton shape="text" width="30%" />
          <Skeleton shape="text" width="70%" height={16} />
          <Skeleton shape="text" width="50%" />
        </View>
      </View>
    );
  }
  return <Skeleton width={width ?? '100%'} ratio="featured" style={styles.featured} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: semanticColors.skeleton, borderRadius: radii.md },
  text: { height: 12, borderRadius: radii.xs },
  circle: { borderRadius: 999 },
  featured: { borderRadius: radii.xl },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: semanticColors.surface,
  },
  thumb: { borderRadius: radii.md },
  lines: { flex: 1, gap: spacing.sm },
});
