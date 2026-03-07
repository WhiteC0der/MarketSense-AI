import express from 'express';
import axios from 'axios';
const router = express.Router();

// GET /api/news/:ticker
router.get('/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${formatDate(lastWeek)}&to=${formatDate(today)}&token=${process.env.FINNHUB_API_KEY}`;

        // Fetch data from Finnhub
        const response = await axios.get(url);

        // Finnhub might return 100 articles. We only want the top 10 to save AI tokens later.
        const topNews = response.data.slice(0, 10);

        res.status(200).json(topNews);

    } catch (error) {
        console.error("Finnhub API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch financial news" });
    }
});

export default router;