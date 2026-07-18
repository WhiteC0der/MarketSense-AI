import axios from 'axios';
import RequestQueue from '../utils/requestQueue.js';

// --- Alpaca Market Data API (primary) ---
const ALPACA_API_KEY_ID = process.env.ALPACA_API_KEY_ID;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;

const alpacaDataApi = axios.create({
    baseURL: 'https://data.alpaca.markets/v2',
    timeout: 12000,
    headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY_ID || '',
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY || '',
    },
});

// --- Yahoo Finance (fallback for search + chart/quote fallback) ---
const YAHOO_PUBLIC_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json,text/plain,*/*',
    'Origin': 'https://finance.yahoo.com',
    'Referer': 'https://finance.yahoo.com/'
};

const yahooPublicApi = axios.create({
    baseURL: 'https://query1.finance.yahoo.com',
    timeout: 12000,
    headers: YAHOO_PUBLIC_HEADERS
});

// --- Finnhub (fallback for search) ---
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Queue with 1500ms delay between requests to avoid Yahoo Finance rate limiting
const apiQueue = new RequestQueue(1500);

// --- Cache ---
const cacheStore = new Map();
const SEARCH_CACHE_TTL = 10 * 60 * 1000;
const QUOTE_CACHE_TTL = 60 * 1000;
const CHART_CACHE_TTL = 10 * 60 * 1000;

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
        }
    }
    throw lastError;
};

// =====================
// Data fetchers
// =====================

// --- Quote ---

const quoteFromAlpaca = async (ticker) => {
    const { data } = await alpacaDataApi.get(`/stocks/${ticker}/trades/latest`, {
        params: { feed: 'iex' },
    });
    const price = Number(data?.trade?.p);
    if (!Number.isFinite(price) || price <= 0) {
        throw new Error(`No quote for ${ticker} from Alpaca`);
    }
    return { regularMarketPrice: price };
};

const quoteFromYahoo = async (ticker) => {
    const { data } = await yahooPublicApi.get('/v7/finance/quote', {
        params: { symbols: ticker }
    });
    const quote = data?.quoteResponse?.result?.[0];
    if (!quote?.regularMarketPrice) {
        throw new Error(`No quote for ${ticker} from Yahoo`);
    }
    return { regularMarketPrice: quote.regularMarketPrice };
};

// --- Chart ---

const chartFromAlpaca = async (ticker) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await alpacaDataApi.get(`/stocks/${ticker}/bars`, {
        params: {
            timeframe: '1Day',
            start: thirtyDaysAgo.toISOString(),
            end: now.toISOString(),
            limit: 50,
            adjustment: 'split',
            feed: 'iex',
        },
    });

    const bars = Array.isArray(data?.bars) ? data.bars : [];
    if (bars.length === 0) {
        throw new Error(`No chart data for ${ticker} from Alpaca`);
    }

    return {
        quotes: bars
            .map((bar) => {
                const close = Number(bar.c);
                if (!Number.isFinite(close) || close <= 0) return null;
                return { date: new Date(bar.t), close };
            })
            .filter(Boolean),
    };
};

const chartFromYahoo = async (ticker) => {
    const { data } = await yahooPublicApi.get(`/v8/finance/chart/${ticker}`, {
        params: { interval: '1d', range: '1mo', includePrePost: false }
    });

    const result = data?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];

    const quotes = timestamps
        .map((ts, i) => {
            const close = closes[i];
            if (typeof close !== 'number' || !Number.isFinite(close) || close <= 0) return null;
            return { date: new Date(ts * 1000), close };
        })
        .filter(Boolean);

    if (quotes.length === 0) throw new Error(`No chart data for ${ticker} from Yahoo`);
    return { quotes };
};

// --- Search ---

const searchFromYahoo = async (query) => {
    const { data } = await yahooPublicApi.get('/v1/finance/search', {
        params: { q: query, quotesCount: 25, newsCount: 0 }
    });
    return { quotes: Array.isArray(data?.quotes) ? data.quotes : [] };
};

const searchFromFinnhub = async (query) => {
    const { data } = await axios.get(`${FINNHUB_BASE_URL}/search`, {
        timeout: 12000,
        params: { q: query, token: FINNHUB_API_KEY }
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
    const short = normalize(quote.shortname || '');
    const long = normalize(quote.longname || '');

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

        // Quote: Alpaca → Yahoo
        let quote = getCache(`quote:${ticker}`);
        if (!quote) {
            quote = await tryInOrder([
                () => quoteFromAlpaca(ticker),
                () => apiQueue.add(() => quoteFromYahoo(ticker)),
            ]);
            setCache(`quote:${ticker}`, quote, QUOTE_CACHE_TTL);
        }
        const currentPrice = quote.regularMarketPrice;

        // Chart: Alpaca → Yahoo
        let chartResult = getCache(`chart:${ticker}`);
        if (!chartResult) {
            chartResult = await tryInOrder([
                () => chartFromAlpaca(ticker),
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
