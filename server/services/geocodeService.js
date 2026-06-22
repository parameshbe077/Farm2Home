import * as nominatim from './nominatimService.js';

function getApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || '';
}

function parseAddressComponents(components = []) {
  const get = (type) => components.find((c) => c.types?.includes(type))?.long_name || '';

  const pincode = get('postal_code').replace(/\D/g, '').slice(0, 6);
  const area =
    get('locality') ||
    get('administrative_area_level_2') ||
    get('sublocality_level_1') ||
    get('sublocality') ||
    '';

  return { area, pincode };
}

function parseGoogleResult(result) {
  if (!result?.geometry?.location) return null;

  const { lat, lng } = result.geometry.location;
  const { area, pincode } = parseAddressComponents(result.address_components);

  return {
    address: result.formatted_address || '',
    area,
    pincode,
    lat,
    lng,
  };
}

async function callGoogleGeocode(params) {
  const key = getApiKey();
  if (!key) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('key', key);
  url.searchParams.set('region', 'in');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    return null;
  }

  return parseGoogleResult(data.results[0]);
}

export async function geocodeAddress(address) {
  const trimmed = address?.trim();
  if (!trimmed) {
    return { error: 'Address is required' };
  }

  const google = await callGoogleGeocode({ address: trimmed });
  if (google) return { data: google };

  return nominatim.geocodeAddress(trimmed);
}

export async function reverseGeocode(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: 'Invalid coordinates' };
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { error: 'Invalid coordinates' };
  }

  const google = await callGoogleGeocode({ latlng: `${latitude},${longitude}` });
  if (google) return { data: google };

  return nominatim.reverseGeocode(latitude, longitude);
}

export async function searchAddresses(query) {
  return nominatim.searchAddresses(query);
}

export function isGeocodeConfigured() {
  return true;
}

export function isGoogleGeocodeConfigured() {
  return !!getApiKey();
}
