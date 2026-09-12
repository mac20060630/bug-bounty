import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('bugbounty_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('bugbounty_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear auth session helper
  const clearSession = useCallback(() => {
    localStorage.removeItem('bugbounty_token');
    localStorage.removeItem('bugbounty_user');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Sync / Verify profile on initial mount if token exists
  useEffect(() => {
    let isMounted = true;

    const verifyExistingAuth = async () => {
      const storedToken = localStorage.getItem('bugbounty_token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await authService.getProfile();
        if (isMounted && response.success && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('bugbounty_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.warn('[Auth] Session validation failed or token expired:', err.message);
        if (isMounted) clearSession();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verifyExistingAuth();

    // Listen to session expired events from axios interceptor
    const handleSessionExpired = () => {
      clearSession();
    };

    window.addEventListener('bugbounty:session_expired', handleSessionExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('bugbounty:session_expired', handleSessionExpired);
    };
  }, [clearSession]);

  // Login handler
  const login = async (credentials) => {
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        const { user: authedUser, token: receivedToken } = response.data;
        localStorage.setItem('bugbounty_token', receivedToken);
        localStorage.setItem('bugbounty_user', JSON.stringify(authedUser));
        setToken(receivedToken);
        setUser(authedUser);
        return { success: true, user: authedUser };
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to login with provided credentials';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Register handler
  const register = async (userData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      if (response.success && response.data) {
        const { user: registeredUser, token: receivedToken } = response.data;
        localStorage.setItem('bugbounty_token', receivedToken);
        localStorage.setItem('bugbounty_user', JSON.stringify(registeredUser));
        setToken(receivedToken);
        setUser(registeredUser);
        return { success: true, user: registeredUser };
      }
      throw new Error(response.message || 'Registration failed');
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Registration failed. Please check inputs.';
      const errors = err.response?.data?.errors || null;
      setError(message);
      return { success: false, error: message, errors };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authService.logoutApi();
    } finally {
      clearSession();
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('bugbounty_user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('[Auth] Refresh profile error:', err);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isResearcher: user?.role === 'researcher',
    isLoading,
    error,
    login,
    register,
    logout,
    refreshProfile,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
