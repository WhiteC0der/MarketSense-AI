import { GoogleGenAI } from '@google/genai';
import News from '../models/news.model.js';
import Conversation from '../models/conversation.model.js';
import { queryVectors } from '../services/pinecone.service.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Unix timestamp helpers ────────────────────────────────────────────────────
const daysAgoUnix = (days) => Math.floor(Date.now() / 1000) - days * 86400;

/**
 * Classify the user's query intent using Gemini Flash so we can choose the
 * right Pinecone date window upfront:
 *   "recent"     → last 14 days  (e.g. "why is META down today?")
 *   "historical" → no date filter (e.g. "what happened in April earnings?")
 *   "general"    → last 90 days  (e.g. "what is META's AI strategy?")
 */
const classifyIntent = async (question) => {
    try {
        const intentPrompt = `Classify this financial query into EXACTLY ONE of these categories:
- "recent"     → user is asking about today, this week, latest, current, or recent events
- "historical" → user is asking about a specific past date, quarter, or event older than ~2 weeks
- "general"    → user is asking about long-term strategy, trends, definitions, or broad analysis

Query: "${question}"

Reply with ONLY one word: recent | historical | general`;

        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: intentPrompt,
        });
        const intent = res.text.trim().toLowerCase();
        if (['recent', 'historical', 'general'].includes(intent)) return intent;
        return 'general'; // safe fallback
    } catch {
        return 'general'; // if classification fails, use widest window
    }
};

/**
 * Fetch full article data from MongoDB for a list of Pinecone match IDs,
 * preserving Pinecone relevance scores and sorting by publishedAt descending.
 */
const fetchArticlesFromMongo = async (matches) => {
    if (!matches || matches.length === 0) return [];

    const mongoIds = matches.map((m) => m.id);

    const articles = await News.find({ _id: { $in: mongoIds } })
        .select('headline summary url publishedAt _id')
        .lean();

    const articleMap = new Map(articles.map((art) => [art._id.toString(), art]));

    return matches
        .map((match) => {
            const article = articleMap.get(match.id);
            if (!article) return null;
            const { _id, ...rest } = article;
            return { ...rest, score: match.score };
        })
        .filter(Boolean)
        // Sort by date DESC so LLM always sees freshest articles first
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
};

/**
 * 3-Stage Adaptive Retrieval Pipeline:
 *
 *  Stage 1: Intent-based date window (14 days / 90 days / no filter)
 *  Stage 2: If < 3 results → widen to 90-day window and retry
 *  Stage 3: If still < 3 results → remove date filter entirely (full archive)
 *
 * Flow: intent → Pinecone (cutoff) → [mongoIds] → MongoDB → sorted articles
 */
const runVectorSearch = async (queryVector, ticker, intent) => {
    const MIN_RESULTS = 3;

    // ── Map intent → initial Pinecone cutoff ─────────────────────────────────
    let cutoff;
    if (intent === 'recent')     cutoff = daysAgoUnix(14);
    else if (intent === 'general') cutoff = daysAgoUnix(90);
    else                          cutoff = null; // historical: no date filter

    // ── Stage 1: Intent-driven query ─────────────────────────────────────────
    let matches = await queryVectors(queryVector, ticker, 10, cutoff);
    console.log(`[RAG] Stage 1 (${intent}, cutoff=${cutoff ?? 'none'}): ${matches.length} matches`);

    // ── Stage 2: Widen to 90 days if not enough results ──────────────────────
    if (matches.length < MIN_RESULTS && cutoff !== null && cutoff === daysAgoUnix(14)) {
        console.log(`[RAG] Stage 2 fallback: widening to 90-day window`);
        matches = await queryVectors(queryVector, ticker, 10, daysAgoUnix(90));
        console.log(`[RAG] Stage 2 result: ${matches.length} matches`);
    }

    // ── Stage 3: Remove date filter entirely if still not enough ─────────────
    if (matches.length < MIN_RESULTS) {
        console.log(`[RAG] Stage 3 fallback: removing date filter (full archive)`);
        matches = await queryVectors(queryVector, ticker, 8, null);
        console.log(`[RAG] Stage 3 result: ${matches.length} matches`);
    }

    return fetchArticlesFromMongo(matches);
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

        // ── Step 1: Classify intent to pick the right date window ────────────
        const intent = await classifyIntent(question);
        console.log(`[RAG] Intent classified as: "${intent}"`);

        // ── Step 2: Embed the enriched query ──────────────────────────────────
        const enrichedQuery = `Financial news and market analysis specifically regarding ${ticker} stock. User question: ${question}`;
        const embedResponse = await ai.models.embedContent({
            model: 'gemini-embedding-001', 
            contents: enrichedQuery,
        });
        
        const queryVector = embedResponse.embeddings[0].values || embedResponse.embeddings[0]; 

        // ── Step 3: Adaptive retrieval with 3-stage fallback ──────────────────
        const searchResults = await runVectorSearch(queryVector, ticker, intent);

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
