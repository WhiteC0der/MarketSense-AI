// frontend/src/App.jsx
import React, { useState } from 'react';
import axios from 'axios';
import ChatInterface from './components/ChatInterface';
import StockChart from './components/StockChart';

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  // Handle the search bar submission
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    const newTicker = searchInput.toUpperCase().trim();
    setTicker(newTicker); // This instantly updates the StockChart
    setSearchInput("");   // Clear the input box

    // Trigger the background AI ingestion pipeline
    setIsIngesting(true);
    try {
      console.log(`Commanding backend to ingest data for ${newTicker}...`);
      await axios.post(`http://localhost:3000/api/v1/news/ingest/${newTicker}`);
      console.log(`Ingestion complete for ${newTicker}. Database updated.`);
    } catch (error) {
      console.error("Failed to ingest new stock data", error);
    } finally {
      setIsIngesting(false);
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