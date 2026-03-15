import cron from 'node-cron';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import News from '../models/news.model.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const startNewsJob = () => {
    cron.schedule('0 2 * * *', async () => {
        console.log("\n CRON WAKEUP: Starting background market ingestion...");

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const toDate = today.toISOString().split('T')[0];
        const fromDate = yesterday.toISOString().split('T')[0];

        const targetTickers = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOG'];

        for (const ticker of targetTickers) {
            console.log(`\n⬇ Fetching ${ticker} news from Finnhub...`);

            try {
                const finnhubUrl = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${process.env.FINNHUB_API_KEY}`;
                const response = await axios.get(finnhubUrl);

                const articles = response.data.slice(0, 10);

                if (!articles || articles.length === 0) {
                    console.log(`No new articles found for ${ticker}.`);
                    continue;
                }

                let processedCount = 0;

                for (const article of articles) {
                    if (!article.summary || !article.url) continue;

                    const exists = await News.findOne({ url: article.url });
                    if (exists) {
                        console.log(`Skipped: Article already exists in DB`);
                        continue;
                    }

                    try {
                        const embedResult = await ai.models.embedContent({
                            model: 'gemini-embedding-001',
                            contents: article.summary,
                        });
                        const vectorArray = embedResult.embeddings[0].values;

                        await News.create({
                            ticker: ticker,
                            headline: article.headline,
                            summary: article.summary,
                            url: article.url,
                            publishedAt: new Date(article.datetime * 1000),
                            embedding: vectorArray
                        });

                        processedCount++;
                        console.log(`${ticker}: Embedded and saved article ${processedCount}`);

                        if (processedCount % 3 === 0) {
                            console.log("🚦 Gemini rate limit pause. Sleeping for 15 seconds...");
                            await sleep(15000);
                        }
                    } catch (embedError) {
                        const msg = String(embedError?.message || '');
                        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
                            const retryMatch = msg.match(/retry in\s*([\d.]+)s/i);
                            const waitSeconds = retryMatch ? Math.ceil(Number(retryMatch[1])) : 60;
                            console.warn(`Gemini quota hit for ${ticker}. Sleeping ${waitSeconds}s before retry...`);
                            await sleep(waitSeconds * 1000);
                        } else {
                            console.error(`Embed failed for article "${article.headline}":`, embedError.message);
                        }
                    }
                }

                console.log(` ${ticker}: Done. ${processedCount} new articles saved.`);
            } catch (error) {
                console.error(`Cron failed for ${ticker}:`, error.message);
                continue;
            }
        }

        console.log("\nAll background data successfully ingested into Vector DB!");
    });
};

export default startNewsJob;