import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { authAPI, tokenManager } from '@/lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Prevent rehydrate from running if login/register is in progress
  const authInProgress = useRef(false);
  // Prevent double-mount in StrictMode from firing two /auth/me calls
  const rehydrateRan = useRef(false);

  const rehydrate = useCallback(async () => {
    // Don't rehydrate if an auth action is already in flight
    if (authInProgress.current) return;

    // Fast path: if no token in localStorage, skip the API call entirely
    // This saves 0.5-30s for non-authenticated users (backend cold start)
    const token = tokenManager.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Add timeout so users aren't stuck on spinner if backend is slow
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const userData = await authAPI.me({ signal: controller.signal });
      clearTimeout(timeout);
      setUser(userData);
    } catch {
      // Token invalid or backend down — clear and show login
      tokenManager.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Guard against StrictMode double-mount
    if (rehydrateRan.current) return;
    rehydrateRan.current = true;
    rehydrate();
  }, [rehydrate]);

  const login = useCallback(async (email, password) => {
    authInProgress.current = true;
    try {
      const loginData = await authAPI.login(email, password);
      // Use user data directly from login response if available
      // to avoid a second round-trip that can fail on mobile
      if (loginData?.user) {
        setUser(loginData.user);
      } else {
        const userData = await authAPI.me();
        setUser(userData);
      }
    } catch (error) {
      throw error;
    } finally {
      authInProgress.current = false;
    }
  }, []);

  const register = useCallback(async (email, password) => {
    authInProgress.current = true;
    try {
      await authAPI.register(email, password);
      const loginData = await authAPI.login(email, password);
      if (loginData?.user) {
        setUser(loginData.user);
      } else {
        const userData = await authAPI.me();
        setUser(userData);
      }
    } catch (error) {
      throw error;
    } finally {
      authInProgress.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        rehydrate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
