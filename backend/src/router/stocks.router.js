// backend/routes/stockRoutes.js
import express from 'express';
import YahooFinance from 'yahoo-finance2';

const router = express.Router();

// 1. Instantiate the library and suppress the terminal warnings
const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey', 'ripHistorical'] 
});

// GET /api/stock/:ticker
router.get('/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();

        // 1. Fetch the exact Real-Time Quote
        const quote = await yahooFinance.quote(ticker);
        const currentPrice = quote.regularMarketPrice;

        // 2. Fetch actual 30-Day Historical Data 
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Yahoo Finance v3 strictly requires BOTH period1 and period2
        const period1 = thirtyDaysAgo.toISOString().split('T')[0];
        const period2 = today.toISOString().split('T')[0]; 

        // Use the new .chart() method instead of the deprecated .historical()
        const chartResult = await yahooFinance.chart(ticker, {
            period1: period1,
            period2: period2, 
            interval: '1d' 
        });

        // The new chart() method returns the array inside a "quotes" object
        if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
            return res.status(404).json({ error: "No chart data found." });
        }

        // 3. Format the data perfectly for your Recharts UI
        const formattedChartData = chartResult.quotes.map(day => ({
            date: day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            // Fallback to 0 if Yahoo occasionally returns null on a zero-volume trading day
            price: Number((day.close || 0).toFixed(2)) 
        }));

        // We append the live market price to the very end of the graph
        formattedChartData.push({
            date: 'Live',
            price: Number(currentPrice.toFixed(2))
        });

        // 4. Send it to React
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