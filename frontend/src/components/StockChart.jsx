// frontend/src/components/StockChart.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const StockChart = ({ ticker = "AAPL" }) => {
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Define the fetch function
    const fetchLiveStockData = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) setLoading(true); // Only show the loading screen the first time
        
        const response = await axios.get(`http://localhost:3000/api/v1/stock/${ticker}`);
        
        setChartData(response.data.chartData);
        setCurrentPrice(response.data.currentPrice);
      } catch (error) {
        console.error("Failed to fetch live stock data", error);
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    };

    // 2. Fetch immediately on mount
    fetchLiveStockData(true);

    // 3. Set up the Polling (Fetch every 15 seconds)
    const intervalId = setInterval(() => {
      fetchLiveStockData(false); // false means we don't show the full-screen loading pulse
    }, 15000); // 15000 milliseconds = 15 seconds

    // 4. Cleanup: Stop polling if the user navigates away or changes the ticker
    return () => clearInterval(intervalId);
    
  }, [ticker]);

  if (loading) {
    return (
      <div className="h-[600px] w-full bg-surface border border-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-primary animate-pulse tracking-widest">CONNECTING TO LIVE MARKET DATA...</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full bg-surface border border-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
      
      {/* Header Info */}
      <div className="p-6 border-b border-gray-800 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-wider text-white">{ticker}</h2>
          <p className="text-gray-400 text-sm tracking-widest uppercase mt-1">30-Day Realized Trend</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-400">
            ${currentPrice ? currentPrice.toFixed(2) : '---'}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-xs text-green-500 uppercase tracking-wider">Live Market</p>
          </div>
        </div>
      </div>

      {/* The Recharts Visualization */}
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#666" 
              tick={{fill: '#666', fontSize: 12}} 
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis 
              domain={['auto', 'auto']} // Automatically scale based on real data
              stroke="#666" 
              tick={{fill: '#666', fontSize: 12}}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val.toFixed(0)}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              labelStyle={{ color: '#aaa', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default StockChart;