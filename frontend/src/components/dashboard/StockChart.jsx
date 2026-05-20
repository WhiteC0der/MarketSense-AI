import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { stockAPI } from '@/lib/api';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900/95 backdrop-blur-md border border-teal-500/40 rounded-lg px-3 md:px-4 py-2 md:py-3 shadow-xl">
        <p className="text-xs md:text-sm text-teal-400 font-semibold">{data.date}</p>
        <p className="text-base md:text-lg font-bold text-teal-300 mt-1">
          price: {data.price.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const FALLBACK_DATA = [
  { date: 'Feb 27', price: 248.5 }, { date: 'Feb 28', price: 249.2 },
  { date: 'Mar 1', price: 248.8 }, { date: 'Mar 2', price: 250.1 },
  { date: 'Mar 3', price: 251.3 }, { date: 'Mar 4', price: 250.8 },
  { date: 'Mar 5', price: 251.9 }, { date: 'Mar 6', price: 252.4 },
  { date: 'Mar 9', price: 251.7 }, { date: 'Mar 10', price: 253.2 },
  { date: 'Mar 11', price: 252.8 }, { date: 'Mar 12', price: 254.1 },
  { date: 'Mar 13', price: 253.5 }, { date: 'Mar 16', price: 248.8 },
];

function parseChartResponse(data) {
  let chartArray = [];
  let price = null;
  if (data && typeof data === 'object') {
    const arr = data.chartData || data;
    if (Array.isArray(arr) && arr.length > 0) {
      chartArray = arr
        .filter((item) => item.date !== 'Live')
        .map((item) => ({ date: item.date || 'N/A', price: Number(item.price) || 0 }));
      price = data.currentPrice || null;
      if (!price && arr.length > 0) {
        const liveEntry = arr.find((d) => d.date === 'Live');
        price = liveEntry ? liveEntry.price : arr[arr.length - 1].price;
      }
    }
  }
  return { chartArray, price };
}

export default function StockChart({ isVisible, chartData: externalChartData, ticker = 'AAPL', isMobile = false }) {
  const [displayData, setDisplayData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const data = await stockAPI.getChart(ticker);
        if (!mounted) return;
        const { chartArray, price } = parseChartResponse(data);
        setDisplayData(chartArray);
        setCurrentPrice(price);
      } catch {
        if (mounted) { setDisplayData([]); setCurrentPrice(null); }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchChartData();
    return () => { mounted = false; };
  }, [ticker]);

  useEffect(() => {
    if (!externalChartData || displayData.length > 0) return;
    const { chartArray, price } = parseChartResponse(externalChartData);
    if (chartArray.length > 0) { setDisplayData(chartArray); setCurrentPrice(price); }
  }, [externalChartData, displayData.length]);

  const chartToDisplay = displayData.length > 0 ? displayData : FALLBACK_DATA;

  // Responsive chart margins
  const chartMargins = isMobile
    ? { top: 5, right: 15, left: 30, bottom: 5 }
    : { top: 5, right: 30, left: 50, bottom: 5 };

  return (
    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isVisible ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800 p-3 md:p-4 space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">{ticker}</span>
          {loading && <span className="text-[10px] text-zinc-500 animate-pulse">Updating...</span>}
        </div>
        <div className="relative h-40 md:h-52 bg-zinc-900/40 rounded-lg border border-zinc-800/50 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart key={`${ticker}-${chartToDisplay.length}`} data={chartToDisplay} margin={chartMargins}>
              <defs>
                <linearGradient id={`colorPrice-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: isMobile ? 9 : 10 }}
                interval={isMobile ? 'preserveStartEnd' : 0}
              />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: isMobile ? 9 : 10 }}
                tickFormatter={(v) => `$${v}`}
                width={isMobile ? 40 : 50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }} />
              <Area type="monotone" dataKey="price" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill={`url(#colorPrice-${ticker})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
