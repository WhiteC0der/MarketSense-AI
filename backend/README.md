# MarketSense AI - Backend

Node.js/Express API for AI-powered financial market intelligence. Provides real-time stock data, AI chat with Retrieval-Augmented Generation (RAG), and secure user authentication.

**Live API**: https://marketsense-ai.onrender.com

---

## ✨ Features

- **Authentication** — Secure JWT + bcrypt password hashing with HttpOnly cookies
- **AI Chat with RAG** — Google Gemini-powered responses grounded in live financial news
- **Vector Search** — MongoDB Atlas vector search for semantic news retrieval
- **Stock Data** — Real-time prices, charts, and historical data
- **Chat History** — Persistent conversation storage per user
- **News Ingestion** — Automatic financial news fetching and embedding
- **Rate Limiting** — Built-in protection against abuse
- **Error Handling** — Comprehensive error responses with proper HTTP status codes

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express 5 |
| **Language** | JavaScript (ES Modules) |
| **Authentication** | JWT + bcryptjs |
| **Database** | MongoDB Atlas + Vector Search |
| **AI/Embeddings** | Google Gemini 2.5 Flash + Gemini Embedding |
| **Data Sources** | Yahoo Finance, Finnhub API |
| **Deployment** | Render |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (vector search enabled)
- Google AI API key
- Finnhub API key
- Yahoo Finance 

### Installation

```bash
cd backend
npm install
```

### Environment Setup

Create `.env`:

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your-secret-key-here

# AI & APIs
GEMINI_API_KEY=your-gemini-key
FINNHUB_API_KEY=your-finnhub-key

# CORS
FRONTEND_URLS=https://market-sense-ai.vercel.app
```

### Run Server

```bash
npm start
```

Server starts on `http://localhost:5000`

---

## 📁 Project Structure

```
backend/src/
├── app.js                 # Express app & middleware
├── server.js              # Server entry point
├── constants.js           # App constants
├── db/
│   └── index.js          # MongoDB connection
├── models/
│   ├── user.model.js     # User schema
│   ├── conversation.model.js  # Chat conversations
│   └── news.model.js     # News with embeddings
├── router/
│   ├── auth.router.js    # Auth endpoints
│   ├── chat.router.js    # Chat & RAG endpoints
│   ├── news.router.js    # News ingestion
│   └── stocks.router.js  # Stock data
├── middleware/
│   └── auth.middleware.js # JWT verification
├── services/
│   └── aiService.js      # Gemini API calls
├── jobs/
│   └── newsJob.js        # Background news fetching
└── utils/
    └── requestQueue.js   # Request management
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/register      Register new user
POST   /api/v1/auth/login         Login (returns JWT cookie)
POST   /api/v1/auth/logout        Clear session
GET    /api/v1/auth/me            Get current user
```

### Chat & Conversations
```
POST   /api/v1/chat               Send message (RAG-powered)
GET    /api/v1/chat/history       List conversations
GET    /api/v1/chat/:chatId       Get conversation details
```

### Stock Data
```
GET    /api/v1/stock/:ticker      Get price & 30-day chart
GET    /api/v1/stock/search/:query  Search stocks
```

---

## 🏗️ RAG Architecture

```
User Message
    ↓
Embed with Gemini Embedding Model
    ↓
MongoDB Vector Search (semantic matching)
    ↓
Retrieve top 3 relevant news articles
    ↓
Feed to Gemini 2.5 Flash with system prompt
    ↓
Generate grounded response with sources
    ↓
Save conversation to database
    ↓
Return to client
```

---

## 🌐 Deployment

Deployed on **Render** with automatic deployments from GitHub.

**Production URL**: https://marketsense-ai.onrender.com

---

## 🔒 Security

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens stored in HttpOnly cookies
- CORS configured for production domains
- Rate limiting on auth endpoints (10 requests/15 min)
- Request validation on all inputs

---

## 📊 Database Models

### User
```javascript
{
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  ticker: String,
  messages: [{
    role: 'user' | 'ai',
    content: String,
    sources: [{ headline, summary, url }]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### News
```javascript
{
  ticker: String,
  headline: String,
  summary: String,
  url: String,
  source: String,
  embedding: [Float32], // 768-dimensional vector
  createdAt: Date
}
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net
PORT=3000
FINNHUB_API_KEY=your_finnhub_api_key
GEMINI_API_KEY=your_google_ai_api_key
```

### MongoDB Atlas Setup
1. Create a vector search index named `vector_index` on the `news` collection
2. Configure the index with field `embedding` and dimensions matching Gemini's output (typically 768)

### Run Development Server
```bash
npm run dev
```

Server runs at: http://localhost:3000

## 📡 API Endpoints

### GET /api/v1/news/:ticker
Fetch latest news for a stock ticker from Finnhub.

**Example:**
```bash
GET /api/v1/news/AAPL
```

### POST /api/v1/news/ingest/:ticker
Fetch news, generate embeddings, and save to MongoDB.

**Example:**
```bash
POST /api/v1/news/ingest/AAPL
```

**Response:**
```json
{
  "message": "Ingestion complete for AAPL",
  "articlesFetched": 10,
  "newArticlesEmbeddedAndSaved": 8
}
```

### POST /api/v1/chat
Ask questions about ingested financial news using AI.

**Request Body:**
```json
{
  "question": "What is the latest news about Apple's stock?"
}
```

**Response:**
```json
{
  "answer": "Based on recent news...",
  "sources": [
    {
      "headline": "Apple announces...",
      "summary": "...",
      "score": 0.87
    }
  ]
}
```

## 🛠️ Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB Atlas (with vector search)
- **AI/ML**: Google Gemini (embeddings & generation)
- **External APIs**: Finnhub (financial news)
- **ODM**: Mongoose
- **Environment**: Node.js + ES Modules

## 📦 Key Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "@google/genai": "^1.0.0",
  "axios": "^1.6.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

## 🔧 Development

```bash
npm run dev    # Start with nodemon
npm start      # Production start
```

## 📝 Notes

- Articles are fetched from the last 7 days
- Top 10 articles are processed to optimize API usage
- Duplicate URLs are automatically skipped during ingestion
- Vector search returns top 3 most relevant articles
