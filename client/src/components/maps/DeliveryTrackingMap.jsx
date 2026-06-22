import { useEffect, useState } from 'react';
import OsmMap from './OsmMap';
import { FARM_LOCATION } from '../../constants/location';
import { geocodeAddress } from '../../api/api';

export default function DeliveryTrackingMap({ customer, status, height = 260 }) {
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const savedLat = customer?.lat != null ? Number(customer.lat) : null;
  const savedLng = customer?.lng != null ? Number(customer.lng) : null;
  const hasSavedCoords = savedLat != null && savedLng != null && !Number.isNaN(savedLat) && !Number.isNaN(savedLng);

  useEffect(() => {
    if (hasSavedCoords) {
      setDestination({ lat: savedLat, lng: savedLng });
      setError('');
      return;
    }

    const query = [customer?.address, customer?.area, customer?.pincode].filter(Boolean).join(', ');
    if (!query.trim()) {
      setDestination(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    geocodeAddress(query)
      .then((result) => {
        if (!cancelled) {
          setDestination({ lat: result.lat, lng: result.lng });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDestination(null);
          setError(err.message || 'Could not show map for this address');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customer?.address, customer?.area, customer?.pincode, hasSavedCoords, savedLat, savedLng]);

  if (!customer?.address && !hasSavedCoords) {
    return null;
  }

  const statusLabel =
    status === 'delivered'
      ? 'Delivered to this location'
      : status === 'confirmed'
        ? 'Out for delivery — heading to you'
        : 'Delivery destination';

  return (
    <div className="delivery-tracking-map">
      <div className="delivery-tracking-map__header">
        <h3>Delivery route</h3>
        <span className="delivery-tracking-map__badge">OpenStreetMap</span>
      </div>
      {loading && <p className="delivery-tracking-map__status">Loading map…</p>}
      {error && !loading && <p className="delivery-tracking-map__status delivery-tracking-map__status--error">{error}</p>}
      {destination && !loading && (
        <>
          <OsmMap
            markers={[
              { id: 'farm', lat: FARM_LOCATION.lat, lng: FARM_LOCATION.lng, label: FARM_LOCATION.name, variant: 'farm' },
              { id: 'delivery', lat: destination.lat, lng: destination.lng, label: statusLabel },
            ]}
            lines={[
              {
                id: 'route',
                points: [
                  { lat: FARM_LOCATION.lat, lng: FARM_LOCATION.lng },
                  { lat: destination.lat, lng: destination.lng },
                ],
              },
            ]}
            fitBounds
            height={height}
          />
          <p className="delivery-tracking-map__legend">
            <span>🌾 {FARM_LOCATION.name}</span>
            <span>📍 {statusLabel}</span>
          </p>
        </>
      )}
    </div>
  );
}
