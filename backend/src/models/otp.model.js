import mongoose from "mongoose";
import User from "./user.model.js";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true,"email is required"]
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true,"user is required"]
    },
    otpHash: {
        type: String,
        required: [true,"otpHash is required"]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // MongoDB auto-deletes after 300 seconds (5 minutes)
    },
});

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;