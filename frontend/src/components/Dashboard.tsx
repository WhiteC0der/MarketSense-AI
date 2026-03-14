import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Activity, Send } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { StockChart } from "./StockChart";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { toast } from "@/components/ui/sonner";
import { chatAPI, ConversationItem, newsAPI, SourceItem, stockAPI } from "@/lib/api";

type UiMessage = {
  role: "user" | "ai";
  content: string;
  sources?: Array<{ headline: string; summary: string; source?: string; url?: string }>;
};

const buildWelcome = (ticker: string): UiMessage => ({
  role: "ai",
  content: `Welcome to **MarketSense AI**. Enter a stock ticker and click **SCAN** to ingest fresh data for **${ticker}**, then ask any market question.`,
});

const normalizeSource = (src: SourceItem) => {
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

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [tickerInput, setTickerInput] = useState("AAPL");
  const [currentTicker, setCurrentTicker] = useState("AAPL");
  const [messages, setMessages] = useState<UiMessage[]>([buildWelcome("AAPL")]);
  const [chatHistory, setChatHistory] = useState<ConversationItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chatAPI.getHistory();
        setChatHistory(history);
      } catch {
        setChatHistory([]);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([buildWelcome(currentTicker)]);
      return;
    }

    const loadChat = async () => {
      try {
        const chat = await chatAPI.getChat(activeChatId);
        const mapped: UiMessage[] = (chat.messages || [])
          .flatMap((msg) => {
            if (msg.role === "user") {
              return [{ role: "user", content: msg.content }];
            }

            if (msg.role === "ai") {
              return [{ role: "ai", content: msg.content }];
            }

            if (msg.role === "system" && msg.sources && msg.sources.length > 0) {
              return [
                {
                  role: "ai",
                  content: msg.content,
                  sources: msg.sources.map(normalizeSource),
                },
              ];
            }

            return [];
          });

        setMessages(mapped.length > 0 ? mapped : [buildWelcome(currentTicker)]);
      } catch {
        setMessages([buildWelcome(currentTicker)]);
      }
    };

    loadChat();
  }, [activeChatId, currentTicker]);

  useEffect(() => {
    let mounted = true;

    const pullPrice = async () => {
      try {
        const quote = await stockAPI.getChart(currentTicker);
        if (mounted) {
          setLivePrice(quote.currentPrice ?? null);
        }
      } catch {
        if (mounted) {
          setLivePrice(null);
        }
      }
    };

    pullPrice();
    const intervalId = setInterval(pullPrice, 15000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [currentTicker]);

  const refreshHistory = async () => {
    try {
      const history = await chatAPI.getHistory();
      setChatHistory(history);
    } catch {
      // no-op, keep current history
    }
  };

  const handleScan = async () => {
    const raw = tickerInput.trim();
    if (!raw) return;

    setIsScanning(true);
    try {
      const found = await stockAPI.search(raw);
      const symbol = found.symbol.toUpperCase();
      setCurrentTicker(symbol);
      setTickerInput(symbol);
      setActiveChatId(null);
      setMessages([buildWelcome(symbol)]);

      try {
        await newsAPI.ingest(symbol);
      } catch {
        toast("Ticker resolved, but news ingestion failed", {
          description: `Showing ${symbol} price data. Try SCAN again in a moment for latest news.`,
        });
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : `No stock match found for \"${raw}\". Please type a proper company name or exact stock ticker.`;

      toast("Unable to resolve ticker", {
        description: message,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await chatAPI.sendMessage(userText, currentTicker, activeChatId || undefined);
      const mappedSources = (response.sources || []).map(normalizeSource);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: response.answer,
          sources: mappedSources.length > 0 ? mappedSources : undefined,
        },
      ]);

      if (!activeChatId && response.chatId) {
        setActiveChatId(response.chatId);
      }

      await refreshHistory();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "I couldn't reach the backend right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ChatSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        chats={chatHistory}
        activeChatId={activeChatId}
        onSelectChat={(chatId) => setActiveChatId(chatId)}
        onNewChat={() => {
          setActiveChatId(null);
          setMessages([buildWelcome(currentTicker)]);
        }}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="shrink-0 border-b border-border/30 bg-card/40 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-5 py-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                placeholder="Enter ticker (e.g. TSLA)"
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-terminal-950 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/40 font-mono tracking-wider focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <motion.button
              onClick={handleScan}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold tracking-widest hover:brightness-110 transition-all glow-blue disabled:opacity-60"
              disabled={isScanning}
            >
              {isScanning ? "SCANNING" : "SCAN"}
            </motion.button>

            {/* Live Price Pill */}
            <motion.button
              onClick={() => setShowChart(!showChart)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono tracking-wider transition-all cursor-pointer ${
                showChart
                  ? "bg-accent/15 border-accent/40 text-accent"
                  : "bg-terminal-800/50 border-border/50 text-muted-foreground hover:border-accent/40 hover:text-accent"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${showChart ? "bg-accent pulse-glow" : "bg-muted-foreground/50"}`} />
              <Activity size={13} />
              <span>
                {currentTicker} {livePrice !== null ? `$${livePrice.toFixed(2)}` : "--"}
              </span>
            </motion.button>
          </div>

          {/* Expandable Chart */}
          <AnimatePresence>
            {showChart && <StockChart ticker={currentTicker} />}
          </AnimatePresence>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-6">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                sources={"sources" in msg ? msg.sources : undefined}
                index={i}
              />
            ))}
            <AnimatePresence>
              {isTyping && <TypingIndicator />}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border/30 bg-card/40 backdrop-blur-xl px-5 py-3">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask MarketSense AI anything..."
              className="flex-1 px-4 py-3 rounded-xl bg-terminal-950 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <motion.button
              onClick={handleSend}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all glow-blue"
            >
              <Send size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
