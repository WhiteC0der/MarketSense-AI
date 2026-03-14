import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import newsRouter from "./router/news.router.js";
import chatRouter from "./router/chat.router.js";
import stockRouter from "./router/stocks.router.js";
import authRouter from "./router/auth.router.js";
import cookieParser from "cookie-parser";
import protect from "./middleware/auth.middleware.js";

const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // Change this to your Vercel URL later
    credentials: true 
}));

// 3. Tell Express to parse cookies
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rate Limiting for expensive endpoints
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Max 30 requests per window
    message: "Too many chat requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

const ingestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 ingestion requests per hour per IP
    message: "Too many ingestion requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 login attempts per 15 min
    message: "Too many login attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

app.get("/", (req, res) => {
  res.json({ 
    message: "MarketSense AI API is running",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1/news", ingestLimiter, newsRouter);
app.use("/api/v1/chat", protect, chatLimiter, chatRouter);
app.use("/api/v1/stock", stockRouter);
app.use("/api/v1/auth", authLimiter, authRouter);
export default app;