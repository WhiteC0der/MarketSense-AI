// backend/routes/stockRoutes.js
import express from 'express';
import YahooFinance from 'yahoo-finance2';

const router = express.Router();

const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey', 'ripHistorical'] 
});

// ==========================================
// 1. MUST BE FIRST: The Translator Route
// ==========================================
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        const result = await yahooFinance.search(query);
        
        if (result.quotes && result.quotes.length > 0) {
            // Filter out random mutual funds/crypto, prioritize actual company stocks (EQUITY)
            const bestMatch = result.quotes.find(q => q.quoteType === 'EQUITY') || result.quotes[0];
            return res.status(200).json({ symbol: bestMatch.symbol });
        } else {
            return res.status(404).json({ error: "No valid ticker found." });
        }
    } catch (error) {
        console.error("Search API Error:", error.message);
        res.status(500).json({ error: "Failed to resolve ticker." });
    }
});

// ==========================================
// 2. MUST BE SECOND: The Data Route
// ==========================================
router.get('/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();

        const quote = await yahooFinance.quote(ticker);
        const currentPrice = quote.regularMarketPrice;

        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const period1 = thirtyDaysAgo.toISOString().split('T')[0];
        const period2 = today.toISOString().split('T')[0]; 

        const chartResult = await yahooFinance.chart(ticker, {
            period1: period1,
            period2: period2, 
            interval: '1d' 
        });

        if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
            return res.status(404).json({ error: "No chart data found." });
        }

        const formattedChartData = chartResult.quotes.map(day => ({
            date: day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: Number((day.close || 0).toFixed(2)) 
        }));

        formattedChartData.push({
            date: 'Live',
            price: Number(currentPrice.toFixed(2))
        });

        res.status(200).json({
            currentPrice: currentPrice,
            chartData: formattedChartData
        });

    } catch (error) {
        console.error("Yahoo Finance API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch live stock data" });
    }
});

export default router;