import { copy, palette, semanticColors, spacing } from '@hiddenspot/shared';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '@/lib/preferences';
import { Button, SpotImage, Text, useGutter } from '@/ui';

const HERO_IMAGE = 'https://picsum.photos/seed/hs-welcome-terraces/1080/1920';

/** Welcome screen, shown until the user starts exploring (a local preference). */
export default function WelcomeScreen() {
  const gutter = useGutter();
  const { preferences, isReady, updatePreferences } = usePreferences();

  if (!isReady) return <View style={styles.root} />;
  if (preferences.onboardingComplete) return <Redirect href="/explore" />;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SpotImage uri={HERO_IMAGE} alt="" fill priority />
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />
      <SafeAreaView style={[styles.content, { paddingHorizontal: gutter }]}>
        <View style={styles.top}>
          <Text variant="overline" style={styles.eyebrow}>
            {copy.brand.name} · Kerala
          </Text>
          <Text variant="display" tone="onImage">
            Explore pure nature, quietly.
          </Text>
          <Text variant="body" tone="onImage" style={styles.lead}>
            {copy.brand.tagline} This is a demo: places are real, but reviews and accounts are
            samples.
          </Text>
        </View>
        <Button
          size="lg"
          fullWidth
          trailingIcon="arrow-right"
          onPress={() => {
            updatePreferences({ onboardingComplete: true });
            router.replace('/explore');
          }}
        >
          Start exploring
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semanticColors.surfaceInverse },
  scrim: { backgroundColor: 'rgba(15, 36, 27, 0.45)' },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  top: { gap: spacing.md, maxWidth: 520 },
  eyebrow: { color: palette.amber300 },
  lead: { opacity: 0.9 },
});
