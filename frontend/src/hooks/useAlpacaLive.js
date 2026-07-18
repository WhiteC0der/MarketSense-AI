import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Hook that connects to the backend Socket.IO server and subscribes
 * to live Alpaca trade updates for the given ticker.
 *
 * Returns { livePrice, liveTicks, isConnected }
 *   - livePrice: latest price number (or null)
 *   - liveTicks: array of { time, price } for chart overlay (last 60)
 *   - isConnected: boolean — true when Socket.IO is connected
 */

// Derive Socket.IO URL from the API base URL (strip /api/v1)
const getSocketUrl = () => {
  const raw = import.meta.env.VITE_API_BASE_URL || '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed.slice(0, -7);
  if (trimmed) return trimmed;
  return 'http://localhost:3000';
};

const SOCKET_URL = getSocketUrl();
const MAX_TICKS = 60;

export function useAlpacaLive(ticker) {
  const [livePrice, setLivePrice] = useState(null);
  const [liveTicks, setLiveTicks] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const tickerRef = useRef(ticker);

  // Keep tickerRef in sync
  useEffect(() => {
    tickerRef.current = ticker;
  }, [ticker]);

  // Reset live data when ticker changes
  const resetLiveData = useCallback(() => {
    setLivePrice(null);
    setLiveTicks([]);
  }, []);

  useEffect(() => {
    resetLiveData();

    // Create socket connection (reuses existing if same URL)
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: Infinity,
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        // Subscribe to current ticker on (re)connect
        if (tickerRef.current) {
          socketRef.current.emit('subscribe_ticker', tickerRef.current);
        }
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
      });

      socketRef.current.on('price_update', (data) => {
        // Only process updates for the currently active ticker
        if (data.symbol !== tickerRef.current) return;

        setLivePrice(data.price);
        setLiveTicks((prev) => {
          const tick = {
            time: new Date(data.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            price: data.price,
          };
          const next = [...prev, tick];
          return next.length > MAX_TICKS ? next.slice(-MAX_TICKS) : next;
        });
      });
    }

    // Subscribe to the new ticker
    const socket = socketRef.current;
    if (socket.connected && ticker) {
      socket.emit('subscribe_ticker', ticker);
    }

    return () => {
      // Don't disconnect the socket — just let the server handle room cleanup
      // when we subscribe to a new ticker (server replaces the old subscription)
    };
  }, [ticker, resetLiveData]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return { livePrice, liveTicks, isConnected };
}
