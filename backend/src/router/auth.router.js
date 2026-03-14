// backend/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already in use.' });

        // 2. Hash the password mathematically so it is unreadable in MongoDB
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Save the new user
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

        // 2. Compare the typed password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

        // 3. Generate the JWT Badge
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } // Token lasts for 7 days before they must log in again
        );

        res.cookie('token', token, {
            httpOnly: true, // CRITICAL: Prevents frontend JavaScript from touching the cookie (Stops XSS)
            secure: process.env.NODE_ENV === 'production', // True if on Render/Vercel (requires HTTPS)
            sameSite: 'strict', // Prevents Cross-Site Request Forgery (CSRF)
            maxAge: 7 * 24 * 60 * 60 * 1000 // Cookie lives for 7 days
        });

        // Notice we don't send the token back in the JSON anymore!
        res.status(200).json({ email: user.email, message: 'Logged in successfully' });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

router.post('/logout', (req, res) => {
    // Overwrite the cookie with a blank one that expires instantly
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0) 
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/v1/auth/me - Rehydrate session from stored JWT cookie
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ authenticated: false, error: 'No session found' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('email createdAt');
            
            if (!user) {
                return res.status(401).json({ authenticated: false, error: 'User not found' });
            }
            
            res.status(200).json({ 
                authenticated: true, 
                user: { 
                    userId: user._id, 
                    email: user.email 
                }
            });
        } catch (jwtError) {
            return res.status(401).json({ authenticated: false, error: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error("Session check error:", error);
        res.status(500).json({ authenticated: false, error: 'Server error during session check' });
    }
});

export default router;