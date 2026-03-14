import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'ai', 'system'], // 'system' will be for rendering the News Cards!
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // We will attach the Finnhub articles here so the UI can render them beautifully
    sources: {
        type: Array, 
        default: []
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Ties this chat to the logged-in user
        required: true
    },
    title: {
        type: String,
        default: "New Chat" // We can have the AI auto-generate this later!
    },
    messages: [messageSchema], // An array of the back-and-forth messages
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;