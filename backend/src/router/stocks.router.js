import express from 'express';
import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import RequestQueue from '../utils/requestQueue.js';

const router = express.Router();

const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey', 'ripHistorical'] 
});

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

const yahooPublicApiBackup = axios.create({
    baseURL: 'https://query2.finance.yahoo.com',
    timeout: 12000,
    headers: YAHOO_PUBLIC_HEADERS
});

// Queue with 1500ms delay between requests to avoid Yahoo Finance rate limiting
const apiQueue = new RequestQueue(1500);

const cacheStore = new Map();
const SEARCH_CACHE_TTL_MS = Number(process.env.STOCK_SEARCH_CACHE_TTL_MS || 10 * 60 * 1000);
const QUOTE_CACHE_TTL_MS = Number(process.env.STOCK_QUOTE_CACHE_TTL_MS || 60 * 1000);
const CHART_CACHE_TTL_MS = Number(process.env.STOCK_CHART_CACHE_TTL_MS || 10 * 60 * 1000);
const publicEndpointsOnlyEnv = process.env.YAHOO_PUBLIC_ENDPOINTS_ONLY;
const USE_PUBLIC_YAHOO_ENDPOINTS_ONLY =
    typeof publicEndpointsOnlyEnv === 'string'
        ? publicEndpointsOnlyEnv === 'true'
        : process.env.NODE_ENV === 'production';

const getCachedValue = (key) => {
    const found = cacheStore.get(key);

    if (!found) return null;
    if (found.expiresAt <= Date.now()) {
        cacheStore.delete(key);
        return null;
    }

    return found.value;
};

const setCachedValue = (key, value, ttlMs) => {
    cacheStore.set(key, {
        value,
        expiresAt: Date.now() + ttlMs
    });
};

const isRateLimitError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    const status = error?.response?.status || error?.status || error?.statusCode;

    return status === 429 || message.includes('too many requests') || message.includes('failed to get crumb');
};

const isPublicAccessBlockedError = (error) => {
    const status = error?.response?.status || error?.status || error?.statusCode;
    return status === 401 || status === 403 || status === 429;
};

const requestYahooPublic = async (path, params) => {
    try {
        return await yahooPublicApi.get(path, { params });
    } catch (error) {
        if (!isPublicAccessBlockedError(error)) throw error;

        return yahooPublicApiBackup.get(path, { params });
    }
};

const getWithFallback = async ({ cacheKey, ttlMs, primaryFn, fallbackFn }) => {
    const cached = getCachedValue(cacheKey);
    if (cached) return cached;

    let result;

    if (USE_PUBLIC_YAHOO_ENDPOINTS_ONLY) {
        result = await fallbackFn();
    } else {
        try {
            result = await primaryFn();
        } catch (error) {
            if (!isRateLimitError(error)) throw error;

            console.warn('Primary Yahoo client was rate-limited. Falling back to public endpoint.', {
                cacheKey,
                status: error?.response?.status || error?.status || error?.statusCode,
                message: error?.message
            });

            result = await fallbackFn();
        }
    }

    setCachedValue(cacheKey, result, ttlMs);
    return result;
};

const searchFromPublicEndpoint = async (query) => {
    const { data } = await requestYahooPublic('/v1/finance/search', {
        q: query,
        quotesCount: 25,
        newsCount: 0
    });

    return { quotes: Array.isArray(data?.quotes) ? data.quotes : [] };
};

const quoteFromPublicEndpoint = async (ticker) => {
    const { data } = await requestYahooPublic('/v7/finance/quote', {
        symbols: ticker
    });

    const quote = data?.quoteResponse?.result?.[0];
    if (!quote) {
        throw new Error(`No quote data found for ${ticker}`);
    }

    return {
        regularMarketPrice: quote.regularMarketPrice
    };
};

const chartFromPublicEndpoint = async (ticker) => {
    const { data } = await requestYahooPublic(`/v8/finance/chart/${ticker}`, {
        interval: '1d',
        range: '1mo',
        includePrePost: false,
        events: 'div,splits'
    });

    const result = data?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];

    const quotes = timestamps
        .map((timestamp, index) => {
            const close = closes[index];
            if (typeof close !== 'number' || Number.isNaN(close)) return null;

            return {
                date: new Date(timestamp * 1000),
                close
            };
        })
        .filter(Boolean);

    return { quotes };
};

const normalizeSearchText = (value = '') =>
    value.toLowerCase().replace(/[^a-z0-9]/g, '');

const isPreferredCommonStockSymbol = (symbol = '') => /^[A-Z]{1,5}$/.test(symbol);

const isLikelyDerivedOrCrossListedSymbol = (symbol = '') =>
    /[.=]/.test(symbol) || /\d/.test(symbol);

const isPreferredExchange = (exchange = '') =>
    ['NMS', 'NYQ', 'ASE', 'BTS'].includes(exchange);

const MINIMUM_ACCEPTABLE_MATCH_SCORE = 70;

const scoreQuoteMatch = (quote, rawQuery) => {
    const query = normalizeSearchText(rawQuery);
    const symbol = normalizeSearchText(quote.symbol || '');
    const shortName = normalizeSearchText(quote.shortname || '');
    const longName = normalizeSearchText(quote.longname || '');

    let score = 0;

    if (quote.quoteType === 'EQUITY') score += 50;
    if (isPreferredCommonStockSymbol(quote.symbol || '')) score += 20;
    if (isPreferredExchange(quote.exchange || '')) score += 10;
    if (isLikelyDerivedOrCrossListedSymbol(quote.symbol || '')) score -= 30;
    if (symbol === query) score += 100;
    if (shortName === query || longName === query) score += 90;
    if (symbol.startsWith(query)) score += 40;
    if (shortName.startsWith(query) || longName.startsWith(query)) score += 35;
    if (shortName.includes(query) || longName.includes(query)) score += 20;

    return score;
};

router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query.trim();

        const result = await getWithFallback({
            cacheKey: `search:${query.toLowerCase()}`,
            ttlMs: SEARCH_CACHE_TTL_MS,
            primaryFn: () => apiQueue.add(() => yahooFinance.search(query)),
            fallbackFn: () => apiQueue.add(() => searchFromPublicEndpoint(query))
        });
        
        if (result.quotes && result.quotes.length > 0) {
            const equityQuotes = result.quotes.filter((quote) => quote.quoteType === 'EQUITY');

            if (equityQuotes.length === 0) {
                return res.status(404).json({ error: "No stock match found. Please type a proper company name or exact stock ticker." });
            }

            const preferredCommonStocks = equityQuotes.filter(
                (quote) => isPreferredCommonStockSymbol(quote.symbol || '') && !isLikelyDerivedOrCrossListedSymbol(quote.symbol || '')
            );

            const candidates = preferredCommonStocks.length > 0 ? preferredCommonStocks : equityQuotes;

            const rankedQuotes = [...candidates].sort(
                (left, right) => scoreQuoteMatch(right, query) - scoreQuoteMatch(left, query)
            );

            const bestMatch = rankedQuotes[0];
            const bestScore = scoreQuoteMatch(bestMatch, query);

            if (bestScore < MINIMUM_ACCEPTABLE_MATCH_SCORE) {
                return res.status(404).json({ error: "No stock match found. Please type a proper company name or exact stock ticker." });
            }

            return res.status(200).json({ symbol: bestMatch.symbol });
        } else {
            return res.status(404).json({ error: "No stock match found. Please type a proper company name or exact stock ticker." });
        }
    } catch (error) {
        console.error("Search API Error:", error.message);
        res.status(500).json({ error: "Failed to resolve ticker." });
    }
});

router.get('/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();

        const quote = await getWithFallback({
            cacheKey: `quote:${ticker}`,
            ttlMs: QUOTE_CACHE_TTL_MS,
            primaryFn: () => apiQueue.add(() => yahooFinance.quote(ticker)),
            fallbackFn: () => apiQueue.add(() => quoteFromPublicEndpoint(ticker))
        });
        const currentPrice = quote.regularMarketPrice;

        const chartResult = await getWithFallback({
            cacheKey: `chart:${ticker}`,
            ttlMs: CHART_CACHE_TTL_MS,
            primaryFn: () => {
                const today = new Date();
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const period1 = thirtyDaysAgo.toISOString().split('T')[0];
                const period2 = today.toISOString().split('T')[0];

                return apiQueue.add(() =>
                    yahooFinance.chart(ticker, {
                        period1,
                        period2,
                        interval: '1d'
                    })
                );
            },
            fallbackFn: () => apiQueue.add(() => chartFromPublicEndpoint(ticker))
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