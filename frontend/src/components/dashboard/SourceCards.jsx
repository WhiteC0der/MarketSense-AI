import { memo } from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function SourceCards({ sources = [] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <motion.div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar mb-3" variants={containerVariants} initial="hidden" animate="visible">
      {sources.map((source, index) => (
        <motion.a
          key={index}
          href={source.url || '#'}
          target={source.url ? '_blank' : undefined}
          rel={source.url ? 'noopener noreferrer' : undefined}
          variants={itemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="shrink-0 w-64 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-4 hover:border-teal-500/40 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Newspaper className="w-3.5 h-3.5 text-teal-400/60" />
              <span className="text-[10px] font-mono tracking-widest text-teal-400/60 uppercase truncate">
                {source.source || 'Market News'}
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-teal-400 transition-colors opacity-0 group-hover:opacity-100" />
          </div>
          <h4 className="text-xs font-semibold text-white mb-2 line-clamp-2 group-hover:text-teal-300 transition-colors">
            {source.headline}
          </h4>
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            {source.summary}
          </p>
        </motion.a>
      ))}
    </motion.div>
  );
}

export default memo(SourceCards);
