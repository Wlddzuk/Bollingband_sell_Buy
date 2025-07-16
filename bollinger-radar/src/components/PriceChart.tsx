import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MarketData } from '../types/crypto';
import { formatPrice } from '../utils/bollinger';

interface PriceChartProps {
  data: MarketData[];
  currentPrice: number;
}

export function PriceChart({ data, currentPrice }: PriceChartProps) {
  // Get last 50 data points for display
  const chartData = data.slice(-50).map(item => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString(),
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Loading chart data...
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatPrice(value)}
          />
          
          {/* Bollinger Bands */}
          <Line
            type="monotone"
            dataKey="bollinger.upper"
            stroke="var(--sell-color)"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
          />
          <Line
            type="monotone"
            dataKey="bollinger.middle"
            stroke="var(--neutral-color)"
            strokeWidth={1}
            dot={false}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="bollinger.lower"
            stroke="var(--buy-color)"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
          />
          
          {/* Price line */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
          />
          
          {/* Current price reference line */}
          <ReferenceLine 
            y={currentPrice} 
            stroke="var(--foreground)" 
            strokeDasharray="2 2" 
            strokeWidth={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}