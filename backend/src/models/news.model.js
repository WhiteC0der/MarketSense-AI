import mongoose, { Schema } from 'mongoose';

const newsSchema = new Schema({
    ticker: {
        type: String,
        required: true,
        uppercase: true,
        index: true 
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
    }
}, { timestamps: true });

export default mongoose.model('News', newsSchema);