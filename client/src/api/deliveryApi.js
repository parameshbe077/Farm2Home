import { getApiRoot } from './apiConfig.js';

function deliveryBase() {
  const root = getApiRoot();
  return root ? `${root}/api/delivery` : '/api/delivery';
}

async function deliveryRequest(path, token, options = {}) {
  const res = await fetch(`${deliveryBase()}${path}`, {
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

export function fetchDeliveryOrders(token) {
  return deliveryRequest('/orders', token);
}

export function updateDeliveryStatus(token, id, status) {
  return deliveryRequest(`/orders/${id}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
