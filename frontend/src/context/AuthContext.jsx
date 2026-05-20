import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Prevent rehydrate from running if login/register is in progress
  const authInProgress = useRef(false);

  const rehydrate = useCallback(async () => {
    // Don't rehydrate if an auth action is already in flight
    if (authInProgress.current) return;
    try {
      const userData = await authAPI.me();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
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
