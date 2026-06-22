import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const deliveryIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const farmIcon = new L.DivIcon({
  className: 'osm-map__farm-marker',
  html: '<span aria-hidden="true">🌾</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points?.length) return;
    if (points.length === 1) {
      map.setView(points[0], map.getZoom());
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 15 });
  }, [map, points]);

  return null;
}

function MapClickHandler({ onClick }) {
  const map = useMap();

  useEffect(() => {
    if (!onClick) return undefined;

    const handler = (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onClick]);

  return null;
}

export default function OsmMap({
  center,
  zoom = 15,
  markers = [],
  lines = [],
  height = 220,
  className = '',
  draggableMarker = false,
  onMarkerDragEnd,
  onMapClick,
  fitBounds = false,
}) {
  const centerPoint = center ? [center.lat, center.lng] : null;
  const boundsPoints = markers.map((m) => [m.lat, m.lng]);

  if (!centerPoint && !boundsPoints.length) {
    return null;
  }

  const mapCenter = centerPoint || boundsPoints[0];

  return (
    <div className={`osm-map ${className}`.trim()} style={{ height }}>
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={false} className="osm-map__canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitBounds && boundsPoints.length > 0 && <FitBounds points={boundsPoints} />}
        {onMapClick && <MapClickHandler onClick={onMapClick} />}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={marker.variant === 'farm' ? farmIcon : deliveryIcon}
            draggable={draggableMarker && marker.draggable !== false}
            eventHandlers={
              draggableMarker && marker.draggable !== false && onMarkerDragEnd
                ? {
                    dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng();
                      onMarkerDragEnd({ lat, lng });
                    },
                  }
                : undefined
            }
          >
            {marker.label && <Popup>{marker.label}</Popup>}
          </Marker>
        ))}
        {lines.map((line) => (
          <Polyline
            key={line.id}
            positions={line.points.map((p) => [p.lat, p.lng])}
            pathOptions={line.pathOptions || { color: '#2d6a4f', weight: 3, dashArray: '8 8' }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
