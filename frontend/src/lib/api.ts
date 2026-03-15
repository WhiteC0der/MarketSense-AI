const normalizeApiBase = (rawBase?: string) => {
  const defaultBase = "http://localhost:3000/api/v1";
  const trimmed = rawBase?.trim();

  if (!trimmed) return defaultBase;

  const noTrailingSlash = trimmed.replace(/\/+$/, "");

  if (noTrailingSlash.endsWith("/api/v1")) {
    return noTrailingSlash;
  }

  return `${noTrailingSlash}/api/v1`;
};

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

export interface SourceItem {
  headline: string;
  summary: string;
  url?: string;
  source?: string;
}

export interface ChatMessageItem {
  role: "user" | "ai" | "system";
  content: string;
  sources?: SourceItem[];
}

export interface ConversationItem {
  _id: string;
  title: string;
  updatedAt: string;
  messages?: ChatMessageItem[];
}

const apiCall = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  return fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
};

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
    return res.json();
  },
};

export const chatAPI = {
  getHistory: async () => {
    const res = await apiCall(`${API_BASE}/chat/history`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return (await res.json()) as ConversationItem[];
  },

  getChat: async (chatId: string) => {
    const res = await apiCall(`${API_BASE}/chat/${chatId}`);
    if (!res.ok) throw new Error("Failed to fetch chat");
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

export const newsAPI = {
  ingest: async (ticker: string) => {
    const res = await apiCall(`${API_BASE}/news/ingest/${encodeURIComponent(ticker)}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to ingest news");
    return res.json();
  },
};

export const stockAPI = {
  search: async (query: string) => {
    const res = await apiCall(`${API_BASE}/stock/search/${encodeURIComponent(query)}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "No stock match found. Please type a proper company name or exact stock ticker.");
    }
    return res.json();
  },

  getChart: async (ticker: string) => {
    const res = await apiCall(`${API_BASE}/stock/${encodeURIComponent(ticker)}`);
    if (!res.ok) throw new Error("Failed to fetch chart data");
    return res.json();
  },
};
