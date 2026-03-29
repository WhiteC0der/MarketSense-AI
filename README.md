# MarketSense AI

**AI-Powered Financial Intelligence Platform**

Real-time stock analysis powered by **Google Gemini AI** and **MongoDB Vector Search**. Ask natural questions about any stock and get intelligent answers grounded in live financial news.

---

## 🚀 Live Demo

**Website**: https://market-sense-ai.vercel.app  
**API**: https://marketsense-ai.onrender.com

---

## ✨ Key Features

- 📊 **Real-Time Stock Data** — Live prices, 30-day interactive charts, ticker search
- 🤖 **AI Chat** — Ask questions about stocks, get intelligent answers powered by Gemini AI
- 🔍 **Semantic Search** — MongoDB Vector Search matches questions to relevant news
- 📰 **Live News** — Automatic financial news ingestion and AI-powered analysis
- 💾 **Chat History** — Persistent conversations saved per user
- 🔐 **Secure Auth** — JWT authentication with HttpOnly cookies
- 📱 **Responsive UI** — Mobile-first design with modern components

---

## 🛠️ Tech Stack

**Frontend**
- Next.js 16 with TypeScript
- Tailwind CSS + shadcn/ui
- Recharts for data visualization
- Vercel hosting

**Backend**
- Node.js + Express 5
- MongoDB Atlas with Vector Search
- Google Gemini 2.5 Flash AI
- Render hosting

**APIs & Services**
- Google Gemini (AI chat & embeddings)
- Yahoo Finance (stock data)
- Finnhub (market news)

---

## 📋 API Endpoints

### Authentication
```
POST   /api/v1/auth/register    Create account
POST   /api/v1/auth/login       Login
POST   /api/v1/auth/logout      Logout
GET    /api/v1/auth/me          Get profile
```

### Chat & Analysis
```
POST   /api/v1/chat             Send message (AI-powered)
GET    /api/v1/chat/history     Get conversations
GET    /api/v1/chat/:chatId     Get conversation details
```

### Stock Data
```
GET    /api/v1/stock/:ticker       Get price & chart
GET    /api/v1/stock/search/:query Search stocks
```

---

## 🏗️ Architecture

```
User Query: "How is Apple performing?"
    ↓
[Frontend] Sends to AI Chat Endpoint
    ↓
[Backend] Embeds question with Gemini
    ↓
MongoDB Vector Search finds relevant news
    ↓
RAG: Feed articles + context to Gemini
    ↓
Generate intelligent answer with sources
    ↓
Save to database & return to user
```

---

## 🔧 Environment Setup

### Backend `.env`
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-key
FINNHUB_API_KEY=your-key
FRONTEND_URLS=https://market-sense-ai.vercel.app
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=https://marketsense-ai.onrender.com/api/v1
```

---

## 🚀 Quick Start

### Running Locally

**Backend**
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3001
```

### Build for Production

**Backend**
```bash
npm run build
npm start
```

**Frontend**
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
MarketSense-AI/
├── frontend/                 # Next.js app
│   ├── app/                 # Pages & layouts
│   ├── components/          # React components
│   ├── lib/                 # API & utilities
│   └── public/              # Static assets
│
├── backend/                 # Express API
│   ├── src/
│   │   ├── models/         # MongoDB schemas
│   │   ├── router/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth & validation
│   └── package.json
│
└── README.md               # This file
```

---

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT authentication with HttpOnly cookies
- ✅ CORS protection for production domains
- ✅ Rate limiting on auth endpoints
- ✅ Input validation & error handling
- ✅ MongoDB vector search on encrypted connections

---

## 🌐 Deployment

**Frontend**: Deployed on Vercel with automatic GitHub deployments  
**Backend**: Deployed on Render with auto-deployment on push

Current Production:
- **Frontend**: https://market-sense-ai.vercel.app
- **Backend**: https://marketsense-ai.onrender.com
- **Database**: MongoDB Atlas (US region)

---

## 📝 Development Status

✅ Production Ready  
✅ All features tested  
✅ CORS configured  
✅ Rate limiting enabled  
✅ Zero build errors

---

## 💡 How It Works

1. **User registers** with email/password
2. **User logs in** and access dashboard
3. **User searches** for a stock ticker
4. **Charts load** with live price data
5. **User asks question** about the stock
6. **AI analyzes** relevant news articles via vector search
7. **Gemini AI** generates intelligent, sourced answer
8. **Conversation saved** to user's chat history

---

## 📞 Questions?

Check the [Frontend README](./frontend/README.md) or [Backend README](./backend/README.md) for detailed documentation.
```
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
FINNHUB_API_KEY=your_finnhub_key
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

### Frontend (Vercel Dashboard)
```
NEXT_PUBLIC_API_BASE_URL=https://marketsense-ai.onrender.com/api/v1
```

---

## 📦 Local Development

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3001`, Backend on `http://localhost:3000`

---

## 📝 Project Structure

```
MarketSense AI/
├── backend/
│   ├── src/
│   │   ├── router/          (auth, chat, news, stocks)
│   │   ├── models/          (User, Conversation, News)
│   │   ├── middleware/      (Auth, CORS)
│   │   ├── services/        (Gemini AI)
│   │   └── app.js           (Express setup)
│
├── frontend/
│   ├── app/                 (Next.js routes)
│   ├── components/
│   │   ├── auth/           (Login/Register)
│   │   ├── dashboard/      (Main app UI)
│   │   └── ui/             (shadcn/ui components)
│   ├── lib/
│   │   └── api.ts          (API client)
│   └── context/
│       └── AuthContext.tsx (State management)
```

---

## 🎯 Key Features

### Authentication
- Secure JWT-based login with HttpOnly cookies
- Email/password validation
- Session persistence across browser restarts

### Chat Interface
- RAG (Retrieval-Augmented Generation) powered responses
- Citation of source articles
- Real-time conversation history
- Multi-ticket support

### Stock Analysis
- Real-time price data via Yahoo Finance
- 30-day interactive price charts
- News sentiment analysis
- Vector semantic search

---

## 🔐 Security

- ✅ CORS configured for production domain
- ✅ HttpOnly cookies prevent XSS attacks
- ✅ JWT tokens for stateless authentication
- ✅ Password hashing with bcryptjs
- ✅ Rate limiting on auth endpoints (10 req/15min)
- ✅ Input validation on all endpoints

---

## 📞 Contact & Support

For issues or questions, please open an issue on the repository or contact via email.

---

**Built by WhiteC0der**

│   │   │   ├── AuthPage.tsx     # Login / Register
│   │   │   └── Index.tsx
│   │   ├── components/
│   │   │   ├── Dashboard.tsx    # Main app layout
│   │   │   ├── ChatSidebar.tsx  # Chat history sidebar
│   │   │   ├── ChatMessage.tsx  # Message renderer (Markdown)
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── StockChart.tsx   # Recharts price chart
│   │   │   └── SourceCards.tsx  # News article cards
│   │   ├── lib/
│   │   │   └── api.ts           # All API calls
│   │   └── hooks/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account with **Vector Search** enabled
- [Google AI Studio](https://aistudio.google.com) API key
- [Finnhub](https://finnhub.io) API key

### 1. Clone the repo

```bash
git clone https://github.com/your-username/marketsense-ai.git
cd marketsense-ai
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

### 3. Set up the frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:3000
npm run dev
```

---

## Environment Variables

### `backend/.env`

| Variable | Description |
|---|---|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `MONGODB_NAME` | Database name (e.g. `marketsense`) |
| `PORT` | Server port (default `3000`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FINNHUB_API_KEY` | Finnhub financial news API key |
| `JWT_SECRET` | Secret string for signing JWT tokens |
| `FRONTEND_URLS` | Comma-separated allowed frontend origins |

### `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |

---

## MongoDB Atlas Setup

1. Create a **free cluster** on [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database named `marketsense`
3. Create a **Vector Search Index** on the `news` collection:
   - Index name: `vector_index`
   - Field: `embedding`
   - Dimensions: `768` (Gemini embedding-001 output)
   - Similarity: `cosine`

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/logout` | Logout |
| `GET` | `/api/v1/auth/me` | Check session |
| `GET` | `/api/v1/news/:ticker` | Fetch latest news |
| `POST` | `/api/v1/news/ingest/:ticker` | Ingest & embed news |
| `POST` | `/api/v1/chat` | Ask AI a question |
| `GET` | `/api/v1/chat/history` | Get chat history |
| `GET` | `/api/v1/chat/:chatId` | Load specific chat |
| `GET` | `/api/v1/stock/search/:query` | Resolve ticker symbol |
| `GET` | `/api/v1/stock/:ticker` | Live price + chart data |

---

## Deployment

### Frontend → Vercel
1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add `VITE_API_BASE_URL` environment variable pointing to your Render backend URL

### Backend → Render
1. Connect your GitHub repo to [Render](https://render.com)
2. Set root directory to `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from `backend/.env.example`

---

## Built by

**whitecoder** — engineered with React, Node.js, and Google Gemini AI
