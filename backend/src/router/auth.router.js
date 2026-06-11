import express from 'express';
import { register, login, logout, logoutAll, getMe, refreshToken, verifyEmail, resendOtp } from '../controllers/auth.controller.js';

const router = express.Router();


router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/logoutall', logoutAll);
router.get('/get-me', getMe);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);

export default router;