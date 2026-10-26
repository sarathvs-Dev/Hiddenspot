import {
  formatLocation,
  type Place,
  type ReferenceLocation,
  isValidCoordinates,
} from '@hiddenspot/shared';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../lib/paths';
import { mapConfig } from '../lib/mapConfig';
import styles from './PlaceMap.module.css';

export interface PlaceMapProps {
  places: Place[];
  reference: ReferenceLocation | null;
}

/**
 * Leaflet map of places with verified coordinates. Leaflet is loaded only when this renders,
 * so it never weighs down pages without a map. Requires VITE_MAP_TILE_URL.
 */
export function PlaceMap({ places, reference }: PlaceMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element || !mapConfig.tileUrl) return;
    let disposed = false;
    let cleanup = () => {};

    void Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
      .then(([L]) => {
        if (disposed) return;
        const map = L.map(element, { scrollWheelZoom: false }).setView([10.45, 76.35], 7);
        L.tileLayer(mapConfig.tileUrl!, { attribution: mapConfig.attribution, maxZoom: 18 }).addTo(
          map,
        );
        const bounds: [number, number][] = [];
        for (const place of places) {
          if (!isValidCoordinates(place)) continue;
          bounds.push([place.latitude, place.longitude]);
          const marker = L.circleMarker([place.latitude, place.longitude], {
            radius: place.locationPrecision === 'area' ? 9 : 7,
            color: '#1C4433',
            weight: 2,
            fillColor: place.locationPrecision === 'area' ? '#7FAA90' : '#1C4433',
            fillOpacity: 0.85,
          }).addTo(map);
          const label = `${place.name}, ${formatLocation(place)}${place.locationPrecision === 'area' ? ' (approximate area)' : ''}`;
          marker.bindTooltip(label);
          marker.on('click', () => navigate(paths.place(place.slug)));
        }
        if (reference) {
          L.circleMarker([reference.latitude, reference.longitude], {
            radius: 6,
            color: '#2F5F8A',
            fillColor: '#2F5F8A',
            fillOpacity: 1,
          })
            .addTo(map)
            .bindTooltip(
              reference.kind === 'device' ? 'Your location' : `${reference.label} (demo location)`,
            );
        }
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [24, 24] });
        cleanup = () => map.remove();
      })
      .catch(() => setError('The map could not be loaded. The list view still works.'));

    return () => {
      disposed = true;
      cleanup();
    };
  }, [places, reference, navigate]);

  return (
    <div className={styles.wrap}>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div
        ref={container}
        className={styles.map}
        role="region"
        aria-label={`Map of ${places.length} places. Each place is also listed below.`}
      />
    </div>
  );
}
