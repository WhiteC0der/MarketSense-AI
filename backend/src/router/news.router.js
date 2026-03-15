import express from 'express';
import axios from 'axios';
import { processAndSaveNews } from '../services/aiService.js';

const router = express.Router();

router.get('/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${formatDate(lastWeek)}&to=${formatDate(today)}&token=${process.env.FINNHUB_API_KEY}`;

        const response = await axios.get(url);
        const topNews = response.data.slice(0, 10);

        res.status(200).json(topNews);

    } catch (error) {
        console.error("Finnhub API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch financial news" });
    }
});

router.post('/ingest/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${formatDate(lastWeek)}&to=${formatDate(today)}&token=${process.env.FINNHUB_API_KEY}`;

        const response = await axios.get(url);
        const topNews = response.data.slice(0, 25);

        const savedCount = await processAndSaveNews(ticker, topNews);

        res.status(200).json({ 
            message: `Ingestion complete for ${ticker}`,
            articlesFetched: topNews.length,
            newArticlesEmbeddedAndSaved: savedCount
        });

    } catch (error) {
        console.error("Ingestion Error:", error.message);
        res.status(500).json({ error: "Failed to ingest financial news" });
    }
});

export default router;