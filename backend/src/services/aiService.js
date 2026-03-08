// backend/services/aiService.jsimport { GoogleGenAI } from '@google/genai';
import 'dotenv/config'; // <-- THIS IS THE FIX. It forces the .env file to load immediately.
import { GoogleGenAI } from '@google/genai';
import newsModel from '../models/news.model.js'; // Ensure the file extension is .js for ES modules

// Initialize the new Gemini Client (Pass it as an object)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const processAndSaveNews = async (ticker, articles) => {
    let savedCount = 0;

    for (const article of articles) {
        try {
            // 1. Prevent Duplicates
            const exists = await newsModel.findOne({ url: article.url });
            if (exists) {
                console.log(`Skipped: Article already exists - ${article.headline}`);
                continue; 
            }

            // 2. Prepare the payload
            const textToEmbed = `Headline: ${article.headline}. Summary: ${article.summary}`;

            // 3. The Magic: Call Gemini using the NEW SDK syntax
            const response = await ai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: textToEmbed,
            });

            // Extract the array of floating-point numbers (Notice the new response structure)
            const embeddingVector = response.embeddings[0].values;

            // 4. Save to MongoDB
            const newArticle = new newsModel({
                ticker: ticker,
                headline: article.headline,
                summary: article.summary,
                url: article.url,
                publishedAt: new Date(article.datetime * 1000), 
                embedding: embeddingVector
            });

            await newArticle.save();
            savedCount++;
            console.log(`Saved & Embedded: ${article.headline}`);

        } catch (error) {
            console.error(`Failed to process article: ${error.message}`);
        }
    }
    
    return savedCount;
};

export { processAndSaveNews };