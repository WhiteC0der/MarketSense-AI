# MarketSense AI - Backend-Frontend Wiring Guide

## Overview

The MarketSense AI application is now fully wired between the **Express.js backend** (`backend/`) and the **Next.js frontend** (`front_new/`). This guide explains the architecture, how to set it up, and how to verify it's working.

## Project Structure

```
MarketSense AI/
├── backend/               # Express.js API server
│   ├── package.json
│   ├── .env              # Configure: MONGODB_URL, JWT_SECRET, API_KEYS, etc.
│   └── src/
│       ├── app.js        # Express app, CORS setup, routes
│       ├── server.js     # Entry point, DB connection
│       ├── router/       # API endpoint controllers
│       │   ├── auth.router.js
│       │   ├── chat.router.js
│       │   ├── stocks.router.js
│       │   └── news.router.js
│       ├── middleware/
│       │   └── auth.middleware.js  # JWT protection
│       ├── models/
│       │   ├── user.model.js
│       │   ├── news.model.js
│       │   └── conversation.model.js
│       └── services/
│           └── aiService.js        # Gemini integration
│
└── front_new/            # Next.js 16 Frontend (TSX/JSX)
    ├── package.json
    ├── .env.local        # Configure: NEXT_PUBLIC_API_BASE_URL
    ├── app/
    │   ├── layout.tsx    # Root layout with AuthProvider
    │   ├── page.jsx      # Home page
    │   └── RootContent.tsx # Auth routing logic
    ├── context/
    │   └── AuthContext.tsx # Auth state management
    ├── lib/
    │   └── api.ts        # API client (fetch wrapper)
    └── components/
        ├── auth/
        │   └── AuthPage.jsx
        └── dashboard/
            ├── Dashboard.jsx     # Main orchestrator
            ├── Header.jsx        # Search & ticker display
            ├── Sidebar.jsx       # Chat history & nav
            ├── ChatInput.jsx     # Message input
            ├── ChatMessages.jsx  # Message display
            ├── StockChart.jsx    # Recharts visualization
            └── SourceCards.jsx   # News source cards
```

## API Endpoints (Backend)

The backend exposes these endpoints at `http://localhost:3000/api/v1`:

### Authentication (`/auth`)
- `POST /register` - Create new account
- `POST /login` - Login (returns JWT in httpOnly cookie)
- `POST /logout` - Clear session
- `GET /me` - Current user info (requires auth)

### Chat (`/chat`) - **Protected by JWT**
- `GET /history` - List user's conversations
- `GET /:chatId` - Fetch specific conversation
- `POST /` - Send message (body: `{question, ticker, chatId?}`)

### Stocks (`/stock`)
- `GET /search/:query` - Search for stocks (e.g., `/search/TSLA`)
- `GET /:ticker` - Get chart data (e.g., `/TSLA`)

### News (`/news`)
- `GET /:ticker` - Fetch recent news (e.g., `/TSLA`)
- `POST /ingest/:ticker` - Trigger news ingestion with vector embeddings

## Frontend Architecture

### 1. **Authentication Flow** (`context/AuthContext.tsx`)

```
RootLayout (layout.tsx)
  └─ AuthProvider
       └─ RootContent (RootContent.tsx)
            ├─ if loading → Loading screen
            ├─ if not authenticated → AuthPage
            └─ if authenticated → Dashboard
```

**Key Features:**
- Automatic session rehydration on app load (`useAuth().rehydrate()`)
- JWT stored in httpOnly cookies (automatic, no manual storage)
- Auth state managed with React Context
- Logout clears cookies and redirects to auth

### 2. **API Client** (`lib/api.ts`)

Centralized fetch-based API wrapper with:
- Automatic credential inclusion (`credentials: "include"`)
- Error handling & parsing
- TypeScript interfaces for type safety
- Base URL from `NEXT_PUBLIC_API_BASE_URL` env variable

**Available APIs:**
```typescript
authAPI.register(email, password)
authAPI.login(email, password)
authAPI.logout()
authAPI.me()

chatAPI.sendMessage(question, ticker, chatId?)
chatAPI.getHistory()
chatAPI.getChat(chatId)

stockAPI.search(query)
stockAPI.getChart(ticker)

newsAPI.get(ticker)
newsAPI.ingest(ticker)
```

### 3. **Dashboard** (`components/dashboard/Dashboard.jsx`)

Main orchestrator component managing:
- **State:** current ticker, messages, chart data, loading states
- **API Calls:** Search stocks, send chat messages, fetch charts
- **Props Flow:**
  - Passes messages → ChatMessages
  - Passes onSendMessage → ChatInput
  - Passes currentTicker → Header, StockChart
  - Handles logout → Sidebar

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure `.env`:**
   ```
   MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/marketsense
   MONGODB_NAME=marketsense
   JWT_SECRET=your-secret-key-min-32-chars
   GEMINI_API_KEY=your-google-gemini-key
   FINNHUB_API_KEY=your-finnhub-api-key
   PORT=3000
   FRONTEND_URLS=http://localhost:3000,http://localhost:3001
   NODE_ENV=development
   ```

3. **Start the backend:**
   ```bash
   npm run dev
   ```
   Backend runs at `http://localhost:3000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd front_new
   npm install
   # or with pnpm
   pnpm install
   ```

2. **Configure `.env.local`:**
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:3000` (Next.js default)
   
   **Note:** Both run on port 3000 by default in Next.js. They communicate via API calls, not direct port sharing.

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Testing the Integration

### 1. **Test Authentication**
- Open `http://localhost:3000` (frontend)
- You should see the AuthPage
- Create account: test@example.com / password123
- Should redirect to Dashboard
- Refresh page: should stay authenticated
- Click logout: should return to AuthPage

### 2. **Test Stock Search**
- In Dashboard, type "TSLA" in search box
- Click "SCAN"
- Should show price and chart toggle (live price pill)
- Chart data should appear if Yahoo Finance/Finnhub responds

### 3. **Test Chat**
- After searching a ticker, ask a question
- "Why is TSLA up today?"
- Should see typing indicator, then AI response
- Sources should appear as cards (if RAG retrieval found articles)

### 4. **API Monitoring**
Check browser DevTools → Network tab to verify:
- `POST /api/v1/auth/login` - 200 response with Set-Cookie
- `POST /api/v1/chat` - 200 response with `{response, sources}`
- `GET /api/v1/stock/TSLA` - 200 response with chart data
- All requests should include `Cookie` header (from httpOnly)

## Key Integration Points

### 1. **CORS & Cookies**
- **Backend** (`app.js`): Allows `http://localhost:3000` by default
- **Frontend** (`api.ts`): Includes `credentials: "include"` in all fetch calls
- Cookies are httpOnly (secure, can't be accessed by JS)

### 2. **Error Handling**
- Failed auth redirects to AuthPage
- Failed API calls show error message in Dashboard
- All errors logged to console for debugging

### 3. **Loading States**
- Disabled buttons/inputs while loading
- Spinner icons (Loader2 from lucide-react)
- Loading screen on app startup during session check

### 4. **Type Safety**
- TypeScript interfaces in `api.ts` for all data types
- Returns properly typed objects from API calls
- IDE autocomplete for API responses

## Deployment

### Backend (Render/Railway/Vercel)

1. Set environment variables:
   ```
   MONGODB_URL=<your-mongo-atlas-url>
   JWT_SECRET=<secure-random-string>
   FRONTEND_URLS=https://your-frontend.vercel.app
   NODE_ENV=production
   YAHOO_PUBLIC_ENDPOINTS_ONLY=true
   ```

2. Deploy from `backend/` folder with `npm start`

### Frontend (Vercel)

1. Update `.env.local`:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.com/api/v1
   ```

2. Deploy from `front_new/` folder with `npm run build`

## Troubleshooting

### "Cannot POST /api/v1/auth/login"
- ✅ Backend not running? Start with `npm run dev` in `backend/`
- ✅ Wrong base URL? Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`

### "No active session" (logout immediately after login)
- ✅ CORS issue? Add origin to `FRONTEND_URLS` in backend `.env`
- ✅ Cookie not being set? Check browser DevTools → Network tab → Set-Cookie header

### "Stock not found"
- ✅ Retry with exact ticker (e.g., "AAPL" not "Apple")
- ✅ Yahoo Finance throttling? Check backend logs for 429 errors
- ✅ `FINNHUB_API_KEY` not set? Falls back but may fail

### Chart not showing data
- ✅ Yahoo Finance down? Check `https://finance.yahoo.com`
- ✅ `VITE_API_BASE_URL` vs `NEXT_PUBLIC_API_BASE_URL` - old frontend vs new?

## File Changes Summary

| File | Changes |
|------|---------|
| `lib/api.ts` | ✅ Created - API client with all endpoints |
| `context/AuthContext.tsx` | ✅ Created - Auth state management |
| `app/layout.tsx` | ✅ Updated - Added AuthProvider wrapper |
| `app/RootContent.tsx` | ✅ Created - Auth routing logic |
| `app/page.jsx` | ✅ Updated - Simplified to use RootContent |
| `components/auth/AuthPage.jsx` | ✅ Updated - Added auth API integration |
| `components/dashboard/Dashboard.jsx` | ✅ Updated - Added API calls & state management |
| `components/dashboard/Header.jsx` | ✅ Updated - Stock search integration |
| `components/dashboard/ChatInput.jsx` | ✅ Updated - Message sending with API |
| `components/dashboard/ChatMessages.jsx` | ✅ Updated - Display messages with markdown |
| `components/dashboard/StockChart.jsx` | ✅ Updated - Dynamic chart data |
| `components/dashboard/Sidebar.jsx` | ✅ Updated - Logout & ticker selection |
| `components/dashboard/SourceCards.jsx` | ✅ Updated - Dynamic sources display |
| `package.json` | ✅ Updated - Added `react-markdown` |
| `.env.local` | ✅ Created - API base URL configuration |

## Next Steps

1. **Optional: Implement chat history persistence** - Currently shows only current session
2. **Optional: Add real-time updates** - Use WebSockets for live price updates
3. **Optional: Cache management** - Add React Query or SWR for better data caching
4. **Production: Set up CI/CD** - GitHub Actions for auto-deployment
5. **Security: Add rate limiting** - Already in backend, but frontend could add retries

