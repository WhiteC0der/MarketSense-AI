import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatInterface from './components/ChatInterface';
import StockChart from './components/StockChart';
import Auth from './components/Auth';

// Tell Axios to ALWAYS send the HTTP-Only cookie with every request
axios.defaults.withCredentials = true;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ticker, setTicker] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  // --- NEW: Chat History State ---
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Fetch sidebar history whenever the user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated]);

  // Rehydrate session from stored JWT cookie on app mount
  useEffect(() => {
    const rehydrateSession = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/auth/me');
        if (response.data.authenticated) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.debug("Session rehydrate check: not authenticated");
      }
    };
    rehydrateSession();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/v1/chat/history');
      setChatHistory(res.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
  };

  // Handle the search bar submission
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    setIsIngesting(true);
    const rawInput = searchInput.trim();
    setSearchInput(""); 

    let officialTicker = "";

    try {
      const searchResponse = await axios.get(`http://localhost:3000/api/v1/stock/search/${rawInput}`);
      officialTicker = searchResponse.data.symbol.toUpperCase(); 
      setTicker(officialTicker); 
    } catch (error) {
      alert(`Sorry, we couldn't find a valid stock ticker for "${rawInput}".`);
      setIsIngesting(false);
      return; 
    }

    try {
      await axios.post(`http://localhost:3000/api/v1/news/ingest/${officialTicker}`);
    } catch (error) {
      alert(`We found ${officialTicker}, but failed to download the latest news.`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3000/api/v1/auth/logout');
      setIsAuthenticated(false);
      setChatHistory([]); // Clear history on logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-white font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR: Chat History */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-800">
          <button 
            onClick={startNewChat}
            className="w-full border border-gray-600 hover:border-primary text-white py-2 px-4 rounded transition-colors uppercase tracking-widest text-sm font-bold"
          >
            + New Scan
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
          {chatHistory.map(chat => (
            <button
              key={chat._id}
              onClick={() => setCurrentChatId(chat._id)}
              className={`w-full text-left p-3 rounded text-sm truncate transition-colors ${
                currentChatId === chat._id ? 'bg-gray-800 text-primary' : 'hover:bg-gray-800 text-gray-400'
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full text-red-500 hover:text-red-400 text-sm font-bold tracking-wider transition-colors">
            LOG OUT
          </button>
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8">
        
        <header className="mb-8 text-center max-w-md mx-auto">
          <h1 className="text-4xl font-black tracking-widest text-white mb-2">
            MARKET<span className="text-primary text-blue-500">SENSE</span>
          </h1>
          
          <form onSubmit={handleSearch} className="mt-6 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search Ticker (e.g., TSLA)"
              className="flex-1 bg-gray-900 text-white p-3 rounded border border-gray-700 focus:outline-none focus:border-blue-500 text-center uppercase tracking-widest font-bold"
            />
            <button 
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 px-6 rounded font-bold transition-colors"
            >
              SCAN
            </button>
          </form>

          {isIngesting && (
            <p className="text-xs text-blue-400 mt-3 animate-pulse tracking-widest uppercase">
              Downloading {ticker} documents to Vector DB...
            </p>
          )}
        </header>

        <main className="max-w-[1400px] mx-auto w-full grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1">
          <div className="w-full flex justify-center bg-gray-900 rounded-xl border border-gray-800 p-4">
            <StockChart ticker={ticker} />
          </div>

          <div className="w-full flex flex-col h-[600px] bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* We pass the currentChatId and a callback to refresh the sidebar! */}
            <ChatInterface 
              currentTicker={ticker} 
              chatId={currentChatId} 
              onChatCreated={fetchHistory} 
            />
          </div>
        </main>

      </div>
    </div>
  );
}

export default App;