import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { MarketData } from '../types/crypto';
import { formatPrice } from '../utils/bollinger';

interface PriceChartProps {
  data: MarketData[];
  currentPrice: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2">{data.time}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Price:</span>
          <span className="font-mono font-bold">${formatPrice(data.close)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Volume:</span>
          <span className="font-mono">{data.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="h-px bg-border my-1" />
        <div className="flex justify-between gap-4">
          <span className="text-red-400">Upper:</span>
          <span className="font-mono text-xs">${formatPrice(data.bollinger?.upper)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-400">Middle:</span>
          <span className="font-mono text-xs">${formatPrice(data.bollinger?.middle)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-green-400">Lower:</span>
          <span className="font-mono text-xs">${formatPrice(data.bollinger?.lower)}</span>
        </div>
      </div>
    </div>
  );
};

export function PriceChart({ data, currentPrice }: PriceChartProps) {
  // Get last 50 data points for display
  const chartData = data.slice(-50).map(item => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString(),
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        Loading chart data...
      </div>
    );
  }

  // Calculate max volume for scaling
  const maxVolume = Math.max(...chartData.map(d => d.volume));

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />

          {/* Price Y-Axis (left) */}
          <YAxis
            yAxisId="price"
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatPrice(value)}
          />

          {/* Volume Y-Axis (right) */}
          <YAxis
            yAxisId="volume"
            orientation="right"
            domain={[0, maxVolume * 4]}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value.toFixed(0);
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Volume bars */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="var(--primary)"
            opacity={0.2}
            radius={[2, 2, 0, 0]}
          />

          {/* Bollinger Bands */}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="bollinger.upper"
            stroke="var(--sell-color)"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
            name="Upper Band"
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="bollinger.middle"
            stroke="var(--neutral-color)"
            strokeWidth={1}
            dot={false}
            strokeDasharray="5 5"
            name="Middle Band"
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="bollinger.lower"
            stroke="var(--buy-color)"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
            name="Lower Band"
          />

          {/* Price line */}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            name="Price"
          />

          {/* Current price reference line */}
          <ReferenceLine
            yAxisId="price"
            y={currentPrice}
            stroke="var(--foreground)"
            strokeDasharray="2 2"
            strokeWidth={1}
            label={{
              value: `$${formatPrice(currentPrice)}`,
              position: 'right',
              fill: 'var(--foreground)',
              fontSize: 10
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}