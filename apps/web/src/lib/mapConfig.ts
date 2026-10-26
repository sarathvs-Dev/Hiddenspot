/**
 * Map tiles are opt-in. Set VITE_MAP_TILE_URL (and VITE_MAP_ATTRIBUTION) in apps/web/.env
 * to enable the Explore map view. Without it the map toggle is disabled and explains why,
 * rather than showing a fake map. See apps/web/.env.example.
 */
export const mapConfig = {
  tileUrl: (import.meta.env.VITE_MAP_TILE_URL as string | undefined)?.trim() || null,
  attribution:
    (import.meta.env.VITE_MAP_ATTRIBUTION as string | undefined)?.trim() ||
    '&copy; map data contributors',
};

export const isMapConfigured = mapConfig.tileUrl !== null;
