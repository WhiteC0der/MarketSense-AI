import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-start gap-3 py-3"
    >
      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 pulse-glow">
        <Sparkles size={14} className="text-primary" />
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        <span className="text-xs font-mono tracking-wider text-muted-foreground/60 mr-2">
          Analyzing vectors
        </span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary typing-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
