# MarketSense AI - Backend

## 📁 Folder Structure

```
backend/
├── src/
│   ├── controllers/    # Route controllers (business logic)
│   ├── db/            # Database configuration
│   │   └── index.js   # MongoDB connection
│   ├── middleware/    # Express middleware
│   ├── models/        # Mongoose schemas/models
│   ├── router/        # API routes
│   └── constants.js   # App constants
├── index.js           # Express app configuration
├── server.js          # Server entry point
├── .env               # Environment variables (not in git)
├── .gitignore         # Git ignore rules
└── package.json       # Dependencies
```

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create a `.env` file with:
```env
MONGODB_URL=your_mongodb_connection_string
MONGODB_NAME=your_database_name
PORT=3000
```

### Run Development Server
```bash
npm run dev
```

Server will run on: http://localhost:3000

## 📦 Dependencies
- Express.js - Web framework
- Mongoose - MongoDB ODM
- CORS - Cross-origin resource sharing
- Dotenv - Environment variables
- Nodemon - Auto-restart dev server

## ✅ Fixed Issues
- ✅ Renamed `modals/` → `models/` (correct naming)
- ✅ Fixed ES module imports (added .js extensions)
- ✅ Fixed MongoDB connection with proper error handling
- ✅ Added CORS and JSON parsing middleware
- ✅ Fixed .env password interpolation
- ✅ Added .gitignore for security
