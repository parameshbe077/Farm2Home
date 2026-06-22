import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { fetchAdminProducts, fetchAdminOrders } from '../../api/adminApi';
import { formatPrice } from '../../utils/formatPrice';

const RECENT_LIMIT = 8;

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function sortOrdersRecent(orders) {
  return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function itemSummary(items) {
  if (!items?.length) return 'No items';
  const names = items.slice(0, 2).map((i) => i.name).join(', ');
  if (items.length > 2) return `${items.length} items · ${names}…`;
  return `${items.length} item${items.length > 1 ? 's' : ''} · ${names}`;
}

export default function AdminDashboard() {
  const { getToken } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0, orders: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const [products, orders] = await Promise.all([
          fetchAdminProducts(token),
          fetchAdminOrders(token),
        ]);
        const sorted = sortOrdersRecent(orders);
        setStats({
          products: products.length,
          orders: orders.length,
          pending: orders.filter((o) => o.status === 'pending').length,
        });
        setRecentOrders(sorted.slice(0, RECENT_LIMIT));
      } catch {
        setStats({ products: 0, orders: 0, pending: 0 });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Dashboard</h1>
        <p>Overview of your farm store</p>
      </header>

      {loading ? (
        <p className="admin-empty">Loading stats…</p>
      ) : (
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">📦</span>
            <strong>{stats.products}</strong>
            <span>Products</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">🛒</span>
            <strong>{stats.orders}</strong>
            <span>Total orders</span>
          </div>
          <div className="admin-stat-card admin-stat-card--warn">
            <span className="admin-stat-card__icon">⏳</span>
            <strong>{stats.pending}</strong>
            <span>Pending orders</span>
          </div>
        </div>
      )}

      {!loading && (
        <section className="admin-recent-orders">
          <div className="admin-recent-orders__header">
            <div>
              <h2>Recent orders</h2>
              <p>Latest customer orders, newest first</p>
            </div>
            {stats.orders > 0 && (
              <Link to="/admin/orders" className="admin-recent-orders__link">
                View all →
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <p className="admin-empty admin-recent-orders__empty">No orders yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-recent-orders__table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="admin-recent-orders__row"
                      onClick={() => navigate(`/admin/orders?order=${encodeURIComponent(order.id)}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/admin/orders?order=${encodeURIComponent(order.id)}`);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`View order #${order.id.slice(-6).toUpperCase()}`}
                    >
                      <td>
                        <strong>#{order.id.slice(-6).toUpperCase()}</strong>
                      </td>
                      <td>
                        {order.customer?.name || '—'}
                        {order.customer?.phone && (
                          <small>{order.customer.phone}</small>
                        )}
                      </td>
                      <td>{itemSummary(order.items)}</td>
                      <td><strong>{formatPrice(order.total)}</strong></td>
                      <td>
                        <span className={`admin-status admin-status--${order.status}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td><small>{formatDate(order.createdAt)}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <div className="admin-quick-links">
        <Link to="/admin/products" className="admin-quick-link">
          <strong>Manage Products</strong>
          <span>Add, edit, or remove items</span>
        </Link>
        <Link to="/admin/orders" className="admin-quick-link">
          <strong>View Orders</strong>
          <span>Update order status</span>
        </Link>
        <Link to="/admin/messages" className="admin-quick-link">
          <strong>Contact Messages</strong>
          <span>Read customer enquiries</span>
        </Link>
      </div>
    </div>
  );
}
