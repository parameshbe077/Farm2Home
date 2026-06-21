const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
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

export function placeOrder(items, customer = {}) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify({ items, customer }),
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
