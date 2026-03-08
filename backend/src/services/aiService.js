import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import newsModel from '../models/news.model.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const processAndSaveNews = async (ticker, articles) => {
    let savedCount = 0;

    for (const article of articles) {
        try {
            const exists = await newsModel.findOne({ url: article.url });
            if (exists) {
                console.log(`Skipped: Article already exists - ${article.headline}`);
                continue; 
            }

            const textToEmbed = `Headline: ${article.headline}. Summary: ${article.summary}`;

            const response = await ai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: textToEmbed,
            });

            const embeddingVector = response.embeddings[0].values;

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