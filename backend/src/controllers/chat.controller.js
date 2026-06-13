import { GoogleGenAI } from '@google/genai';
import News from '../models/news.model.js';
import Conversation from '../models/conversation.model.js';
import { queryVectors } from '../services/pinecone.service.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Query Pinecone for the top 3 most semantically similar articles to the query vector,
 * filtered by ticker. Then fetch full article data from MongoDB using the returned IDs.
 *
 * Flow: queryVector → Pinecone (filter: ticker) → [mongoIds] → MongoDB.find → articles
 */
const runVectorSearch = async (queryVector, ticker) => {
    // ── Step 1: Ask Pinecone for the closest vectors for this ticker ──────────
    const matches = await queryVectors(queryVector, ticker, 3);
    // matches = [{ id: "64abc...", score: 0.91 }, { id: "64def...", score: 0.87 }, ...]

    if (!matches || matches.length === 0) return [];

    // ── Step 2: Extract MongoDB IDs and create score lookup map ──────────────
    const mongoIds = matches.map((m) => m.id);

    // ── Step 3: Fetch full article data from MongoDB (include _id) ───────────
    const articles = await News.find({ _id: { $in: mongoIds } })
        .select('headline summary url _id')
        .lean();

    const articleMap = new Map(articles.map((art) => [art._id.toString(), art]));

    // ── Step 4: Preserve Pinecone order and correctly attach matching score ──
    return matches
        .map((match) => {
            const article = articleMap.get(match.id);
            if (!article) return null;
            const { _id, ...rest } = article;
            return {
                ...rest,
                score: match.score,
            };
        })
        .filter(Boolean);
};

const getAuthenticatedUserId = (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ error: 'Access denied. Please log in.' });
        return null;
    }
    return userId;
};

/**
 * Get chat history for authenticated user
 */
export const getChatHistory = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;

        const chats = await Conversation.find({ userId })
            .select('_id title updatedAt')
            .sort({ updatedAt: -1 });
        
        res.status(200).json(chats);
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ error: "Failed to load chat history." });
    }
};

/**
 * Get a specific chat by ID
 */
export const getChatById = async (req, res) => {
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
};

/**
 * Send a message and get AI response
 */
export const sendMessage = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;

        const { question, ticker, chatId } = req.body;
        
        if (!question || !ticker) {
            return res.status(400).json({ error: "Please provide a question and a ticker." });
        }

        console.log(`User asks: "${question}" for ${ticker}`);

        const enrichedQuery = `Financial news and market analysis specifically regarding ${ticker} stock. User question: ${question}`;
        const embedResponse = await ai.models.embedContent({
            model: 'gemini-embedding-001', 
            contents: enrichedQuery,
        });
        
        const queryVector = embedResponse.embeddings[0].values || embedResponse.embeddings[0]; 

        const searchResults = await runVectorSearch(queryVector, ticker);

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

        const chatResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalPrompt,
        });

        const finalAnswer = chatResponse.text;

        let conversation;
        if (chatId) {
            conversation = await Conversation.findOne({ _id: chatId, userId });
        } 
        
        if (!conversation) {
            conversation = new Conversation({ 
                userId,
                title: `${ticker.toUpperCase()} - ${question.substring(0, 20)}...`
            });
        }

        conversation.messages.push({ role: 'user', content: question });
        
        if (searchResults.length > 0) {
            conversation.messages.push({ 
                role: 'system', 
                content: `Analyzed ${searchResults.length} recent articles for ${ticker.toUpperCase()}`,
                sources: searchResults 
            });
        }

        conversation.messages.push({ role: 'ai', content: finalAnswer });
        conversation.updatedAt = Date.now();
        
        await conversation.save();

        res.status(200).json({ 
            chatId: conversation._id,
            answer: finalAnswer, 
            sources: searchResults 
        });

    } catch (error) {
        console.error("Chat API Error:", error.message);
        res.status(500).json({ error: "Failed to generate AI response." });
    }
};
