import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

const getCookieOptions = (expiresInMs = 7 * 24 * 60 * 60 * 1000) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: expiresInMs,
    path: '/',
});

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already in use.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.cookie('token', token, getCookieOptions());

        res.status(200).json({ email: user.email, message: 'Logged in successfully' });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

router.post('/logout', (req, res) => {
    res.cookie('token', '', {
        ...getCookieOptions(0),
        maxAge: 0,
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

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