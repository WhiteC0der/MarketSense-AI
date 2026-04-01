"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import StockChart from "./StockChart";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { chatAPI, stockAPI, newsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Build welcome message with personalized ticker
const buildWelcome = (ticker) => ({
  role: "ai",
  content: `Welcome to **MarketSense AI**. Enter a stock ticker and click **SCAN** to ingest fresh data for **${ticker}**, then ask any market question.`,
});

// Normalize source data from RAG response
const normalizeSource = (src) => {
  let sourceLabel = src.source;
  if (!sourceLabel && src.url) {
    try {
      sourceLabel = new URL(src.url).hostname.replace("www.", "");
    } catch {
      sourceLabel = "Market News";
    }
  }
  return {
    headline: src.headline,
    summary: src.summary,
    url: src.url,
    source: sourceLabel || "Market News",
  };
};

export default function Dashboard() {
  const { logout } = useAuth();
  // Default sidebar collapsed on mobile devices
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showChart, setShowChart] = useState(false);
  const [currentTicker, setCurrentTicker] = useState("AAPL");
  const [tickerInput, setTickerInput] = useState("AAPL");
  const [messages, setMessages] = useState([buildWelcome("AAPL")]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const messagesEndRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [recentChats, setRecentChats] = useState([]);

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse sidebar on mobile
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed]);
  const [activeChatId, setActiveChatId] = useState(null);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await chatAPI.getHistory();
        if (history && history.length > 0) {
          const formattedChats = history.map((chat) => ({
            id: chat._id || chat.id,
            ticker: chat.title ? extractTickerFromTitle(chat.title) : "UNKNOWN",
            title: chat.title,
            messageSnippet: chat.messages?.[0]?.content?.substring(0, 30) || "",
            timestamp: new Date(chat.updatedAt || new Date()),
          }));
          setRecentChats(formattedChats);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
        setRecentChats([]);
      }
    };

    loadChatHistory();
  }, []);

  // Load specific chat conversation
  const handleSelectChat = async (chatId) => {
    setActiveChatId(chatId);
    try {
      const chat = await chatAPI.getChat(chatId);
      if (chat && chat.messages) {
        // Extract and update ticker from chat title
        const chatTicker = chat.title ? extractTickerFromTitle(chat.title) : "AAPL";
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
      console.error("Failed to load chat:", err);
      toast.error("Failed to load chat", {
        description: err instanceof Error ? err.message : "Please try again",
      });
      setMessages([buildWelcome(currentTicker)]);
      setActiveChatId(null); // Clear active chat on error
    }
  };

  // Extract ticker from chat title
  const extractTickerFromTitle = (title) => {
    const match = title.match(/([A-Z]{1,5})/);
    return match ? match[1] : "UNKNOWN";
  };

  // Refresh chat history after sending message
  const refreshChatHistory = async () => {
    try {
      const history = await chatAPI.getHistory();
      if (history && history.length > 0) {
        const formattedChats = history.map((chat) => ({
          id: chat._id || chat.id,
          ticker: chat.title ? extractTickerFromTitle(chat.title) : "UNKNOWN",
          title: chat.title,
          messageSnippet: chat.messages?.[0]?.content?.substring(0, 30) || "",
          timestamp: new Date(chat.updatedAt || new Date()),
        }));
        setRecentChats(formattedChats);
      }
    } catch (err) {
      console.error("Failed to refresh chat history:", err);
    }
  };

  // Create a new chat session with default AAPL ticker
  const handleNewChat = () => {
    // Reset chat to default AAPL state
    setCurrentTicker("AAPL");
    setTickerInput("AAPL");
    setMessages([buildWelcome("AAPL")]);
    setChartData(null);
    setCurrentPrice(null);
    setShowChart(false);
    setActiveChatId(null); // Clear active chat
    
    toast.success("New chat started with AAPL", {
      description: "Ready to analyze. Click SCAN to ingest latest data.",
    });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      } catch (err) {
        if (mounted) {
          setCurrentPrice(null);
        }
      }
    };

    // Initial fetch
    fetchPrice();
    // Update every 15 seconds
    const intervalId = setInterval(fetchPrice, 15000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [currentTicker]);

  // Handle ticker search and validation
  const handleScan = async () => {
    const raw = tickerInput.trim();
    if (!raw) return;

    setIsScanning(true);
    try {
      // Search and validate ticker
      const found = await stockAPI.search(raw);
      const symbol = found.symbol.toUpperCase();
      
      // Update ticker and reset chat
      setCurrentTicker(symbol);
      setTickerInput(symbol);
      setMessages([buildWelcome(symbol)]);
      setActiveChatId(null); // Clear active chat when searching new ticker

      // Add or update recent chats
      setRecentChats((prev) => {
        const updated = [...prev];
        const existingIndex = updated.findIndex((chat) => chat.ticker === symbol);
        
        if (existingIndex >= 0) {
          // Move existing chat to top
          const [chat] = updated.splice(existingIndex, 1);
          return [chat, ...updated];
        }
        
        // Create new chat entry
        return [{
          id: Date.now(),
          ticker: symbol,
          title: `Chat with ${symbol}`,
          messageSnippet: "", // Will be filled from first user message
          timestamp: new Date(),
        }, ...prev];
      });

      // Try to ingest news for this ticker
      try {
        await newsAPI.ingest(symbol);
        toast.success("Ticker resolved and news ingested", {
          description: `Ready to analyze ${symbol}. Ask any market question!`,
        });
      } catch (ingestErr) {
        toast.warning("Ticker resolved, but news ingestion failed", {
          description: `Showing ${symbol} price data. Try SCAN again in a moment for latest news.`,
        });
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : `No stock match found for "${raw}". Please type a proper company name or exact stock ticker.`;

      toast.error("Unable to resolve ticker", {
        description: message,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Handle sending chat message
  const handleSendMessage = async (question) => {
    if (!question.trim() || !currentTicker) return;

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Update recent chats with message snippet if this is first message
    setRecentChats((prev) => {
      const updated = [...prev];
      const existingIndex = updated.findIndex((chat) => chat.ticker === currentTicker);
      
      if (existingIndex >= 0) {
        // Update existing chat with first message snippet
        if (!updated[existingIndex].messageSnippet) {
          updated[existingIndex].messageSnippet = question.substring(0, 30);
          updated[existingIndex].timestamp = new Date();
        }
        // Move to top
        const [chat] = updated.splice(existingIndex, 1);
        return [chat, ...updated];
      }
      
      // If no existing chat, create new one
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
        role: "ai",
        content: response.answer || response.response || "No response received",
        sources: mappedSources.length > 0 ? mappedSources : [],
      };
      
      setMessages((prev) => [...prev, aiMessage]);

      // Set active chat ID if we got one back
      if (!activeChatId && response.chatId) {
        setActiveChatId(response.chatId);
      }

      // Refresh chat history to sync with backend
      await refreshChatHistory();
    } catch (err) {
      toast.error("Failed to get response", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
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
        />

        {/* Chart Area */}
        <StockChart isVisible={showChart} chartData={chartData} ticker={currentTicker} />

        {/* Chat Interface */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        <div ref={messagesEndRef} />

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
