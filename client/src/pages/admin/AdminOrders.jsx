import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { fetchAdminOrders, updateOrderStatus } from '../../api/adminApi';
import DeliveryTrackingMap from '../../components/maps/DeliveryTrackingMap';
import ProductImage from '../../components/ProductImage';
import { formatPrice } from '../../utils/formatPrice';

const STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { getToken } = useAdminAuth();
  const [searchParams] = useSearchParams();
  const focusOrderId = searchParams.get('order');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const scrolledToRef = useRef(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const data = await fetchAdminOrders(token);
      setOrders([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    if (!focusOrderId || loading) return;
    if (!orders.some((o) => o.id === focusOrderId)) return;
    if (scrolledToRef.current === focusOrderId) return;

    scrolledToRef.current = focusOrderId;
    const el = document.getElementById(`order-${focusOrderId}`);
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlightId(focusOrderId);
    });

    const timer = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(timer);
  }, [focusOrderId, loading, orders]);

  useEffect(() => {
    scrolledToRef.current = null;
  }, [focusOrderId]);

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
            <article
              id={`order-${order.id}`}
              className={`admin-order-card${highlightId === order.id ? ' admin-order-card--highlight' : ''}`}
              key={order.id}
            >
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
                    <span className="admin-order-item__name">
                      <span className="admin-order-item__thumb">
                        <ProductImage product={item} variant="thumb" />
                      </span>
                      {item.name}
                    </span>
                    <span>{item.qty} × {formatPrice(item.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="admin-order-card__footer">
                <span className="admin-order-card__payment">💵 Cash on Delivery</span>
                <div className="admin-order-card__total">
                  <span>Total</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
