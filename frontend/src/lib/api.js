/**
 * API Client for MarketSense AI Backend
 * Handles all communication with the Express backend
 * 
 * Uses dual auth strategy:
 * - Authorization: Bearer header (primary, works on all mobile browsers)
 * - credentials: 'include' cookies (fallback for desktop)
 */

const normalizeApiBase = (rawBase) => {
  const defaultBase = 'http://localhost:3000/api/v1';
  const envBase = rawBase || undefined;

  if (!envBase || envBase.trim() === '') {
    console.warn('VITE_API_BASE_URL not set, using localhost');
    return defaultBase;
  }

  const trimmed = envBase.trim();
  const noTrailingSlash = trimmed.replace(/\/+$/, '');

  if (noTrailingSlash.endsWith('/api/v1')) {
    return noTrailingSlash;
  }

  return `${noTrailingSlash}/api/v1`;
};

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

/**
 * Token management
 * Stores JWT in localStorage for mobile browsers that block cross-origin cookies
 */
const TOKEN_KEY = 'marketsense_token';

export const tokenManager = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } catch {
      // localStorage might be unavailable in some contexts
    }
  },

  clearToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

/**
 * Make authenticated API calls
 * Sends both Authorization header AND credentials cookie for maximum compatibility
 */
let isRefreshing = false;
let refreshPromise = null;

const apiCall = async (url, options = {}) => {
  try {
    const token = tokenManager.getToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    let response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    });

    // Check for 401 Unauthorized, avoid infinite loops by checking _retry flag
    // Also ignore auth endpoints to prevent refreshing during login/register/refresh
    if (
      response.status === 401 &&
      !options._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/register') &&
      !url.includes('/auth/refresh-token')
    ) {
      options._retry = true;

      // Handle concurrent 401s gracefully with a singleton promise
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = fetch(`${API_BASE}/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include', // Sends the HTTP-only refresh token cookie
        }).then(async (res) => {
          if (!res.ok) throw new Error('Refresh token invalid');
          const data = await res.json();
          if (data.token) {
            tokenManager.setToken(data.token);
            return data.token;
          }
          throw new Error('No token returned');
        }).finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      try {
        const newToken = await refreshPromise;
        // Retry original request with new token
        const newAuthHeaders = { Authorization: `Bearer ${newToken}` };
        response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...newAuthHeaders,
            ...options.headers,
          },
          ...options,
        });
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired)
        tokenManager.clearToken();
        // The backend will just reject the invalid cookie on next login/refresh.
        // Returning the 401 response so the calling component can handle the logout.
      }
    }

    return response;
  } catch (error) {
    throw new Error(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Auth API endpoints
 */
export const authAPI = {
  register: async (username, email, password) => {
    try {
      const res = await apiCall(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        let errorMsg = 'Registration failed';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }
      // Returns { message, user: { userId, email } } — user is NOT logged in yet
      return res.json();
    } catch (error) {
      throw error;
    }
  },

  verifyEmail: async (email, otp) => {
    try {
      const res = await apiCall(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        let errorMsg = 'Verification failed';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }
      return res.json();
    } catch (error) {
      throw error;
    }
  },

  resendOtp: async (email) => {
    try {
      const res = await apiCall(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        let errorMsg = 'Failed to resend OTP';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }
      return res.json();
    } catch (error) {
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const res = await apiCall(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let errorMsg = 'Login failed';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();

      // Backend returns accessToken (not token)
      if (data.accessToken) {
        tokenManager.setToken(data.accessToken);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      const res = await apiCall(`${API_BASE}/auth/logout`, {
        method: 'POST',
      });
      // Always clear the stored token on logout
      tokenManager.clearToken();
      return res.json();
    } catch {
      tokenManager.clearToken();
      return { message: 'Logged out' };
    }
  },

  me: async (options = {}) => {
    try {
      const res = await apiCall(`${API_BASE}/auth/get-me`, { signal: options.signal });
      if (!res.ok) {
        let errorMsg = 'No active session';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${res.status}`;
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      return data.user || data;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Chat API endpoints
 */
export const chatAPI = {
  getHistory: async () => {
    const res = await apiCall(`${API_BASE}/chat/history`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data;
  },

  getChat: async (chatId) => {
    const res = await apiCall(`${API_BASE}/chat/${chatId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch chat (${res.status})`);
    }
    return await res.json();
  },

  sendMessage: async (question, ticker, chatId) => {
    const res = await apiCall(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify({ question, ticker, chatId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send message');
    }
    return res.json();
  },
};

/**
 * News API endpoints
 */
export const newsAPI = {
  get: async (ticker) => {
    const res = await apiCall(
      `${API_BASE}/news/${encodeURIComponent(ticker)}`
    );
    if (!res.ok) throw new Error('Failed to fetch news');
    return res.json();
  },

  ingest: async (ticker) => {
    const res = await apiCall(
      `${API_BASE}/news/ingest/${encodeURIComponent(ticker)}`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error('Failed to ingest news');
    return res.json();
  },
};

/**
 * Stock API endpoints
 */
export const stockAPI = {
  search: async (query) => {
    const res = await apiCall(
      `${API_BASE}/stock/search/${encodeURIComponent(query)}`
    );
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(
        error.error ||
          'No stock match found. Please type a proper company name or exact stock ticker.'
      );
    }
    return res.json();
  },

  getChart: async (ticker) => {
    const res = await apiCall(
      `${API_BASE}/stock/${encodeURIComponent(ticker)}`
    );
    if (!res.ok) throw new Error('Failed to fetch chart data');
    return res.json();
  },
};
