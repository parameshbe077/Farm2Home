import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLayout({ children }) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span>🌾</span>
          <div>
            <strong>Farm2Home</strong>
            <small>Admin</small>
          </div>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className="admin-nav__link">Dashboard</NavLink>
          <NavLink to="/admin/products" className="admin-nav__link">Products</NavLink>
          <NavLink to="/admin/orders" className="admin-nav__link">Orders</NavLink>
        </nav>
        <div className="admin-sidebar__footer">
          <p className="admin-sidebar__email">{user?.email}</p>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={handleLogout}>
            Sign out
          </button>
          <a href="/" className="admin-sidebar__store">← Back to store</a>
        </div>
      </aside>
      <div className="admin-main">
        {children}
      </div>
      <footer className="admin-mobile-footer">
        <a href="/" className="admin-mobile-footer__store">← Store</a>
        <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={handleLogout}>
          Sign out
        </button>
      </footer>
    </div>
  );
}
