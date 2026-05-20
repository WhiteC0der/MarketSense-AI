import { memo, useCallback } from 'react';
import { Search, Loader2, Activity } from 'lucide-react';

function Header({
  showChart,
  onToggleChart,
  currentTicker,
  currentPrice,
  tickerInput,
  onTickerInputChange,
  onSearch,
  isSearching,
}) {
  const handleSearchClick = useCallback(() => {
    if (tickerInput.trim()) {
      onSearch();
    }
  }, [tickerInput, onSearch]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  }, [handleSearchClick]);

  return (
    <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      {/* Mobile Layout */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 gap-2 min-w-0">
        {/* Mobile Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Ticker"
            value={tickerInput}
            onChange={(e) => onTickerInputChange(e.target.value.toUpperCase())}
            onKeyDown={handleKeyPress}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-8 pr-2 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all disabled:opacity-50 font-mono"
            disabled={isSearching}
          />
        </div>
        {/* Mobile SCAN Button */}
        <button
          onClick={handleSearchClick}
          disabled={isSearching || !tickerInput.trim()}
          className="px-3 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 flex-shrink-0"
        >
          {isSearching ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <span>SCAN</span>
          )}
        </button>
        {/* Mobile Price Pill */}
        <button
          onClick={onToggleChart}
          className={`flex items-center gap-1 px-2 py-2 rounded-lg border text-xs transition-all duration-200 flex-shrink-0 ${
            showChart
              ? 'bg-zinc-800 border-teal-500/50'
              : 'bg-zinc-900/60 border-zinc-700'
          }`}
        >
          <div className="relative flex h-1.5 w-1.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
          </div>
          <span className="font-mono text-teal-400 font-semibold">{currentTicker}</span>
          {currentPrice && (
            <span className="text-teal-400 font-bold">
              ${currentPrice.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between px-4 py-3 gap-4 min-w-0">
        {/* Search Section */}
        <div className="flex items-center gap-3 flex-1 max-w-xl min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Enter ticker e.g. TSLA"
              value={tickerInput}
              onChange={(e) => onTickerInputChange(e.target.value.toUpperCase())}
              onKeyDown={handleKeyPress}
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all disabled:opacity-50 font-mono tracking-wider"
              disabled={isSearching}
            />
          </div>
          <button
            onClick={handleSearchClick}
            disabled={isSearching || !tickerInput.trim()}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'SCAN'
            )}
          </button>
        </div>

        {/* Live Price Pill */}
        <button
          onClick={onToggleChart}
          className={`flex items-center gap-1 px-6 py-2 rounded-full border transition-all duration-200 flex-shrink-0 ${
            showChart
              ? 'bg-zinc-800 border-teal-500/50'
              : 'bg-zinc-900/60 border-zinc-700 hover:border-teal-500/40 hover:bg-zinc-800/80'
          }`}
        >
          {/* Pulsing indicator */}
          <div className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </div>
          <Activity className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span className="text-xs font-mono tracking-widest uppercase text-zinc-400 hidden sm:inline">Live</span>
          <span className="text-sm font-medium text-white">{currentTicker}</span>
          {currentPrice && (
            <span className="text-sm font-semibold text-teal-400">
              ${currentPrice.toFixed(2)}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

export default memo(Header);
