const API_BASE = '/api';

async function request(path, options = {}) {
  const { headers: optionHeaders, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...optionHeaders,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

async function authRequest(path, token, options = {}) {
  if (!token) throw new Error('Please sign in to continue');
  const { headers: optionHeaders, ...rest } = options;
  return request(path, {
    ...rest,
    headers: {
      ...optionHeaders,
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.featured) query.set('featured', 'true');
  const qs = query.toString();
  return request(`/products${qs ? `?${qs}` : ''}`);
}

export function fetchProduct(id) {
  return request(`/products/${id}`);
}

export function placeOrder(items, customer, token) {
  return authRequest('/orders', token, {
    method: 'POST',
    body: JSON.stringify({ items, customer }),
  });
}

export function fetchMyProfile(token) {
  return authRequest('/customers/me', token);
}

export function fetchMyOrders(token) {
  return authRequest('/customers/me/orders', token);
}

export function updateMyProfile(token, profile) {
  return authRequest('/customers/me', token, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export function trackOrder(orderRef, phone) {
  return request('/orders/track', {
    method: 'POST',
    body: JSON.stringify({ orderRef, phone }),
  });
}

export function sendContact(form) {
  return request('/contact', {
    method: 'POST',
    body: JSON.stringify(form),
  });
}

export function geocodeAddress(address) {
  const query = new URLSearchParams({ address });
  return request(`/geocode?${query.toString()}`);
}

export function reverseGeocodeAddress(lat, lng) {
  const query = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  return request(`/geocode/reverse?${query.toString()}`);
}

export function searchAddresses(query) {
  const params = new URLSearchParams({ q: query });
  return request(`/geocode/search?${params.toString()}`);
}
