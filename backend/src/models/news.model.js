// backend/models/News.js
import mongoose,{Schema} from 'mongoose';

const newsSchema = new Schema({
    ticker: {
        type: String,
        required: true,
        uppercase: true,
        index: true // Makes searching by stock symbol faster
    },
    headline: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    publishedAt: {
        type: Date,
        required: true
    },
    // THIS IS THE RAG MAGIC:
    embedding: {
        type: [Number], // An array of floating-point numbers
        required: false // It's false initially because we add it *after* fetching the news
    }
}, { timestamps: true });

export default mongoose.model('News', newsSchema);