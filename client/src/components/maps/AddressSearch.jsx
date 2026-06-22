import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/loadGoogleMaps';
import { hasGooglePlaces } from '../../constants/location';

export default function AddressSearch({ id, value, onChange, onPlaceSelect, placeholder, disabled }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!hasGooglePlaces() || !inputRef.current) return undefined;

    let cancelled = false;
    setLoadError('');

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !inputRef.current) return;

        const autocomplete = new maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'in' },
          fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place && onPlaceSelect) {
            onPlaceSelect(place);
          }
        });

        autocompleteRef.current = autocomplete;
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err.message || 'Address search could not load. Enable Maps JavaScript API + Places API in Google Cloud.',
          );
        }
      });

    return () => {
      cancelled = true;
      autocompleteRef.current = null;
    };
  }, [onPlaceSelect]);

  return (
    <div className="address-search">
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="address-search__input"
        placeholder={loadError ? 'Type address manually below…' : placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        disabled={disabled}
      />
      {loadError && (
        <p className="address-search__error" role="alert">
          {loadError}
        </p>
      )}
    </div>
  );
}
