import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authAPI, setTokens, clearTokens, getAccessToken } from '../api';

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  PUBLIC_USER: 'PUBLIC_USER',
};

// Create context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useTranslation();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token by fetching current user profile
          const response = await authAPI.getProfile();
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear everything
          clearTokens();
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access, refresh, user: userData } = response.data;

      // Store tokens
      setTokens(access, refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update state
      setUser(userData);
      setIsAuthenticated(true);

      toast.success(t('auth.loginSuccess'));

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.detail ||
        error.response?.data?.message ||
        t('auth.loginError');

      toast.error(message);
      return { success: false, error: message };
    }
  }, [t]);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { access, refresh, user: newUser } = response.data;

      // Store tokens if auto-login after registration
      if (access) {
        setTokens(access, refresh);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        setIsAuthenticated(true);
      }

      toast.success(t('auth.registerSuccess'));

      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.detail ||
        error.response?.data?.message ||
        Object.values(error.response?.data || {}).flat().join(', ') ||
        t('errors.serverError');

      toast.error(message);
      return { success: false, error: message, errors: error.response?.data };
    }
  }, [t]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      toast.success(t('auth.logoutSuccess'));
    }
  }, [t]);

  // Update user profile
  const updateProfile = useCallback(async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data;

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success(t('common.success'));

      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.detail ||
        error.response?.data?.message ||
        t('errors.serverError');

      toast.error(message);
      return { success: false, error: message };
    }
  }, [t]);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success(t('common.success'));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail ||
        error.response?.data?.message ||
        t('errors.serverError');

      toast.error(message);
      return { success: false, error: message };
    }
  }, [t]);

  // Check if user has a specific role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  // Get dashboard path based on role
  const getDashboardPath = useCallback(() => {
    if (!user) return '/';

    switch (user.role) {
      case USER_ROLES.SUPER_ADMIN:
        return '/admin/dashboard';
      case USER_ROLES.COMPANY_ADMIN:
        return '/company/dashboard';
      case USER_ROLES.EMPLOYEE:
        return '/employee/dashboard';
      default:
        return '/';
    }
  }, [user]);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    hasAnyRole,
    getDashboardPath,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
