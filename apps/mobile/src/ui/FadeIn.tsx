import { durations } from '@hiddenspot/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { easingFor, useReducedMotion } from './useReducedMotion';

/**
 * Fades content in when it mounts, so newly shown results read as new. No movement and no
 * delay, so scrolling long lists never feels slow. Skipped when Reduce Motion is on.
 */
export function FadeIn({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: durations.normal,
      easing: easingFor('enter'),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}
