# ✅ Pre-Deployment Checklist

Complete this checklist before pushing to GitHub.

## 🧪 Local Testing (Do This First!)

### Functionality Tests
- [ ] Open app at `http://localhost:3001`
- [ ] **Sign In/Up Page**
  - [ ] Invalid email shows error
  - [ ] Empty password shows error
  - [ ] Login with wrong password shows "Incorrect email or password"
  - [ ] Create account with mismatched passwords shows error
  - [ ] Successful login redirects to dashboard
  - [ ] Successful signup creates account

### Dashboard Tests
- [ ] Page loads without errors
- [ ] Top-left logo/title visible
- [ ] Search bar appears at top
- [ ] Sidebar shows "New Scan" button
- [ ] Chat area displays "Welcome to MarketSense AI"

### Ticker Search Tests
- [ ] Type ticker symbol (e.g., "tsla")
- [ ] Auto-converts to uppercase "TSLA"
- [ ] Chart loads with data
- [ ] X-axis shows dates properly
- [ ] Y-axis shows prices without cutoff
- [ ] Chart animates smoothly

### Price Update Tests
- [ ] Live price displays in header
- [ ] Updates every 15 seconds (check refresh)
- [ ] Price changes as data updates
- [ ] No "Live" price box overlay on chart (removed)

### Chat Tests
- [ ] Can type in chat input
- [ ] Send message button works
- [ ] Message appears in chat area
- [ ] Message saves to sidebar history
- [ ] Click sidebar chat loads that conversation
- [ ] Only ONE sidebar item highlights when selected
- [ ] Switch to different ticker changes chart

### Sidebar Tests
- [ ] Chat history displays properly
- [ ] Timestamps show "X mins/hours/days ago"
- [ ] Click different chats - only ONE selects
- [ ] "New Scan" button clears everything
- [ ] Sidebar collapses/expands toggle works

### Error Handling Tests
- [ ] Network error (disconnect backend) shows toast
- [ ] Invalid API response handled gracefully
- [ ] Refresh page doesn't cause errors
- [ ] Console has NO red error messages

### Browser Tests
- [ ] Chrome/Edge: works fine
- [ ] Firefox: works fine
- [ ] Safari: works fine
- [ ] Mobile responsive (F12 → Device mode)
  - [ ] Works on iPhone (375px)
  - [ ] Works on iPad (768px)
  - [ ] All buttons tappable

### Performance Tests
- [ ] Page loads within 2 seconds
- [ ] Chart renders without lag
- [ ] Input is responsive (no delay)
- [ ] Sidebar scrolls smoothly

---

## 🔧 Code Quality

### Files Check
- [ ] No console.error() messages (unless intentional)
- [ ] No console.warn() about middleware
- [ ] No TypeScript errors (run: `npm run lint`)
- [ ] No unused imports
- [ ] No commented-out code blocks

### Build Check
```powershell
npm run build
```
- [ ] Build succeeds without errors
- [ ] No warnings during build
- [ ] Output shows "ready for production"
- [ ] Build time reasonable (< 30 seconds)

### Vercel Deploy Simulation
```powershell
npm run build
npm start
```
- [ ] Production build launches at http://localhost:3000
- [ ] All features work in production mode
- [ ] No degradation compared to dev

---

## 📄 Documentation

### README.md
- [ ] Updated with current version (1.0.0)
- [ ] Deployment instructions clear
- [ ] Features list matches actual features
- [ ] Tech stack accurate
- [ ] Environment variables documented

### .env.local
- [ ] `NEXT_PUBLIC_API_BASE_URL` set correctly
- [ ] Points to backend service
- [ ] .env.local is in .gitignore (not committed)

### Other Files
- [ ] .gitignore excludes node_modules, .next, .env.local
- [ ] package.json has correct scripts
- [ ] No old v0 references anywhere
- [ ] Favicon (icon.svg) exists in public/

---

## 🌐 Backend Status

Before pushing, verify backend:

```powershell
# Check backend is running
curl http://localhost:3000/api/v1/auth/me

# Should return 401 (unauthorized) not 429 (rate limited)
```

- [ ] Backend server running on port 3000
- [ ] MongoDB connected
- [ ] No 429 errors in frontend console
- [ ] Auth rate limit increased to 50 (verified)

---

## 🔐 Security Check

- [ ] No API keys in code
- [ ] No hardcoded passwords
- [ ] No sensitive URLs hardcoded
- [ ] Email validation working
- [ ] Password min length 6 characters
- [ ] Confirm password validation works

---

## 📤 Git Preparation

### Repository Status
```powershell
cd "c:\Users\ASUS\OneDrive\Documents\MarketSense AI"
git status
```

Check:
- [ ] No untracked files (except .next, node_modules)
- [ ] .gitignore is working properly
- [ ] Only desired files staged
- [ ] Commit message is descriptive

### Before Commit
- [ ] Delete any temporary files
- [ ] Remove node_modules if too large (git will ignore anyway)
- [ ] Clear .next folder
- [ ] Verify .gitignore includes `.next`, `.env.local`

---

## ✨ Final Checklist

- [ ] All tests passed locally
- [ ] README updated
- [ ] Build succeeds with zero errors
- [ ] Production build works
- [ ] No console errors
- [ ] Git status clean
- [ ] Commit message written
- [ ] Backend running and healthy
- [ ] Ready to push!

---

## 🚀 Ready to Deploy?

If all boxes are checked, proceed with:

```powershell
# Stage files
git add .

# Commit
git commit -m "Replace frontend: Next.js 16 with auth validation & improvements"

# Push to GitHub
git push origin main

# Then update Vercel:
# 1. Go to vercel.com/dashboard
# 2. Settings → Root Directory → Change to 'front_new'
# 3. Add NEXT_PUBLIC_API_BASE_URL environment variable
# 4. Redeploy
```

---

**Good luck! 🎉**
