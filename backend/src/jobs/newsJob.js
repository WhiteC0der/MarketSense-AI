import cron from 'node-cron';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import News from '../models/news.model.js'; 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const startNewsJob = () => {
    cron.schedule('0 2 * * *', async () => {
        console.log("\n⏰ CRON WAKEUP: Starting background market ingestion...");

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const toDate = today.toISOString().split('T')[0];
        const fromDate = yesterday.toISOString().split('T')[0];

        const targetTickers = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOG'];

        for (const ticker of targetTickers) {
            console.log(`\n⬇️ Fetching ${ticker} news from Finnhub...`);

            try {
                const finnhubUrl = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${process.env.FINNHUB_API_KEY}`;
                const response = await axios.get(finnhubUrl);
                
                const articles = response.data.slice(0, 10); 

                if (!articles || articles.length === 0) {
                    console.log(`No new articles found for ${ticker}.`);
                    continue; 
                }

                let processedCount = 0;

                for (let i = 0; i < articles.length; i++) {
                    const article = articles[i];

                    if (!article.summary || !article.url) continue;

                          const exists = await News.findOne({ url: article.url });
                          if (exists) {
                              console.log(`Skipped: Article already exists in DB`);
                              continue;
                          }

                    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
                    const embedResult = await embeddingModel.embedContent(article.summary);
                    const vectorArray = embedResult.embedding.values;

                          await News.create({
                              ticker: ticker,
                              headline: article.headline,
                              summary: article.summary,
                              url: article.url,
                              publishedAt: new Date(article.datetime * 1000),
                              embedding: vectorArray
                          });

console.log(`✅ ${ticker}: Embedded and saved article ${processedCount}`);
                          processedCount++;

                    if (processedCount % 3 === 0) {
                        console.log("🚦 Gemini speed limit reached. Sleeping for 15 seconds...");
                        await sleep(15000); 
                    }
                }
            } catch (error) {
                console.error(`❌ Cron failed for ${ticker}:`, error.message);
                continue;
            }
        }
        
        console.log("\n🎉 All background data successfully ingested into Vector DB!");
    });
};

export default startNewsJob;