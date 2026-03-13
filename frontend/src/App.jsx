// frontend/src/App.jsx
import React, { useState } from 'react';
import axios from 'axios';
import ChatInterface from './components/ChatInterface';
import StockChart from './components/StockChart';
import Auth from './components/Auth';

// Tell Axios to ALWAYS send the HTTP-Only cookie with every request to the backend
axios.defaults.withCredentials = true;

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  // Handle the search bar submission
  // Handle the search bar submission
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    setIsIngesting(true);
    const rawInput = searchInput.trim();
    setSearchInput(""); 

    let officialTicker = "";

    // STEP 1: Translate the Ticker
    try {
      console.log(`Translating human text: "${rawInput}"...`);
      const searchResponse = await axios.get(`http://localhost:3000/api/v1/stock/search/${rawInput}`);
      officialTicker = searchResponse.data.symbol.toUpperCase(); 
      console.log(`Successfully translated to: ${officialTicker}`);
      
      setTicker(officialTicker); // Update the chart
    } catch (error) {
      console.error("Translation Failed:", error);
      alert(`Sorry, we couldn't find a valid stock ticker for "${rawInput}".`);
      setIsIngesting(false);
      return; // Stop the function here if translation fails
    }

    // STEP 2: Ingest the News
    try {
      console.log(`Starting ingestion for ${officialTicker}...`);
      await axios.post(`http://localhost:3000/api/v1/news/ingest/${officialTicker}`);
      console.log(`Ingestion complete for ${officialTicker}`);
    } catch (error) {
      console.error("Ingestion Failed:", error);
      alert(`We found ${officialTicker}, but failed to download the latest news. (Check backend terminal for Gemini rate limits).`);
    } finally {
      setIsIngesting(false);
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // ... (Keep all your existing state variables like ticker, searchInput, etc.) ...

  // 2. The Gatekeeper: If not authenticated, ONLY render the Auth component
  if (!isAuthenticated) {
    return <Auth onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3000/api/v1/auth/logout');
      setIsAuthenticated(false); // This instantly kicks them back to the Login screen
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8">
      
      <header className="mb-8 text-center max-w-md mx-auto">
        <h1 className="text-4xl font-black tracking-widest text-white mb-2">
          MARKET<span className="text-primary">SENSE</span>
        </h1>
        
        {/* The New Dynamic Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Ticker (e.g., TSLA, NVDA)"
            className="flex-1 bg-surface text-white p-3 rounded border border-gray-700 focus:outline-none focus:border-primary text-center uppercase tracking-widest font-bold"
          />
          <button 
            type="submit"
            className="bg-primary hover:bg-blue-600 px-6 rounded font-bold transition-colors"
          >
            SCAN
          </button>
        </form>
        <button 
  onClick={handleLogout} 
  className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
>
  Logout
</button>

        {/* Loading indicator for the background database update */}
        {isIngesting && (
          <p className="text-xs text-primary mt-3 animate-pulse tracking-widest uppercase">
            Downloading {ticker} documents to Vector Database...
          </p>
        )}
      </header>

      <main className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        <div className="w-full flex justify-center">
          <StockChart ticker={ticker} />
        </div>

        <div className="w-full flex justify-center">
          {/* We pass the current ticker down to the chat so the AI knows what we are looking at */}
          <ChatInterface currentTicker={ticker} />
        </div>

      </main>
    </div>
  );
}

export default App;