import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
    // 1. Grab the token securely from the cookie
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Please log in.' });
    }

    try {
        // 2. Verify the badge
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }
};

export default protect;