# MarketSense AI

**AI-Powered Financial Intelligence Platform**

Real-time stock analysis powered by **Google Gemini AI** and **MongoDB Vector Search**. Ask natural questions about any stock and get intelligent answers grounded in live financial news.

---

## 🚀 Live Demo

**Website**: https://market-sense-ai.vercel.app  

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
**whitecoder** — engineered with React, Node.js, and Google Gemini AI
