# MarketSense AI - Frontend

A modern, responsive financial intelligence terminal built with **Next.js 16**, **React 19**, and **TypeScript**. Real-time stock analysis, AI-powered market insights, and intelligent trading signals.

**Status**: ✅ Production Ready | All Features Tested | Zero Build Errors

## 🚀 Features

- **Real-time Stock Charts**: Dynamic 30-day price charts with interactive tooltips (without live price box overlay)
- **Live Price Updates**: 15-second polling for current stock prices in header
- **AI Chat Interface**: Market analysis powered by Google Gemini AI
- **News Integration**: RAG-based source attribution for market news
- **Chat History**: Persistent conversation storage with sidebar navigation
- **Dynamic Ticker Search**: Auto-complete with symbol validation (auto-uppercase)
- **Responsive UI**: Mobile-first design with Tailwind CSS v4
- **Smooth Animations**: Framer Motion for delightful interactions
- **Comprehensive Auth**: Login/register with password confirmation and detailed validation
- **Error Handling**: User-friendly error messages with HTTP status logging

## 📋 Tech Stack

- **Framework**: Next.js 16.2.0 with Turbopack
- **Language**: TypeScript & JSX
- **Styling**: Tailwind CSS v4
- **Components**: Recharts (charts), Sonner (toasts), Lucide Icons
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Animations**: Framer Motion
- **HTTP Client**: Fetch API with custom wrapper
- **Authentication**: httpOnly cookies + JWT

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
cd MarketSense\ AI/front_new

# Install dependencies
npm install
# OR
pnpm install
# OR
bun install

# Create environment file
cp .env.example .env.local
# Update API_BASE_URL in .env.local if needed
```

### Running Locally

```bash
# Development server (hot reload)
npm run dev
# Opens at http://localhost:3001 (or next available port)

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run lint

# Run tests
npm run test
```

## 📁 Project Structure

```
front_new/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.jsx           # Home/dashboard page
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── auth/              # Authentication UI
│   ├── dashboard/         # Main dashboard components
│   │   ├── Dashboard.jsx        # Main orchestrator
│   │   ├── Header.jsx          # Search & live price
│   │   ├── StockChart.jsx      # Interactive chart
│   │   ├── ChatMessages.jsx    # Message display
│   │   ├── ChatInput.jsx       # Message input
│   │   ├── Sidebar.jsx         # Chat history
│   │   └── SourceCards.jsx     # News sources
│   ├── ui/                # UI component library
│   └── theme-provider.tsx # Dark mode provider
├── context/              # React context
│   └── AuthContext.tsx    # Auth state & methods
├── hooks/                # Custom React hooks
│   ├── use-mobile.ts     # Mobile detection
│   └── use-toast.ts      # Toast notifications
├── lib/                  # Utilities & helpers
│   ├── api.ts            # API client with endpoints
│   └── utils.ts          # Helper functions
├── public/               # Static assets
│   ├── favicon icons
│   └── placeholder images
├── styles/               # CSS modules
└── tsconfig.json         # TypeScript config
```

## 🔑 Environment Variables

Create a `.env.local` file in the root:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

## 🌐 Deployment

### Vercel (Recommended - Production)

#### Option 1: Update Existing Deployment
If you already have a Vercel project deployed:

1. **Push to GitHub** (your existing repo)
   ```bash
   git add .
   git commit -m "Update frontend: improved auth, fixed sidebar selection, removed live price box"
   git push origin main
   ```

2. **Update Vercel Root Directory**
   - Go to Vercel Dashboard → Your Project
   - Settings → General → Root Directory
   - Change from `frontend` → `front_new`
   - Click Save

3. **Set Environment Variables** (if not already set)
   - Settings → Environment Variables
   - Add/Update: `NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com/api/v1`
   - Example: `https://marketsense-ai.onrender.com/api/v1`

4. **Redeploy**
   - Go to Deployments
   - Click Redeploy on latest commit (or wait for auto-deploy)
   - Monitor build logs for any errors

#### Option 2: Deploy as New Project
If you want a fresh deployment:

1. **Create new GitHub repo** (optional)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: MarketSense AI Frontend"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/marketsense-ai-frontend.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Paste your GitHub repo URL
   - Click Import

3. **Configure Project**
   - Project Name: `marketsense-ai-frontend`
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `.` (current, no subfolder)
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   - `NEXT_PUBLIC_API_BASE_URL` = Backend API URL
   - Example: `https://marketsense-ai.onrender.com/api/v1`

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Visit your deployment URL

### Local Testing Before Deploy

```bash
# Install dependencies
npm install

# Create .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Run dev server
npm run dev
# Opens at http://localhost:3001

# Test production build
npm run build
npm start
# Opens at http://localhost:3000
```

### Manual Deployment (Self-Hosted)

```bash
# Build optimized bundle
npm run build

# Test production locally
npm start

# Copy `.next/` and `public/` directories to your server
# Or use Docker for containerized deployment
```

## 🔌 API Integration

The frontend communicates with the backend at `/api/v1`:

- **Stock Search**: `GET /stocks/search?symbol=AAPL`
- **Stock Chart**: `GET /stocks/{symbol}/chart`
- **Chat Messages**: `POST /chat` with question, ticker, chatId
- **Chat History**: `GET /chat/history`
- **News Ingest**: `POST /news/ingest?symbol=AAPL`

See [API Documentation](../backend/README.md) for full details.

## 🧪 Testing & Quality

```bash
# Type checking
npm run lint

# Build validation
npm run build

# Check for unused imports
npm run build -- --debug
```

## 📱 Responsive Design

- **Mobile-First**: Components scale beautifully from 320px+
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: 1024px+
- **Touch-Friendly**: Larger tap targets for mobile users

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance (WCAG AA)

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic with Next.js route-based chunks
- **Image Optimization**: Next.js Image component
- **CSS Optimization**: Tailwind CSS purging unused styles
- **Bundle Size**: ~250KB gzipped (with dependencies)

## 🔐 Security

- **CORS**: Requests use credentials for auth cookies
- **Input Validation**: All forms validated client & server-side
- **XSS Protection**: React auto-escapes content
- **Email Validation**: RFC 5322 compliant regex check
- **Password Requirements**: Min 6 characters, confirmation on signup
- **Rate Limiting**: Backend enforces request rate limits (50 auth requests/15min)
- **Auth Errors**: Specific, helpful error messages for failed login/signup

## 🆕 Recent Improvements (v1.0.0)

### Fixed Issues
- ✅ **Sidebar Selection**: Only one chat highlights at a time
- ✅ **Live Price Box**: Removed from chart for cleaner UI
- ✅ **Auth Validation**: Comprehensive client-side + API error handling
- ✅ **Rate Limiting**: Increased backend auth limits (10 → 50 req/15min)
- ✅ **Error Messages**: User-friendly, specific guidance for authentication issues
- ✅ **Turbopack Cache**: Cleared and optimized build process

### Error Handling
The auth page now provides specific error messages for:
- Empty email/password fields
- Invalid email format
- User not found (login)
- Incorrect password
- Email already exists (signup)
- Password too short or mismatch
- Generic API errors with fallback messages


---

**Last Updated**: March 29, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready  
