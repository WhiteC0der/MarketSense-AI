import express from "express";
import cors from "cors";
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

app.get("/", (req, res) => {
  res.json({ 
    message: "MarketSense AI API is running",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1/news", newsRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/stock", stockRouter);
app.use("/api/v1/auth", authRouter);
export default app;