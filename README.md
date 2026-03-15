<div align="center">

# MarketSense AI

**AI-Powered Financial Intelligence Terminal**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://market-sense-ai.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://marketsense-ai.onrender.com)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](./backend/package.json)

A real-time stock market intelligence app powered by Google Gemini AI, RAG (Retrieval-Augmented Generation), and MongoDB Atlas Vector Search. Ask natural language questions about any stock and get AI answers grounded in live financial news.

---

## Live Demo

| | Link |
|---|---|
| Frontend | [https://market-sense-ai.vercel.app](https://market-sense-ai.vercel.app) |
| Backend API | [https://marketsense-ai.onrender.com](https://marketsense-ai.onrender.com) |

</div>

---

## Features

- **Live Stock Data** — Real-time price tracking and 30-day price charts via Yahoo Finance
- **AI Chat** — Ask anything about a stock and get intelligent, context-aware answers
- **RAG Pipeline** — Answers are grounded in the latest ingested news, not hallucinated
- **Vector Search** — MongoDB Atlas semantic search matches your question to relevant articles
- **News Ingestion** — Fetch and embed financial news for any ticker on demand
- **Chat History** — Persistent conversation history per user, saved to MongoDB
- **Auth System** — Secure JWT-based login/register with HttpOnly cookie sessions
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| UI Components | shadcn/ui, Recharts, Lucide Icons |
| Backend | Node.js, Express 5, ES Modules |
| Database | MongoDB Atlas (with Vector Search) |
| AI / Embeddings | Google Gemini (`gemini-2.5-flash`, `gemini-embedding-001`) |
| Auth | JWT + bcryptjs + HttpOnly Cookies |
| Stock Data | Yahoo Finance 2, Finnhub API |
| Deployment | Vercel (frontend), Render (backend) |

---

## Architecture

```
User Question
     │
     ▼
Gemini Embedding Model
     │
     ▼
MongoDB Atlas Vector Search  ──→  Relevant News Articles
     │
     ▼
Gemini Flash (RAG Prompt)
     │
     ▼
AI Answer  ──→  Saved to Conversation History  ──→  Returned to UI
```

---

## Project Structure

```
MarketSense AI/
├── backend/                     # Express API
│   ├── src/
│   │   ├── app.js               # Express app, CORS, rate limiting
│   │   ├── server.js            # Entry point, DB connect
│   │   ├── constants.js         # DB name constant
│   │   ├── db/
│   │   │   └── index.js         # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   ├── news.model.js    # Stores articles + vector embeddings
│   │   │   └── conversation.model.js
│   │   ├── router/
│   │   │   ├── auth.router.js   # Register, login, logout, /me
│   │   │   ├── chat.router.js   # RAG chat engine
│   │   │   ├── news.router.js   # Fetch & ingest news
│   │   │   └── stocks.router.js # Live price + chart data
│   │   ├── services/
│   │   │   └── aiService.js     # Gemini embedding + save
│   ├── .env.example
│   └── package.json
│
├── frontend/                    # React + Vite app
│   ├── src/
│   │   ├── pages/
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
| `OPENROUTER_API_KEY` | Optional fallback key for DeepSeek/Llama via OpenRouter |
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
