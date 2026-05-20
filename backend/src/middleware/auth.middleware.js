import jwt from 'jsonwebtoken';

/**
 * Extract JWT token from request.
 * Checks (in order): Authorization header, then cookies.
 * This dual approach ensures compatibility with mobile browsers
 * that block third-party cookies.
 */
const getToken = (req) => {
    // 1. Check Authorization header first (works on all mobile browsers)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    // 2. Fallback to cookie (works on desktop and same-origin)
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }

    return null;
};

const protect = (req, res, next) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }
};

export default protect;