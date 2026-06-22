const API_BASE = '/api/admin';

async function adminRequest(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export function fetchAdminProducts(token) {
  return adminRequest('/products', token);
}

export function createAdminProduct(token, product) {
  return adminRequest('/products', token, {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export function updateAdminProduct(token, id, product) {
  return adminRequest(`/products/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function uploadAdminProductImage(token, id, file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/products/${id}/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Photo upload failed');
  }

  return data;
}

export function deleteAdminProduct(token, id) {
  return adminRequest(`/products/${id}`, token, { method: 'DELETE' });
}

export function fetchAdminOrders(token) {
  return adminRequest('/orders', token);
}

export function fetchAdminContactMessages(token) {
  return adminRequest('/contact-messages', token);
}

export function updateOrderStatus(token, id, status) {
  return adminRequest(`/orders/${id}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
