// frontend/src/components/ChatInterface.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ChatInterface = ({ currentTicker }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Initialize chat history with a greeting
  const [chatHistory, setChatHistory] = useState([
    { 
      role: 'ai', 
      text: 'System online, whitecoder. I am MarketSense AI. What financial data would you like me to analyze today?',
      sources: [] 
    }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    // 1. Instantly show the user's question in the chat
    const newHistory = [...chatHistory, { role: 'user', text: question }];
    setChatHistory(newHistory);
    setQuestion('');
    setIsLoading(true);

    try {
      // 2. Ping your Node.js backend
     const response = await axios.post('http://localhost:3000/api/v1/chat', { 
    question: question,
    ticker: currentTicker 
});
      
      // 3. Update the chat with the AI's answer AND the sources
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: response.data.answer,
        sources: response.data.sources 
      }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: 'Error connecting to the intelligence core. Is the Node server running?',
        sources: [] 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto bg-surface border border-gray-800 rounded-lg shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold tracking-wider text-primary">MARKETSENSE TERMINAL</h2>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* The Message Bubble */}
            <div className={`max-w-[80%] p-4 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
            </div>

            {/* The RAG Citations (Only show if the AI returned sources) */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 w-[80%] bg-black p-3 rounded border border-gray-800">
                <p className="text-xs text-gray-500 font-bold mb-2 uppercase">Sources Analyzed:</p>
                <ul className="space-y-2">
                  {msg.sources.map((source, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start">
                      <span className="text-primary mr-2">[{i + 1}]</span>
                      <span className="line-clamp-1">{source.headline}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-gray-800 p-4 rounded-lg rounded-bl-none border border-gray-700">
              <p className="text-sm text-gray-400 animate-pulse">Analyzing vector database...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Query the database..."
            className="flex-1 bg-black text-white p-3 rounded border border-gray-700 focus:outline-none focus:border-primary transition-colors"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !question.trim()}
            className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded font-bold transition-colors disabled:opacity-50"
          >
            SEND
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatInterface;