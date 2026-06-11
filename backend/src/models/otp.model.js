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
    
});

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;