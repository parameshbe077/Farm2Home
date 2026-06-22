import { useCallback, useState } from 'react';
import AddressSearch from './AddressSearch';
import OsmAddressSearch from './OsmAddressSearch';
import OsmMap from './OsmMap';
import { geocodeAddress, reverseGeocodeAddress } from '../../api/api';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, useGooglePlaces } from '../../constants/location';
import { parseGooglePlace } from '../../utils/parseAddress';

export default function DeliveryAddressPicker({ value, onChange, disabled }) {
  const googlePlaces = useGooglePlaces();
  const [searchText, setSearchText] = useState(value.address || '');
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');

  const hasPin = value.lat != null && value.lng != null;
  const mapCenter = hasPin
    ? { lat: value.lat, lng: value.lng }
    : DEFAULT_MAP_CENTER;

  const applyLocation = useCallback((parsed) => {
    if (!parsed) return;
    onChange({
      ...value,
      address: parsed.address || parsed.label || value.address,
      area: parsed.area || value.area,
      pincode: parsed.pincode || value.pincode,
      lat: parsed.lat,
      lng: parsed.lng,
    });
    if (parsed.address || parsed.label) {
      setSearchText(parsed.address || parsed.label);
    }
  }, [onChange, value]);

  const handlePlaceSelect = (place) => {
    const parsed = parseGooglePlace(place);
    applyLocation(parsed);
  };

  const handleMarkerDrag = async ({ lat, lng }) => {
    setGeocoding(true);
    try {
      const parsed = await reverseGeocodeAddress(lat, lng);
      applyLocation({ ...parsed, lat, lng });
    } catch {
      onChange({ ...value, lat, lng });
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapClick = async ({ lat, lng }) => {
    setGeocoding(true);
    try {
      const parsed = await reverseGeocodeAddress(lat, lng);
      applyLocation({ ...parsed, lat, lng });
    } catch {
      onChange({ ...value, lat, lng });
    } finally {
      setGeocoding(false);
    }
  };

  const handleLocateOnMap = async () => {
    const query = [value.address, value.area, value.pincode].filter(Boolean).join(', ');
    if (!query.trim()) return;

    setGeocoding(true);
    setGeoError('');
    try {
      const parsed = await geocodeAddress(query);
      applyLocation(parsed);
    } catch (err) {
      setGeoError(err.message || 'Could not locate that address on the map.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Current location is not supported on this device/browser.');
      return;
    }

    setGeocoding(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const parsed = await reverseGeocodeAddress(coords.latitude, coords.longitude);
          applyLocation({ ...parsed, lat: coords.latitude, lng: coords.longitude });
        } catch (err) {
          setGeoError(err.message || 'Could not fetch address for your current location.');
          onChange({ ...value, lat: coords.latitude, lng: coords.longitude });
        } finally {
          setGeocoding(false);
        }
      },
      (error) => {
        if (error.code === 1) {
          setGeoError('Location permission denied. Allow location in browser settings.');
        } else if (error.code === 2) {
          setGeoError('Location unavailable. Check GPS/network and try again.');
        } else if (error.code === 3) {
          setGeoError('Location request timed out. Try again.');
        } else {
          setGeoError('Could not get current location.');
        }
        setGeocoding(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleOsmSelect = (item) => {
    applyLocation(item);
  };

  return (
    <div className="delivery-address-picker">
      <div className="form-group">
        <label htmlFor="checkout-address-search">
          Search delivery address
          <span className="form-hint-inline">
            {googlePlaces ? ' — Google Places' : ' — OpenStreetMap (free)'}
          </span>
        </label>
        {googlePlaces ? (
          <AddressSearch
            id="checkout-address-search"
            value={searchText}
            onChange={setSearchText}
            onPlaceSelect={handlePlaceSelect}
            placeholder="Start typing your address…"
            disabled={disabled}
          />
        ) : (
          <OsmAddressSearch
            id="checkout-address-search"
            value={searchText}
            onChange={setSearchText}
            onSelect={handleOsmSelect}
            placeholder="Type area, street, or landmark in Madurai…"
            disabled={disabled}
          />
        )}
      </div>
      <div className="delivery-address-picker__map-wrap">
        <OsmMap
          center={mapCenter}
          zoom={hasPin ? 16 : DEFAULT_MAP_ZOOM}
          markers={hasPin ? [{ id: 'delivery', lat: value.lat, lng: value.lng, label: 'Delivery location', draggable: true }] : []}
          draggableMarker={hasPin}
          onMarkerDragEnd={handleMarkerDrag}
          onMapClick={handleMapClick}
          height={200}
        />
        <p className="delivery-address-picker__map-hint">
          {geocoding
            ? 'Updating location…'
            : hasPin
              ? 'Drag the pin or tap the map to adjust. Map: OpenStreetMap.'
              : 'Search above or tap the map to set your delivery pin.'}
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="checkout-address">Delivery address</label>
        <textarea
          id="checkout-address"
          rows={2}
          placeholder="House no., street, landmark"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          autoComplete="street-address"
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor="checkout-area">Area / city</label>
        <input
          id="checkout-area"
          type="text"
          placeholder="e.g. Madurai"
          value={value.area}
          onChange={(e) => onChange({ ...value, area: e.target.value })}
          autoComplete="address-level2"
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor="checkout-pincode">Pincode</label>
        <input
          id="checkout-pincode"
          type="text"
          inputMode="numeric"
          placeholder="6-digit pincode"
          maxLength={6}
          value={value.pincode}
          onChange={(e) => onChange({ ...value, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
          autoComplete="postal-code"
          disabled={disabled}
        />
      </div>
      <div className="delivery-address-picker__actions">
        <button
          type="button"
          className="btn btn--outline btn--sm delivery-address-picker__locate"
          onClick={handleUseCurrentLocation}
          disabled={disabled || geocoding}
        >
          {geocoding ? 'Locating…' : 'Use current location'}
        </button>
        <button
          type="button"
          className="btn btn--outline btn--sm delivery-address-picker__locate"
          onClick={handleLocateOnMap}
          disabled={disabled || geocoding || !value.address.trim()}
        >
          {geocoding ? 'Locating…' : 'Locate typed address'}
        </button>
      </div>
      {geoError && <p className="delivery-address-picker__error">{geoError}</p>}
    </div>
  );
}
