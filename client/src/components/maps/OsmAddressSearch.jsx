import { useEffect, useRef, useState } from 'react';
import { searchAddresses } from '../../api/api';

export default function OsmAddressSearch({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const results = await searchAddresses(value);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch (err) {
        setSuggestions([]);
        setOpen(false);
        setError(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pickSuggestion = (item) => {
    onSelect(item);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="osm-address-search" ref={wrapRef}>
      <input
        id={id}
        type="text"
        className="address-search__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
        disabled={disabled}
      />
      {loading && <p className="osm-address-search__hint">Searching…</p>}
      {error && <p className="address-search__error" role="alert">{error}</p>}
      {open && suggestions.length > 0 && (
        <ul className="osm-address-search__list" role="listbox">
          {suggestions.map((item) => (
            <li key={`${item.lat}-${item.lng}-${item.label}`}>
              <button
                type="button"
                className="osm-address-search__option"
                onClick={() => pickSuggestion(item)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
