export function validateCustomer(customer) {
  const allowedPincodes = (process.env.DELIVERY_PINCODES || '509208')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);

  const name = customer?.name?.trim();
  const phone = customer?.phone?.trim();
  const address = customer?.address?.trim();
  const area = customer?.area?.trim();
  const pincode = customer?.pincode?.trim()?.replace(/\D/g, '') || '';
  const phoneDigits = phone?.replace(/\D/g, '') || '';

  if (!name) return { error: 'Name is required' };
  if (phoneDigits.length < 10) {
    return { error: 'Enter a valid 10-digit phone number' };
  }
  if (!address) return { error: 'Delivery address is required' };
  if (!area) return { error: 'Area / city is required' };
  if (pincode.length !== 6) return { error: 'Enter a valid 6-digit pincode' };
  if (!allowedPincodes.includes(pincode)) {
    return { error: `Sorry, delivery is available only for pincode ${allowedPincodes.join(', ')}` };
  }

  let lat = customer?.lat != null ? Number(customer.lat) : null;
  let lng = customer?.lng != null ? Number(customer.lng) : null;
  if (lat != null && (Number.isNaN(lat) || lat < -90 || lat > 90)) lat = null;
  if (lng != null && (Number.isNaN(lng) || lng < -180 || lng > 180)) lng = null;

  const data = { name, phone, address, area, pincode };
  if (lat != null && lng != null) {
    data.lat = lat;
    data.lng = lng;
  }

  return { data };
}
