import { createServer } from 'http';
import { Server } from 'socket.io';
import app, { allowedOrigins } from './app.js';
import connectDB from './db/index.js';
import alpacaService from './services/alpaca.service.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

if (!process.env.MONGODB_URL) {
  console.log('Please provide MONGODB_URI in the environment variables');
  process.exit(1);
}

// Create HTTP server (required for Socket.IO)
const httpServer = createServer(app);

// Socket.IO setup — reuse same CORS origins as Express
const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

// Track which symbols each socket is subscribed to
// and how many sockets are watching each symbol
const symbolRefCount = new Map();

io.on('connection', (socket) => {
  let currentSymbol = null;

  socket.on('subscribe_ticker', (symbol) => {
    if (!symbol || typeof symbol !== 'string') return;
    const sym = symbol.toUpperCase();

    // Unsubscribe from previous symbol
    if (currentSymbol && currentSymbol !== sym) {
      socket.leave(currentSymbol);
      decrementRef(currentSymbol);
    }

    // Subscribe to new symbol
    currentSymbol = sym;
    socket.join(sym);
    incrementRef(sym);
  });

  socket.on('disconnect', () => {
    if (currentSymbol) {
      decrementRef(currentSymbol);
    }
  });
});

function incrementRef(symbol) {
  const count = (symbolRefCount.get(symbol) || 0) + 1;
  symbolRefCount.set(symbol, count);
  if (count === 1) {
    alpacaService.subscribe(symbol);
  }
}

function decrementRef(symbol) {
  const count = (symbolRefCount.get(symbol) || 0) - 1;
  if (count <= 0) {
    symbolRefCount.delete(symbol);
    alpacaService.unsubscribe(symbol);
  } else {
    symbolRefCount.set(symbol, count);
  }
}

// Relay Alpaca trade events to Socket.IO rooms
alpacaService.on('trade', (trade) => {
  io.to(trade.symbol).emit('price_update', {
    symbol: trade.symbol,
    price: trade.price,
    size: trade.size,
    timestamp: trade.timestamp,
  });
});

// Start
connectDB()
  .then(() => {
    // Connect to Alpaca WebSocket
    alpacaService.connect();

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  });