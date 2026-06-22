export function parseAddressComponents(components = []) {
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

export function parseGooglePlace(place) {
  if (!place?.geometry?.location) return null;

  const { area, pincode } = parseAddressComponents(place.address_components);
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const address = place.formatted_address || place.name || '';

  return { address, area, pincode, lat, lng };
}

export function parseGeocodeResult(result) {
  if (!result?.geometry?.location) return null;

  const { area, pincode } = parseAddressComponents(result.address_components);
  const lat = result.geometry.location.lat;
  const lng = result.geometry.location.lng;

  return {
    address: result.formatted_address || '',
    area,
    pincode,
    lat: typeof lat === 'function' ? lat() : lat,
    lng: typeof lng === 'function' ? lng() : lng,
  };
}
