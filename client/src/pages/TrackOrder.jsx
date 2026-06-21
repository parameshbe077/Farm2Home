import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageBanner from '../components/PageBanner';
import { trackOrder as fetchOrder } from '../api/api';
import { formatPrice } from '../utils/formatPrice';
import {
  addTrackHistory,
  getLatestTrack,
  loadTrackHistory,
} from '../utils/trackOrderStorage';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order placed', desc: 'We received your order' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Order accepted and being prepared' },
  { key: 'delivered', label: 'Delivered', desc: 'Order delivered successfully' },
];

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

function getStepIndex(status) {
  if (status === 'cancelled') return -1;
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function trackKey(orderRef, phone) {
  return `${orderRef.trim().toUpperCase()}|${phone.trim()}`;
}

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderRef, setOrderRef] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(loadTrackHistory);
  const activeKeyRef = useRef('');

  const refreshHistory = () => setHistory(loadTrackHistory());

  const lookupOrder = useCallback(async (ref, ph, { updateUrl = true, force = false } = {}) => {
    const trimmedRef = ref.trim().toUpperCase();
    const trimmedPhone = ph.trim();
    const key = trackKey(trimmedRef, trimmedPhone);

    if (!trimmedRef || !trimmedPhone) return;

    if (!force && activeKeyRef.current === key) return;

    activeKeyRef.current = key;
    setLoading(true);
    setError('');
    setOrder(null);
    setOrderRef(trimmedRef);
    setPhone(trimmedPhone);

    try {
      const result = await fetchOrder(trimmedRef, trimmedPhone);
      setOrder(result);
      addTrackHistory(trimmedRef, trimmedPhone);
      refreshHistory();
      if (updateUrl) {
        setSearchParams({ order: trimmedRef, phone: trimmedPhone }, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Order not found');
      activeKeyRef.current = '';
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    let ref = searchParams.get('order')?.trim();
    let ph = searchParams.get('phone')?.trim();

    if (!ref || !ph) {
      const latest = getLatestTrack();
      if (!latest) return;
      setSearchParams(
        { order: latest.orderRef, phone: latest.phone },
        { replace: true },
      );
      return;
    }

    const key = trackKey(ref, ph);
    if (activeKeyRef.current === key) return;

    lookupOrder(ref, ph, { updateUrl: false, force: true });
  }, [searchParams, setSearchParams, lookupOrder]);

  const handleTrack = (e) => {
    e.preventDefault();
    lookupOrder(orderRef, phone, { force: true });
  };

  const selectHistoryOrder = (entry) => {
    activeKeyRef.current = '';
    setSearchParams(
      { order: entry.orderRef, phone: entry.phone },
      { replace: true },
    );
  };

  const stepIndex = order ? getStepIndex(order.status) : 0;
  const activeKey = order ? trackKey(order.orderNumber || orderRef, phone) : '';

  return (
    <div className="page">
      <PageBanner
        label="Orders"
        title="Track Your Order"
        subtitle="Enter your order number and phone to see delivery status."
      />
      <div className="container">
        <div className="track-order">
          {history.length > 0 && (
            <div className="track-order__history">
              <h3>Your recent orders</h3>
              <div className="track-order__history-list">
                {history.map((entry) => {
                  const isActive = trackKey(entry.orderRef, entry.phone) === activeKey;
                  return (
                    <button
                      key={`${entry.orderRef}-${entry.savedAt}`}
                      type="button"
                      className={`track-order__history-item${isActive ? ' track-order__history-item--active' : ''}`}
                      onClick={() => selectHistoryOrder(entry)}
                    >
                      <strong>#{entry.orderRef}</strong>
                      <span>{entry.phone}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form className="track-order__form" onSubmit={handleTrack}>
            <div className="form-group">
              <label htmlFor="orderRef">Order number</label>
              <input
                id="orderRef"
                type="text"
                placeholder="e.g. A1B2C3 (last 6 characters)"
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value.toUpperCase())}
                required
              />
              <small className="form-hint">Shown after checkout — last 6 characters of your order ID.</small>
            </div>
            <div className="form-group">
              <label htmlFor="track-phone">Phone number</label>
              <input
                id="track-phone"
                type="tel"
                placeholder="10-digit mobile used at checkout"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Looking up…' : 'Track order'}
            </button>
            {error && <p className="track-order__error">{error}</p>}
          </form>

          {order && (
            <div className="track-order__result">
              <div className="track-order__header">
                <div>
                  <h2>Order #{order.orderNumber}</h2>
                  <p>Placed on {formatDate(order.createdAt)}</p>
                </div>
                <span className={`track-order__status track-order__status--${order.status}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              {order.status === 'cancelled' ? (
                <p className="track-order__cancelled">This order was cancelled. Contact us if you need help.</p>
              ) : (
                <ol className="track-order__timeline">
                  {STATUS_STEPS.map((step, i) => (
                    <li
                      key={step.key}
                      className={`track-order__step${i <= stepIndex ? ' track-order__step--done' : ''}${i === stepIndex ? ' track-order__step--current' : ''}`}
                    >
                      <strong>{step.label}</strong>
                      <span>{step.desc}</span>
                    </li>
                  ))}
                </ol>
              )}

              <ul className="track-order__items">
                {order.items?.map((item) => (
                  <li key={`${item.id}-${item.name}`}>
                    <span>{item.emoji} {item.name}</span>
                    <span>{item.qty} × {formatPrice(item.price)}</span>
                  </li>
                ))}
              </ul>

              <div className="track-order__total">
                <span>Total</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>

              {(order.customer?.address || order.customer?.area) && (
                <p className="track-order__address">
                  📍 Deliver to: {[order.customer.address, order.customer.area, order.customer.pincode].filter(Boolean).join(', ')}
                </p>
              )}

              <Link to="/products" className="btn btn--outline btn--full">Order again</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
