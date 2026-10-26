import { aspectRatios, durations, radii, semanticColors, spacing } from '@hiddenspot/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';
import { useReducedMotion } from './useReducedMotion';

export interface SpotImageProps {
  /** Null when the place has no photos; a calm placeholder is shown instead. */
  uri: string | null;
  /** Empty string for decorative images described by nearby text. */
  alt: string;
  ratio?: keyof typeof aspectRatios;
  /** Fill the parent instead of using an aspect ratio. */
  fill?: boolean;
  rounded?: boolean;
  priority?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Image with a fixed ratio, a sage placeholder, a gentle fade and a graceful fallback. */
export function SpotImage({
  uri,
  alt,
  ratio = 'featured',
  fill,
  rounded,
  priority,
  style,
}: SpotImageProps) {
  const [failedUri, setFailedUri] = useState<string>();
  const reducedMotion = useReducedMotion();
  const missing = uri === null;
  const failed = missing || failedUri === uri;

  return (
    <View
      style={[
        styles.frame,
        fill ? StyleSheet.absoluteFill : { aspectRatio: aspectRatios[ratio] },
        rounded && styles.rounded,
        style,
      ]}
      accessible={Boolean(alt)}
      accessibilityRole={alt ? 'image' : undefined}
      accessibilityLabel={alt || undefined}
    >
      {failed ? (
        <View style={styles.fallback}>
          <Icon
            name={missing ? 'image' : 'alert-circle'}
            size="lg"
            color={semanticColors.textSecondary}
          />
          <Text variant="caption" tone="secondary">
            {missing ? 'No photos yet' : 'Photo unavailable'}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: uri ?? undefined }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={reducedMotion ? 0 : durations.slow}
          priority={priority ? 'high' : 'normal'}
          onError={() => setFailedUri(uri ?? undefined)}
          accessible={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', backgroundColor: semanticColors.skeleton },
  rounded: { borderRadius: radii.lg },
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: semanticColors.surfaceSecondary,
  },
});
