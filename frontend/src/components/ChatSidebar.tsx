import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, LogOut, ChevronLeft, ChevronRight, Terminal } from "lucide-react";
import { ConversationItem } from "@/lib/api";

const formatAgo = (isoDate: string) => {
  const updated = new Date(isoDate).getTime();
  const diffMin = Math.max(1, Math.floor((Date.now() - updated) / 60000));
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "Yesterday";
  return `${diffDay} days ago`;
};

interface ChatSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  chats: ConversationItem[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onLogout?: () => void;
}

export function ChatSidebar({
  collapsed,
  onToggle,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onLogout,
}: ChatSidebarProps) {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-terminal-950 border-r border-border/50 flex flex-col relative shrink-0 overflow-hidden"
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-terminal-800 border border-border/50 flex items-center justify-center hover:bg-primary/20 transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* New Scan Button */}
      <div className="p-3">
        <motion.button
          onClick={onNewChat}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors glow-blue"
        >
          <Plus size={18} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium tracking-wider whitespace-nowrap"
              >
                New Scan
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-1">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="px-2 py-2 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">
                Recent Scans
              </p>
              {chats.map((chat, i) => (
                <motion.button
                  key={chat._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onMouseEnter={() => setHoveredChat(chat._id)}
                  onMouseLeave={() => setHoveredChat(null)}
                  onClick={() => onSelectChat(chat._id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left mb-0.5 transition-all group ${
                    activeChatId === chat._id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <MessageSquare size={14} className="shrink-0 opacity-50" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{chat.title}</p>
                    <p className="text-[10px] opacity-40">
                      {hoveredChat === chat._id ? "Open chat" : formatAgo(chat.updatedAt)}
                    </p>
                  </div>
                </motion.button>
              ))}
              {chats.length === 0 && (
                <p className="px-3 py-2 text-[11px] text-muted-foreground/50">No scans yet</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Watermark / Profile */}
      <div className="p-3 border-t border-border/30">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <Terminal size={13} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase">
                    whitecoder
                  </p>
                  <p className="text-[9px] text-muted-foreground/30">terminal v2.0</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-md hover:bg-destructive/20 transition-colors text-destructive/60 hover:text-destructive"
              >
                <LogOut size={14} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <Terminal size={16} className="text-muted-foreground/40" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
