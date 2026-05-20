import { useState, useCallback, memo } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

function ChatInput({ onSendMessage, isLoading = false, disabled = false }) {
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading || disabled) return;
    const msg = message;
    setMessage('');
    await onSendMessage(msg);
  }, [message, isLoading, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md p-3 md:p-4 safe-bottom">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask MarketSense AI anything..."
            rows={1}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all resize-none min-h-11 md:min-h-12 max-h-32 disabled:opacity-50"
            disabled={isLoading || disabled}
          />
        </div>
        <button
          type="submit"
          className="p-2.5 md:p-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-full transition-all duration-200 disabled:opacity-40 disabled:hover:bg-teal-500 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
          disabled={!message.trim() || isLoading || disabled}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      </form>
    </div>
  );
}

export default memo(ChatInput);
