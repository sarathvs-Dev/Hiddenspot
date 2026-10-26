import { durations, radii, semanticColors, spacing } from '@hiddenspot/shared';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { easingFor, useReducedMotion } from './useReducedMotion';

/** "Step 2 of 4 · Location" with an animated bar. */
export function StepProgress({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(step / total));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: step / total,
      duration: reducedMotion ? 0 : durations.slow,
      easing: easingFor('standard'),
      useNativeDriver: false,
    }).start();
  }, [progress, step, total, reducedMotion]);

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${total}, ${label}`}
      accessibilityValue={{ min: 0, max: total, now: step }}
    >
      <View style={styles.labels}>
        <Text variant="overline" tone="brand">
          Step {step} of {total}
        </Text>
        <Text variant="label">{label}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.bar,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  track: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: semanticColors.surfaceSecondary,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: radii.pill, backgroundColor: semanticColors.primary },
});
