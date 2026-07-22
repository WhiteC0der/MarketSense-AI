import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import RequestQueue from '../utils/requestQueue.js';

// Create a singleton yahoo-finance2 instance (v3.x class-based API)
const yahooFinance = new YahooFinance();


// --- Finnhub (fallback for search + quote) ---
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Queue with 1200ms delay between requests to avoid Yahoo rate limiting
const apiQueue = new RequestQueue(1200);

// --- Cache ---
const cacheStore = new Map();
const SEARCH_CACHE_TTL = 10 * 60 * 1000;
const QUOTE_CACHE_TTL  = 60 * 1000;
const CHART_CACHE_TTL  = 10 * 60 * 1000;

const getCache = (key) => {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) { cacheStore.delete(key); return null; }
    return entry.value;
};

const setCache = (key, value, ttl) => {
    cacheStore.set(key, { value, expiresAt: Date.now() + ttl });
};

/**
 * Try a list of async functions in order. Return the first success.
 */
const tryInOrder = async (fns) => {
    let lastError;
    for (const fn of fns) {
        if (!fn) continue;
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            console.warn(`[tryInOrder] Attempt failed: ${err.message}`);
        }
    }
    throw lastError;
};

// =====================
// Data fetchers
// =====================

// --- Quote ---

const quoteFromYahoo = async (ticker) => {
    const result = await yahooFinance.quote(ticker, {}, { validateResult: false });
    if (!result?.regularMarketPrice) throw new Error(`No Yahoo quote for ${ticker}`);
    return { regularMarketPrice: result.regularMarketPrice };
};

const quoteFromFinnhub = async (ticker) => {
    const { data } = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
        timeout: 10000,
        params: { symbol: ticker, token: FINNHUB_API_KEY },
    });
    if (!data?.c || data.c === 0) throw new Error(`No Finnhub quote for ${ticker}`);
    return { regularMarketPrice: data.c };
};

// --- Chart ---

const chartFromYahoo = async (ticker) => {
    // yahoo-finance2 chart() handles crumb + cookie automatically
    const result = await yahooFinance.chart(ticker, {
        period1: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 32); // 32 days back for ~1 month of trading days
            return d;
        })(),
        interval: '1d',
    }, { validateResult: false });

    const quotes = (result?.quotes || [])
        .filter(q => typeof q.close === 'number' && q.close > 0)
        .map(q => ({ date: new Date(q.date), close: q.close }));

    if (quotes.length === 0) throw new Error(`No chart data for ${ticker} from Yahoo`);
    return { quotes };
};

// --- Search ---

const searchFromYahoo = async (query) => {
    const result = await yahooFinance.search(query, {
        quotesCount: 25,
        newsCount: 0,
    }, { validateResult: false });
    return { quotes: Array.isArray(result?.quotes) ? result.quotes : [] };
};

const searchFromFinnhub = async (query) => {
    const { data } = await axios.get(`${FINNHUB_BASE_URL}/search`, {
        timeout: 12000,
        params: { q: query, token: FINNHUB_API_KEY },
    });
    const results = Array.isArray(data?.result) ? data.result : [];
    return {
        quotes: results
            .filter((item) => typeof item?.symbol === 'string' && item.symbol.trim().length > 0)
            .map((item) => ({
                symbol: item.symbol,
                shortname: item.description || item.symbol,
                longname: item.description || item.symbol,
                quoteType: 'EQUITY',
                exchange: item.exchange || ''
            }))
    };
};

// =====================
// Search scoring
// =====================

const normalize = (s = '') => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const isSimpleTicker = (s = '') => /^[A-Z]{1,5}$/.test(s);
const isDerived = (s = '') => /[.=]/.test(s) || /\d/.test(s);
const isGoodExchange = (e = '') => ['NMS', 'NYQ', 'ASE', 'BTS'].includes(e);

const scoreMatch = (quote, rawQuery) => {
    const q = normalize(rawQuery);
    const sym = normalize(quote.symbol || '');
    const short = normalize(quote.shortname || quote.shortName || '');
    const long = normalize(quote.longname || quote.longName || '');

    let score = 0;
    if (quote.quoteType === 'EQUITY') score += 50;
    if (isSimpleTicker(quote.symbol || '')) score += 20;
    if (isGoodExchange(quote.exchange || '')) score += 10;
    if (isDerived(quote.symbol || '')) score -= 30;
    if (sym === q) score += 100;
    if (short === q || long === q) score += 90;
    if (sym.startsWith(q)) score += 40;
    if (short.startsWith(q) || long.startsWith(q)) score += 35;
    if (short.includes(q) || long.includes(q)) score += 20;
    return score;
};

// =====================
// Route handlers
// =====================

/**
 * Search for a stock by ticker or company name
 */
export const searchStock = async (req, res) => {
    try {
        const query = req.params.query.trim();
        const cacheKey = `search:${query.toLowerCase()}`;

        let result = getCache(cacheKey);
        if (!result) {
            result = await tryInOrder([
                () => apiQueue.add(() => searchFromYahoo(query)),
                FINNHUB_API_KEY ? () => apiQueue.add(() => searchFromFinnhub(query)) : null,
            ]);
            setCache(cacheKey, result, SEARCH_CACHE_TTL);
        }

        if (!result.quotes || result.quotes.length === 0) {
            return res.status(404).json({ error: "No stock match found. Please type a proper company name or exact stock ticker." });
        }

        const equities = result.quotes.filter((q) => q.quoteType === 'EQUITY');
        if (equities.length === 0) {
            return res.status(404).json({ error: "No stock match found. Please type a proper company name or exact stock ticker." });
        }

        const preferred = equities.filter((q) => isSimpleTicker(q.symbol || '') && !isDerived(q.symbol || ''));
        const candidates = preferred.length > 0 ? preferred : equities;
        const ranked = [...candidates].sort((a, b) => scoreMatch(b, query) - scoreMatch(a, query));
        const best = ranked[0];

        if (scoreMatch(best, query) < 70) {
            return res.status(404).json({ error: "No stock match found. Please type a proper company name or exact stock ticker." });
        }

        return res.status(200).json({ symbol: best.symbol });
    } catch (error) {
        console.error("Search API Error:", error.message);
        res.status(500).json({ error: "Failed to resolve ticker." });
    }
};

/**
 * Get stock quote and chart data for a ticker
 */
export const getStockData = async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();

        // Quote: Yahoo Finance (with Finnhub fallback)
        let quote = getCache(`quote:${ticker}`);
        if (!quote) {
            quote = await tryInOrder([
                () => apiQueue.add(() => quoteFromYahoo(ticker)),
                FINNHUB_API_KEY ? () => apiQueue.add(() => quoteFromFinnhub(ticker)) : null,
            ]);
            setCache(`quote:${ticker}`, quote, QUOTE_CACHE_TTL);
        }
        const currentPrice = quote.regularMarketPrice;

        // Chart: Yahoo Finance via yahoo-finance2
        let chartResult = getCache(`chart:${ticker}`);
        if (!chartResult) {
            chartResult = await tryInOrder([
                () => apiQueue.add(() => chartFromYahoo(ticker)),
            ]);
            setCache(`chart:${ticker}`, chartResult, CHART_CACHE_TTL);
        }

        if (!chartResult?.quotes?.length) {
            return res.status(404).json({ error: "No chart data found." });
        }

        const chartData = chartResult.quotes
            .filter(day => typeof day.close === 'number' && day.close > 0)
            .map(day => ({
                date: day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                price: Number(day.close.toFixed(2))
            }));

        chartData.push({
            date: 'Live',
            price: Number(currentPrice.toFixed(2))
        });

        res.status(200).json({ currentPrice, chartData });
    } catch (error) {
        console.error("Stock Data Error:", error.message);
        res.status(500).json({ error: "Failed to fetch stock data." });
    }
};
