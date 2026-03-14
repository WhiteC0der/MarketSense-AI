import React from 'react';

export default function NewsCard({ article }) {
  return (
    <a 
      href={article.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="min-w-62.5 max-w-75 bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-green-400 transition-colors cursor-pointer shrink-0"
    >
      <div className="text-xs text-green-400 mb-2 font-bold uppercase tracking-wider">
        Source Link
      </div>
      <h4 className="text-sm text-white font-semibold mb-2 line-clamp-2">
        {article.headline}
      </h4>
      <p className="text-xs text-gray-400 line-clamp-3">
        {article.summary}
      </p>
    </a>
  );
}