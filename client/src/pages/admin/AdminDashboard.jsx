import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { fetchAdminProducts, fetchAdminOrders } from '../../api/adminApi';

export default function AdminDashboard() {
  const { getToken } = useAdminAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const [products, orders] = await Promise.all([
          fetchAdminProducts(token),
          fetchAdminOrders(token),
        ]);
        setStats({
          products: products.length,
          orders: orders.length,
          pending: orders.filter((o) => o.status === 'pending').length,
        });
      } catch {
        setStats({ products: 0, orders: 0, pending: 0 });
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

      <div className="admin-quick-links">
        <Link to="/admin/products" className="admin-quick-link">
          <strong>Manage Products</strong>
          <span>Add, edit, or remove items</span>
        </Link>
        <Link to="/admin/orders" className="admin-quick-link">
          <strong>View Orders</strong>
          <span>Update order status</span>
        </Link>
      </div>
    </div>
  );
}
