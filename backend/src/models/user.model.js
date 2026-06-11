import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is required"],
        unique: [true, "username is already taken"],
        lowercase: [true, "username is required"],
        trim: [true, "username is required"]
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: [true, "email is already taken"],
        lowercase: [true, "email is required"],
        trim: [true, "email is required"]
    },
    password: {
        type: String,
        required: [true, "password is required"]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
export default User;