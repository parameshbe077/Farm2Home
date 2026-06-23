import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from './AdminLayout';

export default function ProtectedAdminRoute() {
  const { user, isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
