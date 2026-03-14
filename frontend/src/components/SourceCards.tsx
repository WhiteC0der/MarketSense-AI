import { motion } from "framer-motion";
import { ExternalLink, Newspaper } from "lucide-react";

interface Source {
  headline: string;
  source: string;
  summary: string;
  url?: string;
}

interface SourceCardsProps {
  sources: Source[];
}

export function SourceCards({ sources }: SourceCardsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2 mb-3">
      {sources.map((src, i) => (
        <motion.a
          key={i}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          href={src.url || "#"}
          target={src.url ? "_blank" : undefined}
          rel={src.url ? "noopener noreferrer" : undefined}
          className="glass-source-card p-3 min-w-[220px] max-w-[240px] shrink-0 cursor-pointer hover:border-primary/40 transition-colors group"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Newspaper size={11} className="text-primary/60" />
            <span className="text-[10px] font-mono tracking-wider text-primary/60 uppercase truncate">
              {src.source || "Market News"}
            </span>
            <ExternalLink size={9} className="text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs font-medium text-foreground/90 leading-tight mb-1 line-clamp-2">
            {src.headline}
          </p>
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed line-clamp-2">
            {src.summary}
          </p>
        </motion.a>
      ))}
    </div>
  );
}
