import express from 'express';
import { getNewsByTicker, ingestNews } from '../controllers/news.controller.js';

const router = express.Router();

// Route handlers
router.get('/:ticker', getNewsByTicker);
router.post('/ingest/:ticker', ingestNews);

export default router;