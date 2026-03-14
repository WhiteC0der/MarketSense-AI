import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SourceCards } from "./SourceCards";

interface Source {
  headline: string;
  source?: string;
  summary: string;
  url?: string;
}

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
  sources?: Source[];
  index: number;
}

export function ChatMessage({ role, content, sources, index }: ChatMessageProps) {
  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35 }}
        className="flex justify-end mb-4"
      >
        <div
          className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md text-sm text-foreground leading-relaxed"
          style={{ background: "var(--gradient-blue)" }}
        >
          {content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="flex items-start gap-3 mb-5"
    >
      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        {sources && sources.length > 0 && <SourceCards sources={sources} />}
        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {content.split(/(\*\*.*?\*\*)/).map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      </div>
    </motion.div>
  );
}
