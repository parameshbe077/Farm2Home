import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export default function ProtectedCustomerRoute({ children }) {
  const { user, loading } = useCustomerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
