export function deliveryDirectionsUrl(customer) {
  if (!customer) return '';

  const lat = customer.lat != null ? Number(customer.lat) : null;
  const lng = customer.lng != null ? Number(customer.lng) : null;
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const address = [customer.address, customer.area, customer.pincode].filter(Boolean).join(', ');
  const destination = hasCoords ? `${lat},${lng}` : address;
  if (!destination) return '';

  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'driving',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
