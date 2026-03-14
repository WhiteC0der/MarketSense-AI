import cron from 'node-cron';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai'; // FIXED: Correct class name
import News from '../models/news.model.js'; 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const startNewsJob = () => {
    // Timer set to run every minute for testing. 
    // Change to '0 2 * * *' (2:00 AM) when you are ready for production.
    cron.schedule('0 2 * * *', async () => {
        console.log("\n⏰ CRON WAKEUP: Starting background market ingestion...");

        // 1. Setup the Gemini AI Client with the correct class
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // 2. Setup dynamic dates (Fetch news from exactly Yesterday to Today)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const toDate = today.toISOString().split('T')[0];
        const fromDate = yesterday.toISOString().split('T')[0];

        // The stocks your MarketSense AI will actively track
        const targetTickers = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOG'];

        for (const ticker of targetTickers) {
            console.log(`\n⬇️ Fetching ${ticker} news from Finnhub...`);

            try {
                // 3. Fetch from Finnhub API
                const finnhubUrl = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${process.env.FINNHUB_API_KEY}`;
                const response = await axios.get(finnhubUrl);
                
                // Grab only the top 10 articles per stock to keep the database clean
                const articles = response.data.slice(0, 10); 

                if (!articles || articles.length === 0) {
                    console.log(`No new articles found for ${ticker}.`);
                    continue; 
                }

                let processedCount = 0;

                for (let i = 0; i < articles.length; i++) {
                    const article = articles[i];

                    // Skip junk articles that don't have a summary
                    if (!article.summary || !article.url) continue;

// OPTIONAL: Prevent duplicates
                          const exists = await News.findOne({ url: article.url });
                          if (exists) {
                              console.log(`Skipped: Article already exists in DB`);
                              continue;
                          }

                    // 4. Generate the Vector Embedding using Google's latest embedding model
                    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
                    const embedResult = await embeddingModel.embedContent(article.summary);
                    const vectorArray = embedResult.embedding.values;

// 5. Save the data to MongoDB Atlas
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

                    // 6. THE THROTTLE: Protect your Gemini Free Tier Quota
                    if (processedCount % 3 === 0) {
                        console.log("🚦 Gemini speed limit reached. Sleeping for 15 seconds...");
                        await sleep(15000); 
                    }
                }
            } catch (error) {
                console.error(`❌ Cron failed for ${ticker}:`, error.message);
                continue; // Move to the next stock safely if one crashes
            }
        }
        
        console.log("\n🎉 All background data successfully ingested into Vector DB!");
    });
};

export default startNewsJob;