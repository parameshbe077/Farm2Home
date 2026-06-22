const USER_AGENT = 'Farm2Home/1.0 (contact: farm2homesouth@gmail.com)';

async function nominatimFetch(path, params) {
  const url = new URL(`https://nominatim.openstreetmap.org${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('OpenStreetMap geocoding request failed');
  }

  return res.json();
}

function parseNominatimAddress(addr = {}) {
  const area =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.suburb ||
    addr.county ||
    addr.state_district ||
    '';

  const pincode = String(addr.postcode || '').replace(/\D/g, '').slice(0, 6);

  const street = [addr.house_number, addr.road, addr.neighbourhood]
    .filter(Boolean)
    .join(', ');

  return { area, pincode, street };
}

function toLocation(item) {
  const { area, pincode, street } = parseNominatimAddress(item.address);
  const displayName = item.display_name || '';
  const address = street || displayName.split(',')[0] || displayName;

  return {
    address: displayName || address,
    area,
    pincode,
    lat: Number(item.lat),
    lng: Number(item.lon),
    label: displayName || address,
  };
}

export async function searchAddresses(query) {
  const trimmed = query?.trim();
  if (!trimmed || trimmed.length < 3) {
    return { data: [] };
  }

  try {
    const results = await nominatimFetch('/search', {
      q: trimmed,
      format: 'json',
      addressdetails: 1,
      countrycodes: 'in',
      limit: 6,
    });

    if (!Array.isArray(results)) {
      return { error: 'Invalid search response' };
    }

    return { data: results.map(toLocation) };
  } catch {
    return { error: 'Address search failed' };
  }
}

export async function geocodeAddress(address) {
  const result = await searchAddresses(address);
  if (result.error) return result;
  if (!result.data.length) return { error: 'Address not found' };
  return { data: result.data[0] };
}

export async function reverseGeocode(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: 'Invalid coordinates' };
  }

  try {
    const item = await nominatimFetch('/reverse', {
      lat: latitude,
      lon: longitude,
      format: 'json',
      addressdetails: 1,
    });

    if (!item?.lat) {
      return { error: 'Address not found for this location' };
    }

    return { data: toLocation(item) };
  } catch {
    return { error: 'Reverse geocoding failed' };
  }
}
