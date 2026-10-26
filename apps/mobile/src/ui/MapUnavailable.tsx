import { radii, semanticColors, spacing } from '@hiddenspot/shared';
import { StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';

/**
 * Shown where the native map cannot run (web, or an Android build without a key).
 * It never draws a fake map; it explains why, and the screen shows the list instead.
 */
export function MapUnavailable({
  height,
  count,
  reason,
}: {
  height: number;
  count: number;
  reason: 'web' | 'android-key';
}) {
  return (
    <View style={[styles.box, { minHeight: height }]} accessibilityRole="summary">
      <Icon name="map" size="lg" color={semanticColors.primary} />
      <Text variant="title" align="center">
        Map not available here
      </Text>
      <Text variant="bodySmall" tone="secondary" align="center">
        {reason === 'web'
          ? 'The interactive map runs in the iOS and Android apps. The list below shows the same places.'
          : 'This Android build has no Google Maps API key. Set GOOGLE_MAPS_ANDROID_API_KEY and rebuild. See the README.'}
      </Text>
      <Text variant="caption" tone="tertiary">
        {count} places with verified locations
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: semanticColors.borderStrong,
    backgroundColor: semanticColors.surfaceSecondary,
  },
});
