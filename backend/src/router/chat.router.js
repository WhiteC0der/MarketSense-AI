import express from 'express';
import { GoogleGenAI } from '@google/genai';
import News from '../models/news.model.js';

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: "Please provide a question." });
        }

        console.log(`User asks: "${question}"`);

        const embedResponse = await ai.models.embedContent({
            model: 'gemini-embedding-001', 
            contents: question,
        });
        const queryVector = embedResponse.embeddings[0].values;

        const searchResults = await News.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": queryVector,
                    "numCandidates": 10,
                    "limit": 3
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "headline": 1,
                    "summary": 1,
                    "score": { "$meta": "vectorSearchScore" }
                }
            }
        ]);

        if (searchResults.length === 0) {
            return res.json({ answer: "I don't have any recent news in my database to answer that.", context: [] });
        }

        const contextText = searchResults.map(doc => `Headline: ${doc.headline}\nSummary: ${doc.summary}`).join('\n\n');
        
        const finalPrompt = `
        You are a highly intelligent financial AI assistant. 
        Use ONLY the following recent news articles to answer the user's question. 
        If the answer is not contained in the articles, say "I don't have enough data to answer that." 
        Do not hallucinate external information.

        CONTEXT:
        ${contextText}

        USER QUESTION: 
        ${question}
        `;

        const chatResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: finalPrompt,
        });

        res.status(200).json({ 
            answer: chatResponse.text,
            sources: searchResults
        });

    } catch (error) {
        console.error("Chat API Error:", error.message);
        res.status(500).json({ error: "Failed to generate AI response." });
    }
});

export default router;