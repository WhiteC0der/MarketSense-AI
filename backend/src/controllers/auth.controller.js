import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import crypto from 'crypto';

// Detect if running in production (Render, NODE_ENV, or by checking hostname)
const isProduction = process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    (process.env.PAPERSPACE || process.env.RENDER_EXTERNAL_HOSTNAME ? true : false);

// api/v1/auth/register
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({
            $or: [
                { email },
                { username }
            ]
        });

        if (existingUser) return res.status(409).json({ error: 'Email or username already in use.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User(
            {
                username,
                email,
                password: hashedPassword
            }
        );

        await newUser.save();

        
        const refreshToken = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        const newSession = new Session({
            user: newUser._id,
            refreshToken: crypto.createHash('sha256').update(refreshToken).digest('hex'),
            UserAgent: req.headers['user-agent'],
            ip: req.ip
        });
        
        await newSession.save();
        
        const accessToken = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            message: 'User registered successfully!',
            user: { userId: newUser._id, email: newUser.email },
            accessToken: accessToken
        });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Server error during registration.' });
    }


};

// api/v1/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            authenticated: true,
            message: 'Logged in successfully',
            user: { userId: user._id, email: user.email },
            accessToken: accessToken,
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Server error during login.' });
    }
};


// api/v1/auth/logout
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'No session found / token not found'
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

        await Session.findOneAndUpdate(
            { user: decoded.userId, refreshToken: hashedToken },
            { revoked: true }
        );

        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout Error:', error);
        res.clearCookie('refreshToken');
        res.status(500).json({ error: 'Server error during logout' });
    }
};


// api/v1/auth/logoutall
export const logoutAll = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'No session found / token not found'
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        await Session.updateMany(
            { user: decoded.userId },
            { revoked: true }
        );

        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully from all devices' });
    } catch (error) {
        console.error('LogoutAll Error:', error);
        res.clearCookie('refreshToken');
        res.status(500).json({ error: 'Server error during logout' });
    }
};



// GET api/v1/auth/get-me

export const getMe = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                authenticated: false, error: 'No session found / token not found'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('email createdAt');

            if (!user) {
                return res.status(401).json({ authenticated: false, error: 'User not found' });
            }

            res.status(200).json({
                authenticated: true,
                message: 'User found',
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
};

// api/v1/auth/refresh-token

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token found' });
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            const accessToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            const newRefreshToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.status(200).json({
                message: 'Token refreshed successfully!',
                user: { userId: user._id, email: user.email },
                token: accessToken
            });
        } catch (jwtError) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ error: 'Server error during refresh token' });
    }
};


