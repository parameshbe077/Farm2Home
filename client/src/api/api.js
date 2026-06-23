const API_BASE = '/api';

async function request(path, options = {}) {
  const { headers: optionHeaders, ...rest } = options;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...optionHeaders,
      },
    });
  } catch {
    throw new Error('Could not reach the server. Make sure the app is running and try again.');
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    throw new Error(
      data.error
      || data.message
      || (res.status === 502 || res.status === 503
        ? 'Server is restarting. Please try again in a moment.'
        : `Request failed (${res.status})`)
    );
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

export function placeOrder(items, customer, token, clientOrderId) {
  return authRequest('/orders', token, {
    method: 'POST',
    body: JSON.stringify({ items, customer, clientOrderId }),
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
