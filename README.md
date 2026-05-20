# MarketSense AI

**AI-Powered Financial Intelligence Platform**

Real-time stock analysis powered by **Google Gemini AI** and **MongoDB Vector Search**. Ask natural questions about any stock and get intelligent answers grounded in live financial news.

---

## 🚀 Live Demo

**Website**: https://market-sense-ai-ten.vercel.app/

---

## ✨ Key Features

- 📊 **Real-Time Stock Data** — Live prices, 30-day interactive charts, ticker search
- 🤖 **AI Chat** — Ask questions about stocks, get intelligent answers powered by Gemini AI
- 🔍 **Semantic Search** — MongoDB Vector Search matches questions to relevant news
- 📰 **Live News** — Automatic financial news ingestion and AI-powered analysis
- 💾 **Chat History** — Persistent conversations saved per user
- 🔐 **Secure Auth** — JWT authentication with HttpOnly cookies
- 📱 **Responsive UI** — Mobile-first design with modern, premium aesthetics

---

## 🛠️ Tech Stack

**Frontend**
- React 19 with Vite
- Vanilla CSS (custom design system)
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
FRONTEND_URLS=https://market-sense-ai-ten.vercel.app
```

### Frontend `.env`
```env
VITE_API_BASE_URL=https://marketsense-ai.onrender.com/api/v1
```

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### Build for Production

```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
npm run build
npm start
```

---

## 📂 Project Structure

```
MarketSense-AI/
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Login / Register forms
│   │   │   └── dashboard/   # Main app UI
│   │   ├── context/         # AuthContext (state management)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client & utilities
│   │   ├── App.jsx          # Root component & routing
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html           # HTML entry
│   ├── vite.config.js       # Vite configuration
│   └── vercel.json          # Vercel SPA rewrite rules
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── router/          # API endpoints
│   │   ├── services/        # Business logic (Gemini AI)
│   │   ├── middleware/      # Auth & validation
│   │   └── app.js           # Express setup
│   └── package.json
│
└── README.md                 # This file
```

---

## 💡 How It Works

1. **User registers** with email/password
2. **User logs in** and accesses the dashboard
3. **User searches** for a stock ticker
4. **Charts load** with live price data
5. **User asks a question** about the stock
6. **AI analyzes** relevant news articles via vector search
7. **Gemini AI** generates an intelligent, sourced answer
8. **Conversation saved** to user's chat history

---

## 🔒 Security

- ✅ Password hashing with bcryptjs
- ✅ JWT authentication with HttpOnly cookies
- ✅ CORS configured for production domains
- ✅ Rate limiting on auth endpoints (10 req/15min)
- ✅ Input validation & error handling
- ✅ MongoDB vector search on encrypted connections

---

## 🌐 Deployment

**Frontend**: Deployed on Vercel with automatic GitHub deployments
**Backend**: Deployed on Render with auto-deployment on push

Current Production:
- **Frontend**: https://market-sense-ai-ten.vercel.app
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

## 📞 Contact & Support

For issues or questions, please open an issue on the repository or contact via email.

---

**Built by WhiteC0der**
