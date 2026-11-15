import { Navigate, Outlet, useLocation } from 'react-router';
import { SECTION_PERMISSION } from '../../config/permissions.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export function RequirePermission({ permission, children }) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children || <Outlet /> : <Navigate to="/dashboard" replace />;
}

export function RequireSection({ section, children }) {
  return <RequirePermission permission={SECTION_PERMISSION[section]}>{children}</RequirePermission>;
}
