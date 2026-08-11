import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../api/auth';

/**
 * Protects routes from unauthenticated access.
 * Redirects to /login if not authenticated.
 */
export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * Restricts routes to specific roles.
 * Shows 403 message if user's role is not in allowedRoles.
 */
export function RoleRoute({ allowedRoles }: { allowedRoles: User['role'][] }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="main-body" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <h2 style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }}>Access Denied</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
