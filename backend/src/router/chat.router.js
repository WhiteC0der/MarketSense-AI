import express from 'express';
import { GoogleGenAI } from '@google/genai';
import News from '../models/news.model.js';
import Conversation from '../models/conversation.model.js';

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const isTickerFilterIndexError = (error) => {
    const message = String(error?.message || "");
    return message.includes("needs to be indexed as filter") && message.includes("ticker");
};

const runVectorSearch = async (queryVector, ticker) => {
    const projectStage = {
        "$project": {
            "_id": 0,
            "headline": 1,
            "summary": 1,
            "url": 1,
            "ticker": 1,
            "score": { "$meta": "vectorSearchScore" }
        }
    };

    try {
        return await News.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": queryVector,
                    "numCandidates": 10,
                    "limit": 3,
                    "filter": {
                        "ticker": ticker.toUpperCase()
                    }
                }
            },
            projectStage
        ]);
    } catch (error) {
        if (!isTickerFilterIndexError(error)) {
            throw error;
        }

        const unfilteredResults = await News.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": queryVector,
                    "numCandidates": 25,
                    "limit": 10
                }
            },
            projectStage
        ]);

        const normalizedTicker = ticker.toUpperCase();
        const tickerMatched = unfilteredResults
            .filter((doc) => String(doc.ticker || "").toUpperCase() === normalizedTicker)
            .slice(0, 3)
            .map(({ ticker: _ticker, ...rest }) => rest);

        return tickerMatched;
    }
};

const getAuthenticatedUserId = (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ error: 'Access denied. Please log in.' });
        return null;
    }
    return userId;
};

const extractOpenRouterText = (payload) => {
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map((part) => (typeof part?.text === 'string' ? part.text : ''))
            .join('')
            .trim();
    }
    return '';
};

const callOpenRouterModel = async (model, prompt) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is missing.');
    }

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter ${model} failed: ${response.status} ${errText}`);
    }

    const payload = await response.json();
    const text = extractOpenRouterText(payload);

    if (!text) {
        throw new Error(`OpenRouter ${model} returned an empty response.`);
    }

    return text;
};

const generateAIWithFallback = async (prompt) => {
    try {
        const primary = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return {
            modelUsed: 'gemini-2.5-flash',
            text: primary.text,
        };
    } catch (geminiError) {
        console.warn('Gemini failed, trying DeepSeek fallback:', geminiError.message);

        try {
            const deepSeekText = await callOpenRouterModel('deepseek/deepseek-chat', prompt);
            return {
                modelUsed: 'deepseek/deepseek-chat',
                text: deepSeekText,
            };
        } catch (deepSeekError) {
            console.warn('DeepSeek failed, trying Llama fallback:', deepSeekError.message);

            const llamaText = await callOpenRouterModel('meta-llama/llama-3-70b-instruct', prompt);
            return {
                modelUsed: 'meta-llama/llama-3-70b-instruct',
                text: llamaText,
            };
        }
    }
};

router.get('/history', async (req, res) => {
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
});

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

router.post('/', async (req, res) => {
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

        const generation = await generateAIWithFallback(finalPrompt);
        const finalAnswer = generation.text;
        console.log(`AI response model: ${generation.modelUsed}`);

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
});

export default router;