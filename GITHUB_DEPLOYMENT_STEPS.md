# GitHub Frontend Replacement Guide

## 📋 Pre-Deployment Checklist

✅ All features tested locally
✅ Auth validation working
✅ No build errors
✅ Rate limiting fixed
✅ README updated
✅ Favicon included
✅ Production build: 8.6s compile, zero errors

---

## 🚀 Step 1: Prepare Local Repository

### 1.1 Backup Current Frontend (Optional)
```powershell
# Navigate to project root
cd "c:\Users\ASUS\OneDrive\Documents\MarketSense AI"

# Backup old frontend if needed
Rename-Item -Path frontend -NewName frontend-backup-$(Get-Date -Format 'yyyy-MM-dd')
```

### 1.2 Clean Local Repository
```powershell
# Remove old frontend folder from git tracking
git rm -r frontend --cached

# Rename front_new to frontend (or keep as is in root)
# Option A: Keep as front_new (recommended)
# Option B: Rename to frontend
# For now, we'll keep as front_new
```

---

## 🔄 Step 2: Configure Git

### 2.1 Set Git Config (if not already done)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@github.com"
```

### 2.2 Initialize/Update Remote
```powershell
# Check existing remote
git remote -v

# If remote exists, update it:
# git remote remove origin
# git remote add origin https://github.com/YOUR_USERNAME/MarketSense-AI.git

# Or just verify it points to correct repo:
git remote set-url origin https://github.com/YOUR_USERNAME/MarketSense-AI.git
```

---

## 📤 Step 3: Push Changes to GitHub

### 3.1 Stage All Files
```powershell
cd "c:\Users\ASUS\OneDrive\Documents\MarketSense AI"

# Stage all changes
git add .

# Verify what will be committed
git status
```

### 3.2 Commit Changes
```powershell
# Comprehensive commit message
git commit -m "Replace frontend: Next.js 16, production-ready with auth validation, fixed sidebar selection"

# Or more detailed:
git commit -m "feat: upgrade frontend to Next.js 16

- Migrate from React/Vite to Next.js 16 with Turbopack
- Implement comprehensive auth validation with specific error messages
- Fix sidebar chat selection (single select, no duplicates)
- Remove live price box from chart for cleaner UI
- Increase backend auth rate limits (10 -> 50 requests/15min)
- Clear Next.js Turbopack cache
- Update README with deployment instructions
- All features tested locally, zero build errors
- Favicon added and configured"
```

### 3.3 Push to GitHub
```powershell
# Push to main branch
git push origin main

# Or if you want to create a new branch first (safer):
git branch feature/next-js-frontend
git checkout feature/next-js-frontend
git push origin feature/next-js-frontend

# Then create PR on GitHub
```

**Check GitHub after push to verify files are there!**

---

## ⚙️ Step 4: Update Vercel Deployment

### 4.1 Login to Vercel
Go to: https://vercel.com/dashboard

### 4.2 Select Your Project
Click on your **MarketSense AI** project

### 4.3 Update Root Directory
1. Click **Settings** (top nav)
2. Go to **General** section
3. Find **Root Directory**
4. Change from `frontend` → `front_new`
5. Click **Save**

### 4.4 Set Environment Variables
1. Click **Settings** → **Environment Variables**
2. Add/Update:
   ```
   NEXT_PUBLIC_API_BASE_URL = https://marketsense-ai.onrender.com/api/v1
   ```
3. Click **Save**

### 4.5 Trigger Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on your latest commit
3. Or wait for automatic redeploy (next push)
4. Watch the logs for build completion (2-3 min)

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Vercel Build
- Wait for build to complete
- Verify: "Ready" status in Deployments
- Check logs for any errors (usually none)

### 5.2 Test Live URL
- Click deployment URL
- Test features:
  - ✅ Search ticker (TSLA, GOOGL)
  - ✅ Click sidebar chats (only one selects)
  - ✅ Send message
  - ✅ Chart displays
  - ✅ Price updates every 15s
  - ✅ Sign in/up works
  - ✅ Error messages show correctly

### 5.3 Monitor Analytics
- Check Vercel Analytics
- Monitor function invocations
- Review any error logs

---

## 🧹 Step 6: Clean Up (Optional)

### 6.1 Remove Backups
```powershell
# After confirming deployment works, clean up old folders
Remove-Item -Path "frontend-backup-*" -Recurse -Force
```

### 6.2 Update CI/CD (if applicable)
- If you have GitHub Actions, update workflow root directory
- Example: Change `working-directory: frontend` → `working-directory: front_new`

---

## 🔑 Credentials & Links

**Repository URL**: `https://github.com/YOUR_USERNAME/MarketSense-AI`

**Vercel Project**: https://vercel.com/dashboard/[your-project-name]

**Live URL Pattern**: `https://[project-name].vercel.app`

**Backend API**: `https://marketsense-ai.onrender.com/api/v1`

---

## 📊 Deployment Timeline

| Step | Time | Status |
|------|------|--------|
| Stage & commit | 1 min | ⏳ |
| Push to GitHub | 2 min | ⏳ |
| Vercel build | 2-3 min | ⏳ |
| Deploy & ready | 1 min | ⏳ |
| Testing | 5 min | ⏳ |
| **Total** | **~15 minutes** | ⏳ |

---

## ❌ Troubleshooting

### Build Fails on Vercel

**Error**: "front_new directory not found"
```
✅ Fix: Check Vercel Settings → Root Directory is set to "front_new"
```

**Error**: "NEXT_PUBLIC_API_BASE_URL not set"
```
✅ Fix: Add environment variable in Vercel Settings
```

**Error**: "Deploy stale (Next.js 16.2.0)"
```
✅ Fix: Clear .next cache and redeploy
   - git add .
   - git commit --allow-empty -m "Trigger rebuild"
   - git push origin main
```

### Features Not Working

**Chart not showing**
```
✅ Fix: Verify backend is running
✅ Check NEXT_PUBLIC_API_BASE_URL in browser DevTools
✅ Check browser console for API errors
```

**Auth errors (429)**
```
✅ Fix: Already fixed in backend app.js (max: 50 instead of 10)
✅ Verify backend is deployed and running
```

**Chat history empty**
```
✅ Fix: Check backend MongoDB connection
✅ Verify user is authenticated (check cookies)
✅ Check browser console for API errors
```

---

## 📝 Git Commands Reference

```powershell
# See all changes
git diff

# See staged changes
git diff --cached

# See commit history
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Hard undo (permanent)
git reset --hard HEAD~1

# Check branch
git branch -a

# Create feature branch
git checkout -b feature/name

# Merge to main
git checkout main
git merge feature/name
git push origin main
```

---

## ✨ Success Indicators

After deployment, you should see:

✅ **Vercel**: Shows "Ready" and green checkmark  
✅ **GitHub**: New commit in commit history  
✅ **Live Site**: Loads without errors  
✅ **Auth**: Login/signup works  
✅ **Charts**: Display with data  
✅ **Chat**: Messages save to history  
✅ **Performance**: Page loads in < 2 seconds  

---

## 📞 Next Steps

1. **Monitor**: Watch Vercel logs for 24 hours
2. **Test**: Have friends test the live site
3. **Feedback**: Collect feedback and log issues
4. **Iterate**: Fix any issues found in production
5. **Celebrate**: 🎉 You've deployed MarketSense AI!

---

**Ready to deploy? Let's go! 🚀**
