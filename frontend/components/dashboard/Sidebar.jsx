"use client";

import {
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
} from "lucide-react";
import { useState } from "react";

// Format timestamp to relative time (e.g., "14 days ago", "just now")
const formatTimeAgo = (date) => {
  if (!date) return "";
  const messageDate = new Date(date);
  const now = new Date();
  const diffMs = now - messageDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  }
  return "a year ago";
};

// Create chat title from ticker and first message words
const createChatTitle = (ticker, messageSnippet) => {
  if (!messageSnippet) return ticker;
  const words = messageSnippet.split(" ").slice(0, 2).join(" ");
  return `${ticker} - ${words}${messageSnippet.split(" ").length > 2 ? "..." : ""}`;
};

export default function Sidebar({
  collapsed,
  onToggle,
  currentTicker,
  onSelectTicker,
  onSelectChat,
  onNewChat,
  recentChats = [],
  activeChatId,
  onLogout,
}) {
  // Use recentChats from Dashboard or empty array
  const displayChats = recentChats && recentChats.length > 0 
    ? recentChats 
    : [];

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    }
  };

  const handleSelectChat = (chatId, ticker) => {
    onSelectTicker(ticker);
    if (onSelectChat) {
      onSelectChat(chatId);
    }
  };

  return (
    <aside
      className={`flex flex-col h-full bg-zinc-900/60 backdrop-blur-md border-r border-zinc-800 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* New Scan Button */}
      <div className="p-3">
        <button
          onClick={handleNewChatClick}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-medium transition-all duration-200 ${
            collapsed ? "px-2" : ""
          }`}
        >
          <Plus className="w-5 h-5" />
          {!collapsed && <span>New Scan</span>}
        </button>
      </div>

      {/* Recent Chats */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!collapsed && (
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Recent Scans
            </span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
          {displayChats.map((chat) => {
            const chatTitle = createChatTitle(chat.ticker, chat.messageSnippet || chat.title);
            const timeAgo = formatTimeAgo(chat.timestamp);
            
            return (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id, chat.ticker)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  activeChatId === chat.id
                    ? "bg-zinc-800 border border-teal-500/50"
                    : "hover:bg-zinc-800/80"
                } ${collapsed ? "justify-center" : ""}`}
                title={chatTitle}
              >
                <MessageSquare
                  className={`w-4 h-4 shrink-0 ${
                    activeChatId === chat.id
                      ? "text-teal-400"
                      : "text-zinc-500"
                  }`}
                />
                {!collapsed && (
                  <div className="flex flex-col items-start overflow-hidden min-w-0 flex-1">
                    <span
                      className={`text-sm truncate w-full text-left ${
                        currentTicker === chat.ticker
                          ? "text-white font-medium"
                          : "text-zinc-300"
                      }`}
                    >
                      {chatTitle}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {timeAgo}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-zinc-800 p-3 space-y-2">
        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>

        {/* User Profile / Logout */}
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-800/50 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Zap className="w-4 h-4 text-teal-400 shrink-0" />
          {!collapsed && (
            <span className="text-xs font-mono text-zinc-400 truncate flex-1">
              MarketSense AI
            </span>
          )}
          <button
            onClick={onLogout}
            className="text-zinc-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
