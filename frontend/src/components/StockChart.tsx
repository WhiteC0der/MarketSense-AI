import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { stockAPI } from "@/lib/api";

interface StockChartProps {
  ticker: string;
}

interface ChartPoint {
  date: string;
  price: number;
}

export function StockChart({ ticker }: StockChartProps) {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await stockAPI.getChart(ticker || "AAPL");
        if (!mounted) return;
        setChartData(data.chartData || []);
      } catch {
        if (!mounted) return;
        setChartData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [ticker]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 280 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="overflow-hidden border-b border-border/30"
    >
      <div className="px-6 py-4">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs font-mono tracking-wider text-muted-foreground">{ticker || "AAPL"}</span>
          <span className="text-[10px] text-muted-foreground/50">30D</span>
        </div>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground/60">Loading chart...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 12%)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(215, 20%, 45%)" }}
              axisLine={{ stroke: "hsl(217, 33%, 12%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(215, 20%, 45%)" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(222, 47%, 7%)",
                border: "1px solid hsl(217, 33%, 17%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210, 40%, 96%)",
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(160, 84%, 39%)"
              strokeWidth={2}
              fill="url(#chartGradient)"
            />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
