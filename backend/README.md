# MarketSense AI - Backend

AI-powered financial news assistant using RAG (Retrieval Augmented Generation) with Google Gemini embeddings and MongoDB Atlas vector search.

## 🎯 Features

- **News Ingestion**: Fetch financial news from Finnhub API for any stock ticker
- **Vector Embeddings**: Generate embeddings using Google Gemini embedding model
- **Semantic Search**: Query relevant news articles using MongoDB Atlas vector search
- **AI Chat**: Get intelligent answers about financial news using RAG architecture
- **Duplicate Prevention**: Automatically skip already-ingested articles

## 🏗️ Architecture

```
User Query → Gemini Embeddings → Vector Search → Context Retrieval → AI Response
```

## 📁 Folder Structure

```
backend/
├── src/
│   ├── app.js           # Express app configuration
│   ├── server.js        # Server entry point
│   ├── constants.js     # App constants
│   ├── db/
│   │   └── index.js     # MongoDB connection
│   ├── models/
│   │   └── news.model.js  # News schema with vector embeddings
│   ├── router/
│   │   ├── news.router.js # News fetch & ingestion endpoints
│   │   └── chat.router.js # AI chat endpoint
│   └── services/
│       └── aiService.js   # Gemini embedding & storage service
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (with vector search enabled)
- Finnhub API key
- Google AI Studio API key

### Install Dependencies
```bash
npm install
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
