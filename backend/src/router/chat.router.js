import express from 'express';
import { GoogleGenAI } from '@google/genai';
import News from '../models/news.model.js';
import Conversation from '../models/conversation.model.js'; // Ensure this path matches your new model!

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getAuthenticatedUserId = (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ error: 'Access denied. Please log in.' });
        return null;
    }
    return userId;
};

// ==========================================
// 1. GET ROUTE: Fetch Chat History for Sidebar
// ==========================================
router.get('/history', async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;

        // Fetch all chats for this user, sorted by newest first
        const chats = await Conversation.find({ userId })
            .select('_id title updatedAt')
            .sort({ updatedAt: -1 });
        
        res.status(200).json(chats);
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ error: "Failed to load chat history." });
    }
});

// ==========================================
// 2. GET ROUTE: Load a Specific Past Chat
// ==========================================
router.get('/:chatId', async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;

        const chat = await Conversation.findOne({ 
            _id: req.params.chatId, 
            userId
        });
        
        if (!chat) return res.status(404).json({ error: "Chat not found." });
        
        res.status(200).json(chat);
    } catch (error) {
        console.error("Load Chat Error:", error);
        res.status(500).json({ error: "Failed to load messages." });
    }
});

// ==========================================
// 3. POST ROUTE: Main AI & RAG Engine
// ==========================================
router.post('/', async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;

        // Notice we now extract chatId from the request body!
        const { question, ticker, chatId } = req.body;
        
        if (!question || !ticker) {
            return res.status(400).json({ error: "Please provide a question and a ticker." });
        }

        console.log(`User asks: "${question}" for ${ticker}`);

        // A. Generate Vector for the User's Question
        const enrichedQuery = `Financial news and market analysis specifically regarding ${ticker} stock. User question: ${question}`;
        const embedResponse = await ai.models.embedContent({
            model: 'gemini-embedding-001', 
            contents: enrichedQuery,
        });
        
        // Note: Check if your SDK version returns embedResponse.embeddings[0].values or something slightly different. 
        // We will keep your syntax here assuming it worked for you!
        const queryVector = embedResponse.embeddings[0].values || embedResponse.embeddings[0]; 

        // B. Vector Search in MongoDB (filtered by ticker)
        const searchResults = await News.aggregate([
            {
                "$match": {
                    "ticker": ticker.toUpperCase()
                }
            },
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
                    "url": 1, // Added URL so your React UI can link to the actual article!
                    "score": { "$meta": "vectorSearchScore" }
                }
            }
        ]);

        // C. Build the Context and Prompt
        const contextText = searchResults.length > 0 
            ? searchResults.map(doc => `Headline: ${doc.headline}\nSummary: ${doc.summary}`).join('\n\n')
            : "";
        
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

        2. GENERAL FINANCE CONCEPTS: If the user asks a definition:
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

        // D. Generate AI Response
        const chatResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: finalPrompt,
        });

        const finalAnswer = chatResponse.text;

        // E. THE MEMORY BANK: Save everything to MongoDB
        let conversation;
        if (chatId) {
            conversation = await Conversation.findOne({ _id: chatId, userId });
        } 
        
        // If no chatId provided, or if the old chat was deleted, create a new one
        if (!conversation) {
            conversation = new Conversation({ 
                userId,
                title: `${ticker.toUpperCase()} - ${question.substring(0, 20)}...` // Auto-generates a cool title!
            });
        }

        // Save the User's question
        conversation.messages.push({ role: 'user', content: question });
        
        // Save the News Sources (so React can render the UI cards)
        if (searchResults.length > 0) {
            conversation.messages.push({ 
                role: 'system', 
                content: `Analyzed ${searchResults.length} recent articles for ${ticker.toUpperCase()}`,
                sources: searchResults 
            });
        }

        // Save the AI's answer
        conversation.messages.push({ role: 'ai', content: finalAnswer });
        conversation.updatedAt = Date.now();
        
        await conversation.save();

        // F. Send response back to frontend
        res.status(200).json({ 
            chatId: conversation._id, // Send this back so React knows which chat it is in!
            answer: finalAnswer, 
            sources: searchResults 
        });

    } catch (error) {
        console.error("Chat API Error:", error.message);
        res.status(500).json({ error: "Failed to generate AI response." });
    }
});

export default router;