import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageBanner from '../components/PageBanner';
import ProductImage from '../components/ProductImage';
import ProtectedCustomerRoute from '../components/ProtectedCustomerRoute';
import { fetchMyOrders } from '../api/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { formatPrice } from '../utils/formatPrice';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function MyOrdersContent() {
  const { getToken, user } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders(attempt = 0) {
      setLoading(true);
      setError('');
      try {
        const token = await getToken(attempt > 0);
        if (!token) {
          throw new Error('Please sign in to continue');
        }
        const data = await fetchMyOrders(token);
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (!cancelled) return loadOrders(1);
          return;
        }
        setError(err.message || 'Could not load your orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => { cancelled = true; };
  }, [getToken, user?.uid, reloadKey]);

  return (
    <div className="page">
      <PageBanner
        label="Your account"
        title="My Orders"
        subtitle={user?.email ? `Signed in as ${user.email}` : 'Your order history'}
      />
      <div className="container">
        {loading && (
          <div className="my-orders-state">
            <p className="my-orders-state__text">Loading your orders…</p>
          </div>
        )}
        {error && (
          <div className="my-orders-state my-orders-state--error">
            <p className="my-orders-state__text">{error}</p>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="my-orders-empty-wrap">
            <div className="my-orders-empty">
              <div className="my-orders-empty__icon" aria-hidden>📦</div>
              <h2 className="my-orders-empty__title">No orders yet</h2>
              <p className="my-orders-empty__text">
                Fresh farm produce is waiting for you. Browse our catalog and your orders will appear here.
              </p>
              <div className="my-orders-empty__actions">
                <Link to="/products" className="btn btn--primary">Start shopping</Link>
                <Link to="/track-order" className="btn btn--outline">Track an order</Link>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="my-orders-list">
            {orders.map((order) => (
              <article className="my-order-card" key={order.id}>
                <div className="my-order-card__header">
                  <div>
                    <strong>Order #{order.orderNumber}</strong>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <span className={`my-order-card__status my-order-card__status--${order.status}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <ul className="my-order-card__items">
                  {order.items?.map((item) => (
                    <li key={`${order.id}-${item.id}-${item.name}`}>
                      <span className="my-order-card__item-name">
                        <span className="my-order-card__thumb">
                          <ProductImage product={item} variant="thumb" />
                        </span>
                        {item.name}
                      </span>
                      <span>{item.qty} × {formatPrice(item.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="my-order-card__footer">
                  <span>Total · Cash on Delivery</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
                {(order.customer?.address || order.customer?.area) && (
                  <p className="my-order-card__address">
                    📍 {[order.customer.address, order.customer.area, order.customer.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
                <Link
                  to={`/track-order?order=${order.orderNumber}&phone=${encodeURIComponent(order.customer?.phone || '')}`}
                  className="btn btn--outline btn--sm"
                >
                  Track this order
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyOrders() {
  return (
    <ProtectedCustomerRoute>
      <MyOrdersContent />
    </ProtectedCustomerRoute>
  );
}
