// frontend/src/components/ChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import NewsCard from './NewsCard'; // Make sure this file exists!

const ChatInterface = ({ currentTicker, chatId, onChatCreated }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // Auto-scroll anchor
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Load History or Start Fresh
  useEffect(() => {
    if (chatId) {
      loadSpecificChat();
    } else {
      setMessages([
        { 
          role: 'ai', 
          content: `System online, whitecoder. I am MarketSense AI. What financial data would you like me to analyze for ${currentTicker} today?`,
        }
      ]);
    }
  }, [chatId, currentTicker]);

  const loadSpecificChat = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/v1/chat/${chatId}`);
      // Mongoose saves the text as "content", so we map correctly
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error("Failed to load chat", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Instantly show the user's question in the chat
    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      // Ping the Node.js backend, passing the chatId if we are in an old chat
      const response = await axios.post('http://localhost:3000/api/v1/chat', { 
        question: userMsg.content,
        ticker: currentTicker,
        chatId: chatId 
      });
      
      // Tell App.jsx to refresh the sidebar if a new chat was just created!
      if (!chatId && response.data.chatId) {
        onChatCreated();
      }

      // Inject the System News Cards if the AI read from the database
      if (response.data.sources && response.data.sources.length > 0) {
        setMessages((prev) => [...prev, { 
          role: 'system', 
          content: `Analyzed ${response.data.sources.length} recent articles for ${currentTicker}`,
          sources: response.data.sources 
        }]);
      }

      // Update the chat with the AI's answer
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: response.data.answer 
      }]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'Error connecting to the intelligence core. Is the Node server running?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface border border-gray-800 rounded-lg shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold tracking-wider text-primary">MARKETSENSE TERMINAL</h2>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* The standard User/AI Message Bubble */}
            {msg.role !== 'system' && (
              <div className={`max-w-[80%] p-4 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            )}

            {/* The System Bubble: Render News Cards Horizontally! */}
            {msg.role === 'system' && msg.sources && (
               <div className="w-full my-4 p-4 bg-black rounded-lg border border-gray-800 shadow-inner">
                 <p className="text-xs text-gray-400 mb-3 flex items-center font-mono uppercase tracking-wider">
                   <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                   {msg.content}
                 </p>
                 <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                   {msg.sources.map((article, i) => (
                     <NewsCard key={i} article={article} />
                   ))}
                 </div>
               </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-gray-800 p-4 rounded-lg rounded-bl-none border border-gray-700">
              <p className="text-sm text-gray-400 animate-pulse font-mono tracking-widest uppercase text-xs">
                Analyzing vector database...
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Query the database for ${currentTicker}...`}
            className="flex-1 bg-black text-white p-3 rounded border border-gray-700 focus:outline-none focus:border-primary transition-colors text-sm"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !question.trim()}
            className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded font-bold transition-colors disabled:opacity-50 tracking-wider"
          >
            SEND
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatInterface;