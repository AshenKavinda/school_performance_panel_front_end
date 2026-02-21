import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import { ROLE_ROUTES } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // { id, username, email, role }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while rehydrating from localStorage

  // ── Rehydrate from localStorage on mount ───────────────────────────────────
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getStoredToken();

    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    setToken(data.token);
    return data;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  // ── Register Student ───────────────────────────────────────────────────────
  const registerStudent = useCallback(async (data) => {
    return authService.registerStudent(data);
  }, []);

  // ── Register Application Admin ─────────────────────────────────────────────
  const registerApplicationAdmin = useCallback(async (data) => {
    return authService.registerApplicationAdmin(data);
  }, []);

  const isAuthenticated = !!user && !!token;

  const getDashboardRoute = useCallback(() => {
    if (!user?.role) return '/';
    return ROLE_ROUTES[user.role] ?? '/';
  }, [user]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    registerStudent,
    registerApplicationAdmin,
    getDashboardRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
