import { durations, type EasingToken, easings } from '@hiddenspot/shared';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

/** Follows the system "Reduce motion" setting and updates when it changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/** A token duration, or 0 when reduced motion is on. */
export function useMotionDuration(token: keyof typeof durations): number {
  return useReducedMotion() ? 0 : durations[token];
}

export function easingFor(token: EasingToken) {
  const [x1, y1, x2, y2] = easings[token];
  return Easing.bezier(x1, y1, x2, y2);
}
