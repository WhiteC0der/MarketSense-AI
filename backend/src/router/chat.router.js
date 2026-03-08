// backend/routes/chatRoutes.js
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import News from '../models/news.model.js'; // Ensure the file extension is .js for ES modules

const router = express.Router();

// Initialize the Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST /api/chat
router.post('/', async (req, res) => {
    try {
        // 1. Get the user's question from the request body
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: "Please provide a question." });
        }

        console.log(`User asks: "${question}"`);

        // 2. Convert the question into a Vector Array
        // IMPORTANT: Use the exact same model you used for ingestion!
        const embedResponse = await ai.models.embedContent({
            model: 'gemini-embedding-001', 
            contents: question,
        });
        const queryVector = embedResponse.embeddings[0].values;

        // 3. Search MongoDB for the most relevant articles using Cosine Similarity
        const searchResults = await News.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index", // The exact name you gave your index in Atlas
                    "path": "embedding",     // The field in your schema
                    "queryVector": queryVector,
                    "numCandidates": 10,     // Look at the top 10 closest matches...
                    "limit": 3               // ...but only return the absolute best 3
                }
            },
            {
                // Project only the fields we need to save bandwidth
                "$project": {
                    "_id": 0,
                    "headline": 1,
                    "summary": 1,
                    "score": { "$meta": "vectorSearchScore" } // Shows how mathematically close the match is
                }
            }
        ]);

        // If no relevant news is found, stop here.
        if (searchResults.length === 0) {
            return res.json({ answer: "I don't have any recent news in my database to answer that.", context: [] });
        }

        // 4. Build the "System Prompt" combining the retrieved data and the user's question
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

        // 5. Ask Gemini to generate the final response
        const chatResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite', // The state-of-the-art text generation model
            contents: finalPrompt,
        });

        // 6. Send the AI's answer AND the source articles back to the React frontend
        res.status(200).json({ 
            answer: chatResponse.text,
            sources: searchResults // We send the sources so React can display them!
        });

    } catch (error) {
        console.error("Chat API Error:", error.message);
        // Note: If you get a "Dimensions do not match" error here, it means the dimension size 
        // in your Atlas Index doesn't match the vector array size. We can easily fix that if it happens!
        res.status(500).json({ error: "Failed to generate AI response." });
    }
});

export default router;