import express from 'express';
import { getChatHistory, getChatById, sendMessage } from '../controllers/chat.controller.js';

const router = express.Router();


router.get('/history', getChatHistory);
router.get('/:chatId', getChatById);
router.post('/', sendMessage);

export default router;