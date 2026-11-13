import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchDeliveryOrders, updateDeliveryStatus } from '../../api/deliveryApi';
import { useDeliveryAuth } from '../../context/DeliveryAuthContext';
import { deliveryDirectionsUrl } from '../../utils/deliveryDirections';
import { formatPrice } from '../../utils/formatPrice';

function formatWhen(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DeliveryOrders() {
  const { user, isDelivery, loading: authLoading, getToken, logout } = useDeliveryAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Please sign in again');
      setOrders(await fetchDeliveryOrders(token));
    } catch (err) {
      setError(err.message || 'Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isDelivery) return;
    loadOrders();
  }, [authLoading, isDelivery]);

  if (authLoading) {
    return <div className="admin-loading"><p>Loading…</p></div>;
  }

  if (!user || !isDelivery) {
    return <Navigate to="/delivery/login" replace />;
  }

  const setStatus = async (order, status) => {
    setUpdatingId(order.id);
    setError('');
    try {
      const token = await getToken();
      await updateDeliveryStatus(token, order.id, status);
      setOrders((current) => current.filter((entry) => entry.id !== order.id || status !== 'delivered')
        .map((entry) => (entry.id === order.id ? { ...entry, status } : entry)));
    } catch (err) {
      setError(err.message || 'Could not update this order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="delivery-app">
      <header className="delivery-app__bar">
        <div>
          <strong>Deliveries</strong>
          <span>{user.email}</span>
        </div>
        <button type="button" className="admin-btn admin-btn--outline admin-btn--sm" onClick={() => logout()}>
          Sign out
        </button>
      </header>

      <main className="delivery-app__main">
        {error && <p className="admin-error">{error}</p>}
        {loading && <p className="admin-empty">Loading orders…</p>}
        {!loading && orders.length === 0 && (
          <p className="admin-empty">No orders waiting for delivery.</p>
        )}
        <div className="delivery-list">
          {orders.map((order) => {
            const directions = deliveryDirectionsUrl(order.customer);
            const address = [order.customer.address, order.customer.area, order.customer.pincode].filter(Boolean).join(', ');
            const phone = order.customer.phone?.replace(/\D/g, '');
            const busy = updatingId === order.id;
            return (
              <article className="delivery-card" key={order.id}>
                <div className="delivery-card__top">
                  <div>
                    <strong>Order #{order.orderNumber}</strong>
                    <span>{formatWhen(order.createdAt)}</span>
                  </div>
                  <span className={`delivery-card__status delivery-card__status--${order.status}`}>
                    {order.status === 'confirmed' ? 'Picked up' : 'New'}
                  </span>
                </div>
                <p className="delivery-card__name">{order.customer.name || 'Customer'}</p>
                {phone && (
                  <a className="delivery-card__phone" href={`tel:${phone}`}>
                    Call {order.customer.phone}
                  </a>
                )}
                {address && <p className="delivery-card__address">{address}</p>}
                {order.note && <p className="delivery-card__note">Note: {order.note}</p>}
                <ul className="delivery-card__items">
                  {(order.items || []).map((item) => (
                    <li key={`${order.id}-${item.name}-${item.qty}`}>
                      <span>{item.name}</span>
                      <span>× {item.qty}</span>
                    </li>
                  ))}
                </ul>
                <p className="delivery-card__total">Cash on delivery · {formatPrice(order.total)}</p>
                {directions && (
                  <a className="admin-btn admin-btn--primary admin-btn--full" href={directions} target="_blank" rel="noopener noreferrer">
                    Navigate to customer
                  </a>
                )}
                <div className="delivery-card__actions">
                  {order.status === 'pending' && (
                    <button type="button" className="admin-btn admin-btn--outline" disabled={busy} onClick={() => setStatus(order, 'confirmed')}>
                      {busy ? 'Saving…' : 'Mark picked up'}
                    </button>
                  )}
                  <button type="button" className="admin-btn admin-btn--outline" disabled={busy} onClick={() => setStatus(order, 'delivered')}>
                    {busy ? 'Saving…' : 'Mark delivered'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
