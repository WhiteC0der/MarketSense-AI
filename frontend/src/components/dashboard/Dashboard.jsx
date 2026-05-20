import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { chatAPI, stockAPI, newsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/useMobile';
import { toast } from 'sonner';

// Lazy load StockChart since it includes recharts (~200KB)
const StockChart = lazy(() => import('./StockChart'));

// Build welcome message with personalized ticker
const buildWelcome = (ticker) => ({
  role: 'ai',
  content: `Welcome to **MarketSense AI**. Enter a stock ticker and click **SCAN** to ingest fresh data for **${ticker}**, then ask any market question.`,
});

// Normalize source data from RAG response
const normalizeSource = (src) => {
  let sourceLabel = src.source;
  if (!sourceLabel && src.url) {
    try {
      sourceLabel = new URL(src.url).hostname.replace('www.', '');
    } catch {
      sourceLabel = 'Market News';
    }
  }
  return {
    headline: src.headline,
    summary: src.summary,
    url: src.url,
    source: sourceLabel || 'Market News',
  };
};

// Extract ticker from chat title
const extractTickerFromTitle = (title) => {
  const match = title.match(/([A-Z]{1,5})/);
  return match ? match[1] : 'UNKNOWN';
};

export default function Dashboard() {
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [currentTicker, setCurrentTicker] = useState('AAPL');
  const [tickerInput, setTickerInput] = useState('AAPL');
  const [messages, setMessages] = useState(() => [buildWelcome('AAPL')]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const messagesEndRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // Close sidebar drawer when switching to desktop
  useEffect(() => {
    if (!isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile, sidebarOpen]);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await chatAPI.getHistory();
        if (history && history.length > 0) {
          const formattedChats = history.map((chat) => ({
            id: chat._id || chat.id,
            ticker: chat.title ? extractTickerFromTitle(chat.title) : 'UNKNOWN',
            title: chat.title,
            messageSnippet: chat.messages?.[0]?.content?.substring(0, 30) || '',
            timestamp: new Date(chat.updatedAt || new Date()),
          }));
          setRecentChats(formattedChats);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setRecentChats([]);
      }
    };

    loadChatHistory();
  }, []);

  // Load specific chat conversation
  const handleSelectChat = useCallback(async (chatId) => {
    setActiveChatId(chatId);
    // Close mobile drawer after selection
    if (isMobile) setSidebarOpen(false);
    try {
      const chat = await chatAPI.getChat(chatId);
      if (chat && chat.messages) {
        const chatTicker = chat.title ? extractTickerFromTitle(chat.title) : 'AAPL';
        setCurrentTicker(chatTicker);
        setTickerInput(chatTicker);

        const mappedMessages = chat.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          sources: msg.sources ? msg.sources.map(normalizeSource) : undefined,
        }));
        setMessages(mappedMessages.length > 0 ? mappedMessages : [buildWelcome(chatTicker)]);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
      toast.error('Failed to load chat', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
      setMessages([buildWelcome(currentTicker)]);
      setActiveChatId(null);
    }
  }, [currentTicker, isMobile]);

  // Refresh chat history after sending message
  const refreshChatHistory = useCallback(async () => {
    try {
      const history = await chatAPI.getHistory();
      if (history && history.length > 0) {
        const formattedChats = history.map((chat) => ({
          id: chat._id || chat.id,
          ticker: chat.title ? extractTickerFromTitle(chat.title) : 'UNKNOWN',
          title: chat.title,
          messageSnippet: chat.messages?.[0]?.content?.substring(0, 30) || '',
          timestamp: new Date(chat.updatedAt || new Date()),
        }));
        setRecentChats(formattedChats);
      }
    } catch (err) {
      console.error('Failed to refresh chat history:', err);
    }
  }, []);

  // Create a new chat session
  const handleNewChat = useCallback(() => {
    setCurrentTicker('AAPL');
    setTickerInput('AAPL');
    setMessages([buildWelcome('AAPL')]);
    setChartData(null);
    setCurrentPrice(null);
    setShowChart(false);
    setActiveChatId(null);
    // Close mobile drawer
    if (isMobile) setSidebarOpen(false);

    toast.success('New chat started with AAPL', {
      description: 'Ready to analyze. Click SCAN to ingest latest data.',
    });
  }, [isMobile]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch and update price every 15 seconds
  useEffect(() => {
    let mounted = true;

    const fetchPrice = async () => {
      try {
        const data = await stockAPI.getChart(currentTicker);
        if (mounted) {
          setChartData(data);
          setCurrentPrice(data.currentPrice ?? null);
        }
      } catch {
        if (mounted) {
          setCurrentPrice(null);
        }
      }
    };

    fetchPrice();
    const intervalId = setInterval(fetchPrice, 15000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [currentTicker]);

  // Handle ticker search
  const handleScan = useCallback(async () => {
    const raw = tickerInput.trim();
    if (!raw) return;

    setIsScanning(true);
    try {
      const found = await stockAPI.search(raw);
      const symbol = found.symbol.toUpperCase();

      setCurrentTicker(symbol);
      setTickerInput(symbol);
      setMessages([buildWelcome(symbol)]);
      setActiveChatId(null);

      setRecentChats((prev) => {
        const updated = [...prev];
        const existingIndex = updated.findIndex((chat) => chat.ticker === symbol);

        if (existingIndex >= 0) {
          const [chat] = updated.splice(existingIndex, 1);
          return [chat, ...updated];
        }

        return [{
          id: Date.now(),
          ticker: symbol,
          title: `Chat with ${symbol}`,
          messageSnippet: '',
          timestamp: new Date(),
        }, ...prev];
      });

      try {
        await newsAPI.ingest(symbol);
        toast.success('Ticker resolved and news ingested', {
          description: `Ready to analyze ${symbol}. Ask any market question!`,
        });
      } catch {
        toast.warning('Ticker resolved, but news ingestion failed', {
          description: `Showing ${symbol} price data. Try SCAN again in a moment for latest news.`,
        });
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : `No stock match found for "${raw}". Please type a proper company name or exact stock ticker.`;

      toast.error('Unable to resolve ticker', { description: message });
    } finally {
      setIsScanning(false);
    }
  }, [tickerInput]);

  // Handle sending chat message
  const handleSendMessage = useCallback(async (question) => {
    if (!question.trim() || !currentTicker) return;

    const userMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setRecentChats((prev) => {
      const updated = [...prev];
      const existingIndex = updated.findIndex((chat) => chat.ticker === currentTicker);

      if (existingIndex >= 0) {
        if (!updated[existingIndex].messageSnippet) {
          updated[existingIndex].messageSnippet = question.substring(0, 30);
          updated[existingIndex].timestamp = new Date();
        }
        const [chat] = updated.splice(existingIndex, 1);
        return [chat, ...updated];
      }

      return [{
        id: Date.now(),
        ticker: currentTicker,
        title: `Chat with ${currentTicker}`,
        messageSnippet: question.substring(0, 30),
        timestamp: new Date(),
      }, ...prev];
    });

    try {
      const response = await chatAPI.sendMessage(question, currentTicker, activeChatId || undefined);
      const mappedSources = (response.sources || []).map(normalizeSource);

      const aiMessage = {
        role: 'ai',
        content: response.answer || response.response || 'No response received',
        sources: mappedSources.length > 0 ? mappedSources : [],
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (!activeChatId && response.chatId) {
        setActiveChatId(response.chatId);
      }

      await refreshChatHistory();
    } catch (err) {
      toast.error('Failed to get response', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [currentTicker, activeChatId, refreshChatHistory]);

  // Toggle sidebar: on mobile opens/closes drawer, on desktop collapses/expands
  const handleSidebarToggle = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  return (
    <div className="flex h-screen-safe bg-zinc-950 text-white overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="mobile-backdrop animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        currentTicker={currentTicker}
        onSelectTicker={setCurrentTicker}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        recentChats={recentChats}
        activeChatId={activeChatId}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          showChart={showChart}
          onToggleChart={() => setShowChart(!showChart)}
          currentTicker={currentTicker}
          currentPrice={currentPrice}
          tickerInput={tickerInput}
          onTickerInputChange={setTickerInput}
          onSearch={handleScan}
          isSearching={isScanning}
          isMobile={isMobile}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Chart Area - Lazy loaded */}
        {showChart && (
          <Suspense fallback={
            <div className="h-40 md:h-52 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-center">
              <p className="text-zinc-500 text-sm animate-pulse">Loading chart...</p>
            </div>
          }>
            <StockChart isVisible={showChart} chartData={chartData} ticker={currentTicker} isMobile={isMobile} />
          </Suspense>
        )}

        {/* Chat Interface */}
        <ChatMessages messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!currentTicker}
        />
      </main>
    </div>
  );
}
