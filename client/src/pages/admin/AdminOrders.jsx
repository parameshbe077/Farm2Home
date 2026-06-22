import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { fetchAdminOrders, updateOrderStatus } from '../../api/adminApi';
import DeliveryTrackingMap from '../../components/maps/DeliveryTrackingMap';
import { formatPrice } from '../../utils/formatPrice';

const STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { getToken } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      setOrders(await fetchAdminOrders(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const token = await getToken();
      const updated = await updateOrderStatus(token, orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Orders</h1>
        <p>{orders.length} total orders</p>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-empty">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="admin-empty">No orders yet.</p>
      ) : (
        <div className="admin-orders">
          {orders.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <div className="admin-order-card__header">
                <div>
                  <strong>Order #{order.id.slice(-6).toUpperCase()}</strong>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <select
                  className={`admin-status admin-status--${order.status}`}
                  value={order.status}
                  disabled={updating === order.id}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {(order.customer?.name || order.customer?.phone) && (
                <div className="admin-order-card__customer">
                  {order.customer.name && <span>👤 {order.customer.name}</span>}
                  {order.customer.phone && (
                    <a href={`tel:${order.customer.phone.replace(/\D/g, '')}`} className="admin-order-card__phone">
                      📞 {order.customer.phone}
                    </a>
                  )}
                </div>
              )}
              {(order.customer?.address || order.customer?.area || order.customer?.pincode) && (
                <p className="admin-order-card__address">
                  📍 {[order.customer.address, order.customer.area, order.customer.pincode].filter(Boolean).join(', ')}
                </p>
              )}
              <DeliveryTrackingMap customer={order.customer} status={order.status} height={180} />
              <ul className="admin-order-card__items">
                {order.items?.map((item) => (
                  <li key={item.id}>
                    <span>{item.emoji} {item.name}</span>
                    <span>{item.qty} × {formatPrice(item.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="admin-order-card__footer">
                <span>Total</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
