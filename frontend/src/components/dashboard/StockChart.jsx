import { useState, useEffect, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { stockAPI } from '@/lib/api';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900/95 backdrop-blur-md border border-teal-500/40 rounded-lg px-3 md:px-4 py-2 md:py-3 shadow-xl">
        <p className="text-xs md:text-sm text-teal-400 font-semibold">{data.fullLabel || data.label}</p>
        <p className="text-base md:text-lg font-bold text-teal-300 mt-1">
          ${data.price.toFixed(2)}
        </p>
        {data.isLive && (
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
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

/**
 * Compute which indices should show an X-axis label.
 * Shows ~maxLabels evenly spaced ticks across the data,
 * always including first, last, and the boundary between historical & live.
 */
function computeVisibleTicks(data, maxLabels = 8) {
  const len = data.length;
  if (len <= maxLabels) return new Set(data.map((_, i) => i));

  const visible = new Set();
  visible.add(0);
  visible.add(len - 1);

  // Find boundary between historical and live
  const firstLiveIdx = data.findIndex((d) => d.isLive);
  if (firstLiveIdx > 0) {
    visible.add(firstLiveIdx - 1); // last historical
    visible.add(firstLiveIdx);     // first live
  }

  // Fill remaining slots evenly from historical portion
  const historicalEnd = firstLiveIdx > 0 ? firstLiveIdx : len;
  const slotsLeft = maxLabels - visible.size;
  if (slotsLeft > 0 && historicalEnd > 2) {
    const step = Math.max(1, Math.floor(historicalEnd / (slotsLeft + 1)));
    for (let i = step; i < historicalEnd; i += step) {
      visible.add(i);
    }
  }

  return visible;
}

export default function StockChart({ isVisible, chartData: externalChartData, ticker = 'AAPL', isMobile = false, liveTicks = [], livePrice = null }) {
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

  // Merge historical data with live ticks — only keep latest live point
  const chartToDisplay = useMemo(() => {
    const base = displayData.length > 0 ? displayData : FALLBACK_DATA;

    // Normalize historical data with clean labels
    const historical = base.map((d) => ({
      label: d.date,
      fullLabel: d.date,
      price: d.price,
      isLive: false,
    }));

    if (liveTicks.length === 0 && livePrice !== null) {
      // Single live price point — just show "Now"
      return [...historical, { label: 'Now', fullLabel: 'Live', price: livePrice, isLive: true }];
    }

    if (liveTicks.length > 0) {
      // Only append the LATEST live tick to keep the chart clean
      const latest = liveTicks[liveTicks.length - 1];
      // Short time label for X-axis, full for tooltip
      const shortTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return [...historical, {
        label: shortTime,
        fullLabel: latest.time,
        price: latest.price,
        isLive: true,
      }];
    }

    return historical;
  }, [displayData, liveTicks, livePrice]);

  // Get the last live point for the pulsing dot
  const lastLivePoint = useMemo(() => {
    const lastPoint = chartToDisplay[chartToDisplay.length - 1];
    return lastPoint?.isLive ? lastPoint : null;
  }, [chartToDisplay]);

  // Compute which X-axis ticks to show
  const maxLabels = isMobile ? 5 : 8;
  const visibleTicks = useMemo(
    () => computeVisibleTicks(chartToDisplay, maxLabels),
    [chartToDisplay, maxLabels]
  );

  // Custom tick renderer — only renders labels at visible indices
  const renderTick = useCallback(({ x, y, index, payload }) => {
    if (!visibleTicks.has(index)) return null;
    const item = chartToDisplay[index];
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0} y={0} dy={14}
          textAnchor="middle"
          fill={item?.isLive ? '#10b981' : '#71717a'}
          fontSize={isMobile ? 9 : 10}
          fontWeight={item?.isLive ? 600 : 400}
        >
          {payload.value}
        </text>
      </g>
    );
  }, [visibleTicks, chartToDisplay, isMobile]);

  // Responsive chart margins
  const chartMargins = isMobile
    ? { top: 5, right: 15, left: 30, bottom: 5 }
    : { top: 10, right: 30, left: 50, bottom: 5 };

  const hasLiveData = liveTicks.length > 0 || livePrice !== null;

  return (
    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isVisible ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800 p-3 md:p-4 space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">{ticker}</span>
            {hasLiveData && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
              </span>
            )}
          </div>
          {loading && <span className="text-[10px] text-zinc-500 animate-pulse">Updating...</span>}
        </div>
        <div className="relative h-40 md:h-52 bg-zinc-900/40 rounded-lg border border-zinc-800/50 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart key={ticker} data={chartToDisplay} margin={chartMargins}>
              <defs>
                <linearGradient id={`colorPrice-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={renderTick}
                interval={0}
                height={30}
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
              <Area type="monotone" dataKey="price" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill={`url(#colorPrice-${ticker})`} isAnimationActive={false} />
              {/* Pulsing dot on the last live data point */}
              {lastLivePoint && (
                <ReferenceDot
                  x={lastLivePoint.label}
                  y={lastLivePoint.price}
                  r={5}
                  fill="#10b981"
                  stroke="#10b981"
                  strokeWidth={2}
                  className="animate-pulse"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
