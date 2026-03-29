/**
 * API Client for MarketSense AI Backend
 * Handles all communication with the Express backend
 */

const normalizeApiBase = (rawBase?: string) => {
  // In production/vercel, use the env var; otherwise use localhost
  const defaultBase = "http://localhost:3000/api/v1";
  
  // Get env var - it should be set in Vercel dashboard
  const envBase = rawBase || (typeof window !== "undefined" ? undefined : process.env.NEXT_PUBLIC_API_BASE_URL);
  
  if (!envBase || envBase.trim() === "") {
    console.warn("NEXT_PUBLIC_API_BASE_URL not set, using localhost");
    return defaultBase;
  }

  const trimmed = envBase.trim();
  const noTrailingSlash = trimmed.replace(/\/+$/, "");

  if (noTrailingSlash.endsWith("/api/v1")) {
    return noTrailingSlash;
  }

  return `${noTrailingSlash}/api/v1`;
};

const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE_URL);
console.log("API_BASE initialized to:", API_BASE);

// Source item from backend news retrieval
export interface SourceItem {
  headline: string;
  summary: string;
  url?: string;
  source?: string;
}

// Chat message structure
export interface ChatMessageItem {
  role: "user" | "ai";
  content: string;
  sources?: SourceItem[];
}

// Conversation/Chat session
export interface ConversationItem {
  _id: string;
  title: string;
  messages: ChatMessageItem[];
  ticker: string;
  userId: string;
  updatedAt: string;
  createdAt: string;
}

// Stock search result
export interface StockQuote {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  quoteType: string;
}

// Stock chart data
export interface ChartData {
  timestamp: number[];
  close: number[];
  open: number[];
  high: number[];
  low: number[];
  adjclose: number[];
  volume: number[];
}

/**
 * Make authenticated API calls
 * Automatically includes credentials and Content-Type headers
 */
const apiCall = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  return fetch(url, {
    credentials: "include", // Include cookies for auth
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
};

/**
 * Auth API endpoints
 */
export const authAPI = {
  register: async (email: string, password: string) => {
    const res = await apiCall(`${API_BASE}/auth/register`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Registration failed");
    }
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await apiCall(`${API_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Login failed");
    }
    return res.json();
  },

  logout: async () => {
    const res = await apiCall(`${API_BASE}/auth/logout`, {
      method: "POST",
    });
    return res.json();
  },

  me: async () => {
    const res = await apiCall(`${API_BASE}/auth/me`);
    if (!res.ok) {
      throw new Error("No active session");
    }
    const data = await res.json();
    return data.user;
  },
};

/**
 * Chat API endpoints
 */
export const chatAPI = {
  getHistory: async () => {
    const res = await apiCall(`${API_BASE}/chat/history`);
    if (!res.ok) {
      const text = await res.text();
      console.error(`Chat history error (${res.status}):`, text);
      return []; // Return empty array instead of throwing
    }
    const data = await res.json();
    return data as ConversationItem[];
  },

  getChat: async (chatId: string) => {
    const res = await apiCall(`${API_BASE}/chat/${chatId}`);
    if (!res.ok) {
      const text = await res.text();
      console.error(`Failed to fetch chat ${chatId} (${res.status}):`, text);
      throw new Error(`Failed to fetch chat (${res.status})`);
    }
    return (await res.json()) as ConversationItem;
  },

  sendMessage: async (question: string, ticker: string, chatId?: string) => {
    const res = await apiCall(`${API_BASE}/chat`, {
      method: "POST",
      body: JSON.stringify({ question, ticker, chatId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to send message");
    }
    return res.json();
  },
};

/**
 * News API endpoints
 */
export const newsAPI = {
  get: async (ticker: string) => {
    const res = await apiCall(
      `${API_BASE}/news/${encodeURIComponent(ticker)}`
    );
    if (!res.ok) throw new Error("Failed to fetch news");
    return res.json();
  },

  ingest: async (ticker: string) => {
    const res = await apiCall(
      `${API_BASE}/news/ingest/${encodeURIComponent(ticker)}`,
      {
        method: "POST",
      }
    );
    if (!res.ok) throw new Error("Failed to ingest news");
    return res.json();
  },
};

/**
 * Stock API endpoints
 */
export const stockAPI = {
  search: async (query: string) => {
    const res = await apiCall(
      `${API_BASE}/stock/search/${encodeURIComponent(query)}`
    );
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(
        error.error ||
          "No stock match found. Please type a proper company name or exact stock ticker."
      );
    }
    return res.json();
  },

  getChart: async (ticker: string) => {
    const res = await apiCall(
      `${API_BASE}/stock/${encodeURIComponent(ticker)}`
    );
    if (!res.ok) throw new Error("Failed to fetch chart data");
    return res.json();
  },
};

export default { authAPI, chatAPI, newsAPI, stockAPI };
