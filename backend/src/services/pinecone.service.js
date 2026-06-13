import { Pinecone } from '@pinecone-database/pinecone';

// ── Singleton client — created once when the module is first imported ────────
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

// Get a reference to the index (does NOT make a network call)
const index = pinecone.index(process.env.PINECONE_INDEX);

/**
 * Upsert a single vector into Pinecone.
 * Called during news ingestion after an article is saved to MongoDB.
 *
 * @param {string} mongoId  - The MongoDB _id of the saved News document (used as Pinecone vector ID)
 * @param {number[]} vector - The embedding array from Gemini (3072 dimensions)
 * @param {object} metadata - Lightweight metadata stored alongside the vector (e.g. { ticker: "AAPL" })
 */
const upsertVector = async (mongoId, vector, metadata) => {
    await index.upsert({
        records: [
            {
                id: mongoId.toString(), // Pinecone IDs must be strings
                values: vector,
                metadata,               // { ticker: "AAPL" } — used for filtered queries
            },
        ]
    });
};

/**
 * Query Pinecone for the most semantically similar vectors to a given query vector.
 * Filters by ticker so only articles for the relevant stock are returned.
 *
 * @param {number[]} queryVector - The embedded user question (3072 dimensions)
 * @param {string}   ticker      - Stock ticker to filter on (e.g. "AAPL")
 * @param {number}   topK        - Number of results to return (default: 3)
 * @returns {Array<{ id: string, score: number }>} - Pinecone matches with MongoDB IDs
 */
const queryVectors = async (queryVector, ticker, topK = 3) => {
    const result = await index.query({
        vector: queryVector,
        topK,
        filter: { ticker: { $eq: ticker.toUpperCase() } }, // Pinecone metadata filter
        includeMetadata: false, // We'll fetch full data from MongoDB — no need for metadata here
    });

    return result.matches; // [{ id: "64abc...", score: 0.91 }, ...]
};

export { upsertVector, queryVectors };
