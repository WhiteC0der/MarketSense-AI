import { EventEmitter } from 'events';
import WebSocket from 'ws';

/**
 * Alpaca Market Data WebSocket Service
 * Connects to wss://stream.data.alpaca.markets/v2/iex (free tier)
 * Subscribes to real-time trade updates and emits them via EventEmitter.
 *
 * Free tier limits: 200 API calls/min, 30 symbols max, 1 WS connection.
 */

const ALPACA_WS_URL = 'wss://stream.data.alpaca.markets/v2/iex';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

class AlpacaService extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.authenticated = false;
    this.subscribedSymbols = new Set();
    this.reconnectDelay = RECONNECT_DELAY_MS;
    this.reconnectTimer = null;
    this.shouldReconnect = true;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const apiKey = process.env.ALPACA_API_KEY_ID;
    const secretKey = process.env.ALPACA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.warn('[Alpaca] Missing API keys. Live prices disabled.');
      return;
    }

    console.log('[Alpaca] Connecting to', ALPACA_WS_URL);
    this.ws = new WebSocket(ALPACA_WS_URL);

    this.ws.on('open', () => {
      console.log('[Alpaca] WebSocket connected. Authenticating...');
      this.ws.send(JSON.stringify({
        action: 'auth',
        key: apiKey,
        secret: secretKey,
      }));
    });

    this.ws.on('message', (raw) => {
      try {
        const messages = JSON.parse(raw.toString());
        for (const msg of messages) {
          this._handleMessage(msg);
        }
      } catch (err) {
        console.error('[Alpaca] Failed to parse message:', err.message);
      }
    });

    this.ws.on('close', () => {
      console.log('[Alpaca] WebSocket closed.');
      this.authenticated = false;
      this._scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('[Alpaca] WebSocket error:', err.message);
    });
  }

  _handleMessage(msg) {
    switch (msg.T) {
      case 'success':
        if (msg.msg === 'connected') {
          console.log('[Alpaca] Connected to stream.');
        } else if (msg.msg === 'authenticated') {
          console.log('[Alpaca] Authenticated successfully.');
          this.authenticated = true;
          this.reconnectDelay = RECONNECT_DELAY_MS;
          // Re-subscribe any symbols after reconnect
          if (this.subscribedSymbols.size > 0) {
            this._sendSubscribe([...this.subscribedSymbols]);
          }
        }
        break;

      case 'error':
        console.error('[Alpaca] Error:', msg.code, msg.msg);
        break;

      case 't': // Trade update
        this.emit('trade', {
          symbol: msg.S,
          price: msg.p,
          size: msg.s,
          timestamp: msg.t,
        });
        break;

      // Ignore quotes (q), bars (b), etc. — we only need trades
    }
  }

  subscribe(symbol) {
    const sym = symbol.toUpperCase();
    if (this.subscribedSymbols.has(sym)) return;
    if (this.subscribedSymbols.size >= 30) {
      console.warn('[Alpaca] Max 30 symbols reached. Cannot subscribe to', sym);
      return;
    }

    this.subscribedSymbols.add(sym);
    if (this.authenticated) {
      this._sendSubscribe([sym]);
    }
  }

  unsubscribe(symbol) {
    const sym = symbol.toUpperCase();
    if (!this.subscribedSymbols.has(sym)) return;

    this.subscribedSymbols.delete(sym);
    if (this.authenticated) {
      this._sendUnsubscribe([sym]);
    }
  }

  _sendSubscribe(symbols) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', trades: symbols }));
      console.log('[Alpaca] Subscribed to:', symbols.join(', '));
    }
  }

  _sendUnsubscribe(symbols) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'unsubscribe', trades: symbols }));
      console.log('[Alpaca] Unsubscribed from:', symbols.join(', '));
    }
  }

  _scheduleReconnect() {
    if (!this.shouldReconnect) return;

    clearTimeout(this.reconnectTimer);
    console.log(`[Alpaca] Reconnecting in ${this.reconnectDelay / 1000}s...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
  }

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.authenticated = false;
    this.subscribedSymbols.clear();
  }
}

// Singleton
const alpacaService = new AlpacaService();
export default alpacaService;
