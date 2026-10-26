import { semanticColors } from '@hiddenspot/shared';
import {
  HiddenSpotDataProvider,
  ReferenceLocationProvider,
  ToastProvider,
} from '@hiddenspot/shared/react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DiscoveryProvider } from '@/lib/discovery';
import { LocationProvider } from '@/lib/location';
import { PreferencesProvider } from '@/lib/preferences';
import { appServices } from '@/lib/services';
import { FONT_ASSETS, FontsLoadedContext, ToastViewport, useBottomNavClearance } from '@/ui';

void SplashScreen.preventAutoHideAsync();

function Toasts() {
  return <ToastViewport bottomOffset={useBottomNavClearance()} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  // If fonts fail, the app still renders with system fonts rather than staying on the splash.
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <FontsLoadedContext.Provider value={fontsLoaded}>
        <HiddenSpotDataProvider services={appServices}>
          <PreferencesProvider>
            <ReferenceLocationProvider>
              <LocationProvider>
                <DiscoveryProvider>
                  <ToastProvider>
                    <View style={styles.root}>
                      <StatusBar style="dark" />
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: { backgroundColor: semanticColors.background },
                        }}
                      >
                        <Stack.Screen name="index" options={{ animation: 'fade' }} />
                        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                        <Stack.Screen
                          name="place/[id]"
                          options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                          name="design-system"
                          options={{ animation: 'slide_from_right' }}
                        />
                      </Stack>
                      <Toasts />
                    </View>
                  </ToastProvider>
                </DiscoveryProvider>
              </LocationProvider>
            </ReferenceLocationProvider>
          </PreferencesProvider>
        </HiddenSpotDataProvider>
      </FontsLoadedContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semanticColors.background },
});
