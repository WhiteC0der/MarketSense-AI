import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/**
 * Extract JWT access token from request.
 * The access token is stored in-memory on the client and sent
 * via the Authorization: Bearer <token> header.
 * (Only the refresh token is persisted in an httpOnly cookie.)
 */
const getToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
};

const protect = async (req, res, next) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists and is verified
        const user = await User.findById(decoded.userId).select('_id isVerified').lean();

        if (!user) {
            return res.status(401).json({ error: 'User no longer exists.' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }
};

export default protect;