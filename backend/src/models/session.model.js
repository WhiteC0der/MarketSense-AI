import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true,"user is required"]
    },
    refreshToken:{
        type: String,
        required: [true, "refreshToken is required"]
    },
    UserAgent:{
        type: String,
        default: 'unknown'
    },
    ip:{
        type: String,
        required: [true,"ip is required"]
    },
    revoked:{
        type: Boolean,
        default: false
    }
},{timestamps: true});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
