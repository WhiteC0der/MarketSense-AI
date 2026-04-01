import express from 'express';
import { searchStock, getStockData } from '../controllers/stocks.controller.js';

const router = express.Router();

// Route handlers
router.get('/search/:query', searchStock);
router.get('/:ticker', getStockData);

export default router;