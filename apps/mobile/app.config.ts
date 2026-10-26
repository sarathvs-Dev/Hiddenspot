import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json with native permissions and map configuration.
 *
 * Maps: iOS uses Apple Maps (no key). Expo Go works without setup. Standalone Android builds
 * need a Google Maps key in GOOGLE_MAPS_ANDROID_API_KEY. Without it the Map tab shows a list
 * and setup guidance instead of an empty map.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();

  return {
    ...config,
    name: config.name ?? 'HiddenSpot',
    slug: config.slug ?? 'hiddenspot',
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'HiddenSpot uses your location only to show how far places are from you. It is not stored or shared.',
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'HiddenSpot lets you attach photos when you suggest a new place.',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
    ],
    extra: {
      ...config.extra,
      androidMapsConfigured: Boolean(androidMapsKey),
    },
  };
};
