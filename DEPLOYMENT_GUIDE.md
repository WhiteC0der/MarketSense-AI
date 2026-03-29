# MarketSense AI - Deployment Guide

## Overview

MarketSense AI is deployed across two main services:
- **Frontend**: Next.js 16 app on Vercel
- **Backend**: Express.js API on Render

This guide explains how to replace your existing Vercel frontend with the new Next.js version.

---

## Pre-Deployment Checklist

### Frontend (front_new/)

- [ ] `npm run build` completes successfully
- [ ] `npm start` runs without errors
- [ ] `.env.local` has correct `NEXT_PUBLIC_API_BASE_URL`
- [ ] All console warnings resolved
- [ ] README.md is professional and complete
- [ ] No v0 or placeholder references remain
- [ ] Favicon icons are in place

**Current Status**: ✅ All checks complete

### Backend (backend/)

- [ ] API running on port 3000
- [ ] MongoDB connection verified
- [ ] All environment variables set in Render
- [ ] No console errors

---

## Step-by-Step Deployment

### Option 1: Replace via GitHub (Recommended)

#### 1. Update Your GitHub Repository

```bash
cd /path/to/repo

# Remove old frontend folders
git rm -r frontend/
git rm -r front_new/

# If you want to keep old frontend as archive
git mv frontend frontend-archived

# Add the new frontend
git add front_new/
git commit -m "Replace frontend with Next.js 16 version"
git push origin main
```

#### 2. Update Vercel Settings

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **General**
3. Under "Root Directory", set to: `front_new`
4. Click **Save**

#### 3. Redeploy

1. In Vercel Dashboard, click **Deployments**
2. Click the **⋯ menu** on the latest deployment
3. Select **Redeploy**
4. Or wait for automatic redeploy on next git push

#### 4. Configure Environment

1. Go to **Settings** → **Environment Variables**
2. Ensure `NEXT_PUBLIC_API_BASE_URL` exists:
   ```
   Key: NEXT_PUBLIC_API_BASE_URL
   Value: https://marketsense-ai.onrender.com/api/v1
   ```
3. Click **Save**

---

### Option 2: Delete & Redeploy from Scratch

#### 1. Remove Old Vercel Project

```bash
# From Vercel CLI
vercel remove --yes
```

Or manually:
1. Go to **Vercel Dashboard** → Project Settings
2. Scroll to **Danger Zone**
3. Click **Delete Project**

#### 2. Deploy New Frontend

```bash
cd MarketSense\ AI/front_new

# Connect to Vercel
vercel link

# Deploy
vercel deploy --prod
```

#### 3. Configure Environment

Same as Option 1, Step 4 above.

---

### Option 3: Manual Upload to Vercel

#### 1. Build Locally

```bash
cd front_new
npm run build
```

#### 2. Upload via Vercel URL

1. Go to Vercel Dashboard
2. Create **New Project**
3. Upload `front_new/` folder
4. Set Root Directory to `.` (current folder)
5. Configure environment variables
6. Deploy

---

## Environment Variables

### Frontend (.env.local in front_new/)

```env
# Development (local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Production (Vercel)
NEXT_PUBLIC_API_BASE_URL=https://marketsense-ai.onrender.com/api/v1
```

### Backend (already deployed)

Verify on Render Dashboard:
- PORT → 3000
- NODE_ENV → production
- All database credentials set

---

## Verification After Deployment

```bash
# 1. Check frontend loads
curl https://your-vercel-domain.vercel.app/

# 2. Test login endpoint
curl https://marketsense-ai.onrender.com/api/v1/auth/me \
  -H "Cookie: token=your_token"

# 3. Test stock search
curl "https://marketsense-ai.onrender.com/api/v1/stocks/search?symbol=AAPL"

# 4. Verify chat history endpoint
curl "https://marketsense-ai.onrender.com/api/v1/chat/history" \
  -H "Cookie: token=your_token"
```

---

## Rollback Plan

If deployment fails:

### Rollback on Vercel

```bash
# Revert to previous deployment
vercel rollback
```

Or manually select previous deployment in Vercel Dashboard.

### Keep Old Frontend Available

Before deleting the old frontend:
1. Save the old `frontend/` folder locally
2. Create a `frontend-backup-v1/` branch in git
3. Tag current commit as `frontend-v1-archived`

```bash
git tag frontend-v1-archived
git branch frontend-backup-v1
git push origin --tags
```

---

## Performance Optimization

After deployment, optimize:

### 1. Vercel Analytics
```bash
npm install @vercel/analytics
```
Already integrated in `app/layout.tsx` ✅

### 2. Image Optimization
- Vercel auto-optimizes images via `<Image />` component
- Automatic Web P conversion for modern browsers

### 3. Cache Strategy
```
Cache-Control: public, max-age=31536000, immutable
```
Automatically applied to .next/static/ assets

### 4. Monitor Performance
1. Vercel Dashboard → **Analytics**
2. Check:
   - Core Web Vitals
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)

---

## Troubleshooting

### Error: "next not found"

```bash
# Reinstall dependencies on Vercel
vercel env pull .env.local
npm install
npm run build
```

### Error: "API calls failing"

Check environment variable is set:
```bash
vercel env list
```

If missing:
```bash
vercel env add NEXT_PUBLIC_API_BASE_URL https://marketsense-ai.onrender.com/api/v1
```

### Error: "Favicon not loading"

Ensure favicon files exist in `public/`:
```bash
ls -la front_new/public/ | grep icon
```

### Port Already in Use (Local Dev)

```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Or use different port
npm run dev -- -p 3002
```

---

## Database Backup (Before Major Changes)

```bash
# Create MongoDB Atlas backup
1. Go to MongoDB Atlas Dashboard
2. Click **Clustername** → **Backup**
3. Click **Trigger Backup Now**

# Or use MongoDB tools
mongodump --uri="mongodb+srv://..."
```

---

## CI/CD Pipeline (GitHub Actions - Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: front_new
```

---

## Post-Deployment Checklist

- [ ] Frontend loads at your Vercel URL
- [ ] Login/Register works
- [ ] Stock search returns results
- [ ] Chart displays correctly
- [ ] Chat sends and receives messages
- [ ] Price updates every 15 seconds
- [ ] Mobile responsive (test on device)
- [ ] No console errors in browser DevTools
- [ ] No 4xx/5xx errors in Vercel logs
- [ ] Favicon displays correctly in browser tab

---

## Support

For issues:
1. Check Vercel Logs: Dashboard → Deployments → Logs
2. Check Browser Console: DevTools → Console tab
3. Check API Status: `https://marketsense-ai.onrender.com/api/v1/health`

---

**Last Updated**: March 2026  
**Version**: 1.0.0  
**Next Steps**: Follow Option 1 or 2 above to deploy your new frontend.
