import { semanticColors } from '@hiddenspot/shared';
import { Stack } from 'expo-router';

/** Explore keeps its own stack so Search opens inside the tab and the tab bar stays visible. */
export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: semanticColors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="search" options={{ animation: 'fade_from_bottom' }} />
    </Stack>
  );
}
