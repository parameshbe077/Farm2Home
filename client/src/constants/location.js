export const FARM_LOCATION = {
  lat: Number(import.meta.env.VITE_FARM_LAT) || 9.9252,
  lng: Number(import.meta.env.VITE_FARM_LNG) || 78.1198,
  name: import.meta.env.VITE_FARM_NAME || 'Farm2Home',
};

export const DEFAULT_MAP_CENTER = {
  lat: FARM_LOCATION.lat,
  lng: FARM_LOCATION.lng,
};

export const DEFAULT_MAP_ZOOM = 13;

export function hasGooglePlaces() {
  return !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
}

/** Google Places needs billing — off by default; use free OSM search instead */
export function useGooglePlaces() {
  return import.meta.env.VITE_USE_GOOGLE_PLACES === 'true' && hasGooglePlaces();
}
