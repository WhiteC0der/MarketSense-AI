"use client";

import { Sparkles } from "lucide-react";
import SourceCards from "./SourceCards";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatMessages({ messages = [], isLoading = false }) {
  const messageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
  };

  const typingVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
      },
    },
  };

  const pulseVariants = {
    unknown: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
    },
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
      {messages.length === 0 ? (
        <motion.div
          className="h-full flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center">
            <motion.div
              className="w-12 h-12 rounded-full bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-3"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-zinc-950" />
            </motion.div>
            <p className="text-zinc-400 text-sm">Select a ticker and start asking questions about the market</p>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              {message.role === "user" ? (
                <motion.div
                  className="flex justify-end"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="max-w-[80%] bg-gradient-to-br from-teal-500/20 to-cyan-500/10 text-white px-4 py-3 rounded-2xl rounded-br-md border border-teal-500/20">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.sources && message.sources.length > 0 && (
                    <SourceCards sources={message.sources} />
                  )}
                  <div className="flex gap-3 max-w-[90%]">
                    <motion.div
                      className="shrink-0 w-7 h-7 rounded-full bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-4 h-4 text-zinc-950" />
                    </motion.div>
                    <div className="text-sm text-zinc-300 leading-relaxed prose prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2">{children}</p>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-teal-300">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-teal-300">{children}</h2>,
                          strong: ({ children }) => <strong className="font-semibold text-teal-300">{children}</strong>,
                          em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 ml-2">{children}</ul>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          a: ({ href, children }) => <a href={href} className="text-teal-400 hover:text-teal-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                          code: ({ children }) => <code className="bg-zinc-800/50 px-2 py-1 rounded text-xs font-mono text-teal-300">{children}</code>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Typing Indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="flex gap-3"
            variants={typingVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="shrink-0 w-7 h-7 rounded-full bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-zinc-950" />
            </motion.div>
            <div className="flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-teal-500 rounded-full"
                  animate={pulseVariants.unknown}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
