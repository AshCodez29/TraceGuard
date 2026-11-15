import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { loginRequest, logoutRequest } from '../services/authService.js';
import { ROLE_PERMISSIONS } from '../config/permissions.js';

const AuthContext = createContext(null);
const SESSION_KEY = 'traceguard.session';
const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_PREVIEW === 'true';
const PREVIEW_REQUESTED = new URLSearchParams(window.location.search).get('dev') === '1';
export const isDemoPreview = DEMO_MODE && PREVIEW_REQUESTED;

function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    return value?.user && ROLE_PERMISSIONS[value.user.role] ? value : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials, previewRole = 'DEVELOPER') => {
    setLoading(true);
    try {
      const response = await loginRequest(credentials, { demo: isDemoPreview, previewRole });
      if (!response.user?.role || !ROLE_PERMISSIONS[response.user.role]) {
        throw new Error('Login response did not include a supported role.');
      }
      const next = { user: response.user, accessToken: response.accessToken, demo: response.demo };
      if (response.accessToken) sessionStorage.setItem('traceguard.accessToken', response.accessToken);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      return next.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!session?.demo) await logoutRequest();
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('traceguard.accessToken');
    setSession(null);
  }, [session]);

  const value = useMemo(() => ({
    user: session?.user || null,
    accessToken: session?.accessToken || null,
    isDemo: Boolean(session?.demo),
    isAuthenticated: Boolean(session?.user),
    loading,
    login,
    logout,
    hasPermission: (permission) => ROLE_PERMISSIONS[session?.user?.role]?.includes(permission) || false,
  }), [session, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
};
