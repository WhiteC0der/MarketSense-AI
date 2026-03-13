import express from 'express';
import { GoogleGenAI } from '@google/genai';
import News from '../models/news.model.js';

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/', async (req, res) => {
    try {
        const { question, ticker } = req.body;
        
        if (!question || !ticker) {
            return res.status(400).json({ error: "Please provide a question and a ticker." });
        }

        console.log(`User asks: "${question}"`);

        const enrichedQuery = `Financial news and market analysis specifically regarding ${ticker} stock. User question: ${question}`;

        const embedResponse = await ai.models.embedContent({
            model: 'gemini-embedding-001', 
            contents: enrichedQuery,
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

      //  const contextText = searchResults.map(doc => `Headline: ${doc.headline}\nSummary: ${doc.summary}`).join('\n\n');
        
        // const finalPrompt = `
        // You are a highly intelligent financial AI assistant. 
        // The user is currently looking at the stock chart for: ${ticker}.
        // Use ONLY the following recent news articles to answer the user's question. 
        // If the user asks a vague question like "Why is it dropping?", assume they are talking about ${ticker}.
        // If the answer is not contained in the articles, say "I don't have enough data to answer that." 
        // Do not hallucinate external information.

        // CONTEXT:
        // ${contextText}

        // USER QUESTION: 
        // ${question}
        // `;

        // 4. Build the "System Prompt" using Advanced XML Structuring
        const contextText = searchResults.map(doc => `Headline: ${doc.headline}\nSummary: ${doc.summary}`).join('\n\n');
        
        const finalPrompt = `
        You are MarketSense AI, an elite financial intelligence terminal engineered by whitecoder.
        The user is currently viewing the live dashboard for: ${ticker}.

        <INSTRUCTIONS>
        Analyze the <USER_QUESTION> and strictly follow the matching rule below:

        1. GREETINGS & CAPABILITIES: If the user says hello or asks what you can do:
           - Introduce yourself professionally as MarketSense AI.
           - Explain that you use a Retrieval-Augmented Generation (RAG) vector pipeline to analyze live market news.
           - Instruct them to type any stock ticker into the top search bar and hit "SCAN" to ingest fresh market data.
           - Ignore the <CONTEXT> block.

        2. GENERAL FINANCE CONCEPTS: If the user asks a definition (e.g., "What is a P/E ratio?", "What are dividends?"):
           - Answer using your broad financial knowledge.
           - Ignore the <CONTEXT> block.

        3. LIVE MARKET & NEWS ANALYSIS: If the user asks about ${ticker}, recent news, market sentiment, or "why is it dropping/rising?":
           - You MUST synthesize your answer STRICTLY from the <CONTEXT> block below.
           - Format your answer beautifully using Markdown (bolding key terms, using bullet points).
           - IF the answer is not in the <CONTEXT>, do NOT guess or hallucinate. Reply exactly with: "I don't see any information regarding that in the latest ingested articles. You may need to hit 'SCAN' to fetch the newest data for ${ticker}."
        </INSTRUCTIONS>

        <CONTEXT>
        ${contextText || "No recent news ingested for this ticker."}
        </CONTEXT>

        <USER_QUESTION>
        ${question}
        </USER_QUESTION>
        `;

        const chatResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            // model: 'Gemini 1.5 Flash',
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