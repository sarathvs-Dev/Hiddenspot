import { isValidCoordinates, palette, radii, semanticColors } from '@hiddenspot/shared';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MapUnavailable } from './MapUnavailable';
import { KERALA_REGION, type MapPanelProps } from './MapPanel.types';

export { KERALA_REGION } from './MapPanel.types';

const extra = (Constants.expoConfig?.extra ?? {}) as { androidMapsConfigured?: boolean };

/**
 * iOS uses Apple Maps with no key. Expo Go ships its own Google Maps key on Android.
 * Standalone Android builds need GOOGLE_MAPS_ANDROID_API_KEY (see app.config.ts).
 */
export const isMapAvailable =
  Platform.OS === 'ios' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  extra.androidMapsConfigured === true;

export function MapPanel({ places, selectedId, onSelect, reference, height }: MapPanelProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const place = places.find((p) => p.id === selectedId);
    if (!place || !isValidCoordinates(place)) return;
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.6,
        longitudeDelta: 0.6,
      },
      350,
    );
  }, [selectedId, places]);

  if (!isMapAvailable)
    return (
      <MapUnavailable height={Math.min(height, 220)} count={places.length} reason="android-key" />
    );

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={KERALA_REGION}
        showsUserLocation={reference?.kind === 'device'}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        accessibilityLabel={`Map with ${places.length} places`}
      >
        {places.map((place) =>
          isValidCoordinates(place) ? (
            <Marker
              key={place.id}
              identifier={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={place.name}
              description={
                place.locationPrecision === 'area'
                  ? `${place.district} (approximate area)`
                  : place.district
              }
              pinColor={place.id === selectedId ? palette.amber500 : semanticColors.primary}
              onPress={() => onSelect(place.id)}
            />
          ) : null,
        )}
        {reference?.kind === 'preset' ? (
          <Marker
            identifier="reference"
            coordinate={{ latitude: reference.latitude, longitude: reference.longitude }}
            title={`${reference.label} (demo location)`}
            description="Distances are measured from here"
            pinColor={palette.blue600}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radii.xl, overflow: 'hidden', backgroundColor: semanticColors.skeleton },
});
