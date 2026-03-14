// backend/routes/stockRoutes.js
import express from 'express';
import YahooFinance from 'yahoo-finance2';

const router = express.Router();

const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey', 'ripHistorical'] 
});

const normalizeSearchText = (value = '') =>
    value.toLowerCase().replace(/[^a-z0-9]/g, '');

const scoreQuoteMatch = (quote, rawQuery) => {
    const query = normalizeSearchText(rawQuery);
    const symbol = normalizeSearchText(quote.symbol || '');
    const shortName = normalizeSearchText(quote.shortname || '');
    const longName = normalizeSearchText(quote.longname || '');

    let score = 0;

    if (quote.quoteType === 'EQUITY') score += 50;
    if (symbol === query) score += 100;
    if (shortName === query || longName === query) score += 90;
    if (symbol.startsWith(query)) score += 40;
    if (shortName.startsWith(query) || longName.startsWith(query)) score += 35;
    if (shortName.includes(query) || longName.includes(query)) score += 20;

    return score;
};

// ==========================================
// 1. MUST BE FIRST: The Translator Route
// ==========================================
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query.trim();
        const result = await yahooFinance.search(query);
        
        if (result.quotes && result.quotes.length > 0) {
            const rankedQuotes = [...result.quotes].sort(
                (left, right) => scoreQuoteMatch(right, query) - scoreQuoteMatch(left, query)
            );

            const bestMatch = rankedQuotes[0];
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