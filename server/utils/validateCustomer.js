export function validateCustomer(customer) {
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

  return {
    data: { name, phone, address, area, pincode },
  };
}
