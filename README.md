<div align="center">

# 🧠 MarketSense AI

### AI-Powered Financial Intelligence Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Vercel-black?style=for-the-badge)](https://market-sense-ai.vercel.app)
[![AWS Deployment](https://img.shields.io/badge/☁️_AWS-EC2_Live-orange?style=for-the-badge)](http://16.171.162.230)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

> Ask natural language questions about any stock. Get AI-powered answers grounded in live financial news, real-time price charts, and semantic vector search.

</div>

---

## 🌐 Live Deployments

| Platform | URL | Stack |
|----------|-----|-------|
| **Vercel** (Frontend) | [market-sense-ai.vercel.app](https://market-sense-ai.vercel.app) | React + Vite CDN |
| **AWS EC2** (Full Stack) | [16.171.162.230](http://16.171.162.230) | Docker + Nginx + EC2 |

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📊 **Real-Time Stock Charts** | Live prices & 30-day interactive charts via Yahoo Finance |
| 🤖 **AI Chat (RAG)** | Ask questions about stocks, get answers grounded in live news |
| 🔍 **Semantic Vector Search** | Pinecone finds the most relevant news for each query |
| 📰 **News Ingestion Pipeline** | Auto-fetches, embeds & stores financial news per ticker |
| 💬 **Persistent Chat History** | Full conversation history saved per user session |
| 🔐 **Secure Auth** | JWT + HttpOnly cookies + Email OTP Verification |
| 📱 **Responsive UI** | Mobile-first premium design with micro-animations |






---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         MARKETSENSE AI SYSTEM                          │
│                                                                        │
│  ┌─────────────┐     HTTPS      ┌──────────────────────────────────┐  │
│  │   Browser   │ ─────────────► │         AWS EC2 (Stockholm)       │  │
│  │  (React 19) │                │  ┌─────────┐    ┌─────────────┐  │  │
│  └─────────────┘                │  │  Nginx  │───►│Docker:3000  │  │  │
│         │                       │  │ Port 80 │    │ Express API │  │  │
│         │ (Vercel CDN)          │  └─────────┘    └──────┬──────┘  │  │
│  ┌─────────────┐                └─────────────────────────┼────────┘  │
│  │   Vercel    │                                          │            │
│  │  (Frontend) │              ┌───────────────────────────┼──────────┐│
│  └─────────────┘              │         External Services  │          ││
│                               │                            ▼          ││
│                               │  ┌──────────┐  ┌──────────────────┐  ││
│                               │  │ MongoDB  │  │  Google Gemini   │  ││
│                               │  │  Atlas   │  │  2.5 Flash (AI)  │  ││
│                               │  └──────────┘  └──────────────────┘  ││
│                               │  ┌──────────┐  ┌──────────────────┐  ││
│                               │  │ Pinecone │  │  Yahoo Finance   │  ││
│                               │  │ Vectors  │  │  + Finnhub News  │  ││
│                               │  └──────────┘  └──────────────────┘  ││
│                               └───────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Query Workflow (RAG Pipeline)

```
User asks: "How is Apple performing after the iPhone launch?"
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   React Frontend │────►│  Express Backend  │────►│  Gemini AI        │
│   (Chat UI)      │     │  /api/v1/chat    │     │  Embed Question   │
└─────────────────┘     └──────────────────┘     └────────┬──────────┘
                                                           │ Vector
                                                           ▼
                                                  ┌───────────────────┐
                                                  │  Pinecone DB      │
                                                  │  Semantic Search  │
                                                  │  (Top 5 Articles) │
                                                  └────────┬──────────┘
                                                           │
                                                           ▼
                                                  ┌───────────────────┐
                                                  │  MongoDB Atlas    │
                                                  │  Fetch Full News  │
                                                  │  Article Content  │
                                                  └────────┬──────────┘
                                                           │
                                                           ▼
                                                  ┌───────────────────┐
                                                  │  Gemini AI (RAG)  │
                                                  │  News + Context   │
                                                  │  → Smart Answer   │
                                                  └────────┬──────────┘
                                                           │
                                                           ▼
                                                  ┌───────────────────┐
                                                  │  Save to MongoDB  │
                                                  │  Return to User   │
                                                  └───────────────────┘
```

---

## ☁️ Deployment Architecture (Docker + AWS)

```
  LOCAL MACHINE                  AWS CLOUD
  ─────────────                  ─────────────────────────────────────
                                 
  ┌──────────────┐  docker push  ┌──────────────────────────────────┐
  │ Dockerfile   │──────────────►│  Amazon ECR                      │
  │              │               │  (Private Docker Registry)       │
  │ Stage 1:     │               │  014548222185.dkr.ecr.eu-north-1 │
  │  Build React │               └──────────────┬───────────────────┘
  │              │                              │ docker pull
  │ Stage 2:     │                              ▼
  │  Node.js API │               ┌──────────────────────────────────┐
  │  + dist/     │               │  Amazon EC2 (t2.micro)           │
  └──────────────┘               │  Stockholm (eu-north-1)          │
                                 │                                  │
  ┌──────────────┐               │  ┌──────────┐ ┌──────────────┐  │
  │ GitHub       │               │  │  Nginx   │ │   Docker     │  │
  │ Repository   │               │  │ Port 80  │►│  Container   │  │
  └──────────────┘               │  │ (Proxy)  │ │  Port 3000   │  │
                                 │  └──────────┘ └──────────────┘  │
                                 │                                  │
                                 │  Security Group:                 │
                                 │  ✅ Port 22 (SSH - My IP only)   │
                                 │  ✅ Port 80 (HTTP - Public)      │
                                 └──────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI Framework |
| **Vite** | Build Tool & Dev Server |
| **Vanilla CSS** | Custom Design System |
| **Recharts** | Interactive Stock Charts |
| **Vercel** | CDN Hosting & Deployment |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 20 + Express 5** | REST API Server |
| **MongoDB Atlas** | User data, chat history, news articles |
| **Pinecone** | Vector database for semantic search |
| **Google Gemini 2.5 Flash** | AI embeddings & intelligent responses |
| **JWT + HttpOnly Cookies** | Secure authentication |
| **Nodemailer + Gmail** | Email OTP verification |

### Infrastructure & DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** | Multi-stage containerization (React + Node.js) |
| **Amazon ECR** | Private Docker image registry |
| **Amazon EC2** | Cloud virtual machine (t2.micro, Stockholm) |
| **Nginx** | Reverse proxy (Port 80 → Container Port 3000) |
| **AWS IAM** | Access management & security policies |

### Data APIs
| API | Purpose |
|-----|---------|
| **Yahoo Finance (yahoo-finance2)** | Real-time stock prices & chart data |
| **Finnhub** | Financial news & company news fallback |

---

## 📋 API Endpoints

### Authentication
```
POST   /api/v1/auth/register       Create account & send OTP
POST   /api/v1/auth/verify-email   Verify email with OTP
POST   /api/v1/auth/resend-otp     Resend verification OTP
POST   /api/v1/auth/login          Login (rate limited: 10 req/15min)
POST   /api/v1/auth/logout         Logout current device
POST   /api/v1/auth/logoutall      Logout all devices
GET    /api/v1/auth/me             Get current user profile
```

### AI Chat (Protected)
```
POST   /api/v1/chat             Send message → AI response (RAG)
GET    /api/v1/chat/history     Get all conversations
GET    /api/v1/chat/:chatId     Get conversation messages
```

### Stock Data
```
GET    /api/v1/stock/:ticker       Get live price + 30-day chart
GET    /api/v1/stock/search/:query Search stock tickers
```

### News
```
POST   /api/v1/news/ingest/:ticker  Fetch, embed & store news articles
GET    /api/v1/news/:ticker         Get stored news for a ticker
```

---

## 📂 Project Structure

```
MarketSense-AI/
├── 📄 dockerfile                 # Multi-stage Docker build
├── 📄 .dockerignore              # Docker build exclusions
│
├── frontend/                     # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # Login / Register / OTP forms
│   │   │   └── dashboard/        # Main app UI (Charts, Chat, News)
│   │   ├── context/              # AuthContext (global state)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # API client (axios) & utilities
│   │   ├── App.jsx               # Root component & routing
│   │   └── index.css             # Global design system styles
│   ├── vite.config.js            # Vite + Rollup config
│   └── vercel.json               # Vercel SPA rewrite rules
│
└── backend/                      # Express REST API
    └── src/
        ├── controllers/          # Route handlers
        │   ├── auth.controller.js
        │   ├── chat.controller.js
        │   ├── stocks.controller.js
        │   └── news.controller.js
        ├── models/               # MongoDB Mongoose schemas
        ├── router/               # Express route definitions
        ├── services/             # Business logic (Gemini AI, Pinecone)
        ├── middleware/           # Auth guard, validation
        ├── jobs/                 # Scheduled news ingestion tasks
        ├── app.js                # Express setup, CORS, middleware
        └── server.js             # Entry point, DB connection
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Google Gemini API key
- Pinecone account
- Finnhub API key

### 1. Clone the repository
```bash
git clone https://github.com/WhiteC0der/MarketSense-AI.git
cd MarketSense-AI
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Fill in your API keys in .env

npm run dev   # Runs on http://localhost:3000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev   # Runs on http://localhost:5173
```

---

## 🐳 Docker Deployment (AWS)

### Build & Push to AWS ECR
```bash
# 1. Build Docker image (embeds frontend + backend)
docker build \
  --build-arg VITE_API_BASE_URL=http://YOUR_EC2_IP:3000/api/v1 \
  -t marketsense-ai:latest .

# 2. Authenticate with AWS ECR
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com

# 3. Tag & Push
docker tag marketsense-ai:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/marketsense-ai:latest

docker push \
  YOUR_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/marketsense-ai:latest
```

### Run on EC2
```bash
# Pull from ECR & run
docker run -d \
  --name marketsense \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file ~/marketsense.env \
  YOUR_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/marketsense-ai:latest
```

---

## 🔒 Security Features

- ✅ **Password hashing** with bcryptjs (salt rounds: 12)
- ✅ **Email OTP Verification** for all new registrations
- ✅ **JWT authentication** stored in HttpOnly cookies (XSS-safe)
- ✅ **Rate limiting** on auth endpoints (10 req / 15 min in production)
- ✅ **CORS** configured for specific production domains only
- ✅ **AWS IAM** least-privilege access policies for ECR
- ✅ **EC2 Security Groups** — SSH restricted to known IPs only
- ✅ **Secrets never committed** — all keys via environment variables

---

## 🔧 Environment Variables

### Backend `.env`
```env
NODE_ENV=production
PORT=3000
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
MONGODB_NAME=marketsense
JWT_SECRET=<min-32-char-secret>
GEMINI_API_KEY=your-gemini-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX=news-vectors
FINNHUB_API_KEY=your-finnhub-key
GOOGLE_USER=your-gmail@gmail.com
GOOGLE_APP_PASSWORD=your-app-password
FRONTEND_URLS=https://market-sense-ai.vercel.app
```

### Frontend `.env`
```env
VITE_API_BASE_URL=https://your-backend-url/api/v1
```

---

## 📈 Development Status

| Feature | Status |
|---------|--------|
| JWT Auth + Email OTP | ✅ Production Ready |
| Real-Time Stock Charts | ✅ Production Ready |
| AI Chat (RAG Pipeline) | ✅ Production Ready |
| News Ingestion & Embedding | ✅ Production Ready |
| Docker Containerization | ✅ Production Ready |
| AWS EC2 Deployment | ✅ Live |
| Vercel Frontend Deployment | ✅ Live |
| Nginx Reverse Proxy | ✅ Configured |

---

<div align="center">

**Built by [WhiteC0der](https://github.com/WhiteC0der)**

⭐ Star this repo if you found it useful!

</div>
