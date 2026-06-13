import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import newsModel from '../models/news.model.js';
import { upsertVector } from './pinecone.service.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const processAndSaveNews = async (ticker, articles) => {
    let savedCount = 0;

    for (const article of articles) {
        try {
            // ── Skip articles with no headline (nothing useful to embed) ──────────
            if (!article.headline || !article.headline.trim()) {
                console.log(`Skipped: Article has no headline`);
                continue;
            }

            // ── Finnhub sometimes returns empty/null summaries — fall back to headline ──
            const summary = article.summary?.trim() || article.headline.trim();

            // ── Deduplication: skip if this article URL already exists in MongoDB ──
            const exists = await newsModel.findOne({ url: article.url });
            if (exists) {
                console.log(`Skipped: Article already exists - ${article.headline}`);
                continue;
            }

            // ── Build rich text for embedding ────────────────────────────────────
            const textToEmbed = `Headline: ${article.headline}. Summary: ${summary}`;

            // ── Call Gemini Embedding API → 3072-dimensional vector ───────────────
            const response = await ai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: textToEmbed,
            });

            const embeddingVector = response.embeddings?.[0]?.values;

            // ── Guard: skip if Gemini returned no embedding values ───────────────
            // Pinecone throws "Must pass in at least 1 record to upsert" if vector is empty
            if (!Array.isArray(embeddingVector) || embeddingVector.length === 0) {
                console.warn(`Skipped Pinecone upsert: empty embedding for "${article.headline}"`);
                continue;
            }

            // ── Save article metadata to MongoDB (no embedding field) ─────────────
            const newArticle = new newsModel({
                ticker: ticker,
                headline: article.headline,
                summary: summary,
                url: article.url,
                publishedAt: new Date(article.datetime * 1000),
            });

            await newArticle.save();

            // ── Upsert vector to Pinecone using MongoDB _id as the vector ID ──────
            // This links Pinecone results back to MongoDB documents
            await upsertVector(newArticle._id, embeddingVector, {
                ticker: ticker.toUpperCase(),
            });

            savedCount++;
            console.log(`Saved & Embedded: ${article.headline}`);

        } catch (error) {
            console.error(`Failed to process article: ${error.message}`);
        }
    }

    return savedCount;
};

export { processAndSaveNews };