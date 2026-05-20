import { memo, useCallback } from 'react';
import {
  Plus, MessageSquare, ChevronLeft, ChevronRight, LogOut, Zap, X,
} from 'lucide-react';

const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

const createChatTitle = (ticker, snippet) => {
  if (!snippet) return ticker;
  const words = snippet.split(' ').slice(0, 2).join(' ');
  return `${ticker} - ${words}${snippet.split(' ').length > 2 ? '...' : ''}`;
};

function Sidebar({ collapsed, isMobile, isOpen, onToggle, onClose, currentTicker, onSelectTicker, onSelectChat, onNewChat, recentChats = [], activeChatId, onLogout }) {
  const displayChats = recentChats?.length > 0 ? recentChats : [];

  const handleSelect = useCallback((id, ticker) => {
    onSelectTicker(ticker);
    onSelectChat?.(id);
  }, [onSelectTicker, onSelectChat]);

  // On mobile: render as a fixed drawer
  // On desktop: render as a collapsible sidebar
  const isDrawer = isMobile;
  const isVisible = isDrawer ? isOpen : true;

  if (isDrawer && !isVisible) return null;

  const sidebarContent = (
    <>
      {/* Mobile drawer header with close button */}
      {isDrawer && (
        <div className="flex items-center justify-between p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-semibold text-white">MarketSense AI</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="p-3">
        <button onClick={onNewChat} className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-medium transition-all duration-200 ${!isDrawer && collapsed ? 'px-2' : ''}`}>
          <Plus className="w-5 h-5" />
          {(isDrawer || !collapsed) && <span>New Scan</span>}
        </button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {(isDrawer || !collapsed) && <div className="px-4 py-2"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recent Scans</span></div>}
        <div className="flex-1 overflow-y-auto custom-scrollbar touch-scroll px-2 space-y-1">
          {displayChats.map((chat) => (
            <button key={chat.id} onClick={() => handleSelect(chat.id, chat.ticker)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeChatId === chat.id ? 'bg-zinc-800 border border-teal-500/50' : 'hover:bg-zinc-800/80'} ${!isDrawer && collapsed ? 'justify-center' : ''}`}
              title={createChatTitle(chat.ticker, chat.messageSnippet || chat.title)}>
              <MessageSquare className={`w-4 h-4 shrink-0 ${activeChatId === chat.id ? 'text-teal-400' : 'text-zinc-500'}`} />
              {(isDrawer || !collapsed) && (
                <div className="flex flex-col items-start overflow-hidden min-w-0 flex-1">
                  <span className={`text-sm truncate w-full text-left ${currentTicker === chat.ticker ? 'text-white font-medium' : 'text-zinc-300'}`}>
                    {createChatTitle(chat.ticker, chat.messageSnippet || chat.title)}
                  </span>
                  <span className="text-xs text-zinc-500">{formatTimeAgo(chat.timestamp)}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-zinc-800 p-3 space-y-2">
        {!isDrawer && (
          <button onClick={onToggle} className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all duration-200">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-sm">Collapse</span></>}
          </button>
        )}
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-800/50 ${!isDrawer && collapsed ? 'justify-center' : ''}`}>
          <Zap className="w-4 h-4 text-teal-400 shrink-0" />
          {(isDrawer || !collapsed) && <span className="text-xs font-mono text-zinc-400 truncate flex-1">MarketSense AI</span>}
          <button onClick={onLogout} className="text-zinc-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  // Mobile drawer mode
  if (isDrawer) {
    return (
      <aside className={`mobile-drawer ${isOpen ? 'open' : ''} w-72 flex flex-col bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800 safe-top safe-bottom`}>
        {sidebarContent}
      </aside>
    );
  }

  // Desktop collapsible sidebar
  return (
    <aside className={`flex flex-col h-full bg-zinc-900/60 backdrop-blur-md border-r border-zinc-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {sidebarContent}
    </aside>
  );
}

export default memo(Sidebar);
