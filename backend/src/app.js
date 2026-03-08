import express from "express";
import cors from "cors";
import newsRouter from "./router/news.router.js";
import chatRouter from "./router/chat.router.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/", (req, res) => {
  res.json({ 
    message: "MarketSense AI API is running",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1/news", newsRouter);
app.use("/api/v1/chat", chatRouter);


export default app;