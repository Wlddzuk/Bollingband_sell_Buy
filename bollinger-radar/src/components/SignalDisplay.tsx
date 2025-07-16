import { SignalData, BollingerBands } from '../types/crypto';
import { Progress } from '@/components/ui/progress';
import { getSignalColor, formatPrice } from '../utils/bollinger';

interface SignalDisplayProps {
  signal: SignalData;
  currentPrice: number;
  symbol: string;
  bollinger: BollingerBands;
}

export function SignalDisplay({ signal, currentPrice, symbol, bollinger }: SignalDisplayProps) {
  const getProgressValue = () => {
    // Convert band position (-100 to +100) to progress value (0 to 100)
    return ((signal.bandPosition + 100) / 2);
  };

  const getProgressColor = () => {
    if (signal.signalType === 'BUY') {
      return 'var(--buy-color)';
    } else if (signal.signalType === 'SELL') {
      return 'var(--sell-color)';
    }
    return 'var(--neutral-color)';
  };

  return (
    <div className="text-center space-y-6">
      {/* Symbol and Price */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-muted-foreground">
          {symbol.toUpperCase()}
        </h2>
        <div className="text-3xl font-mono bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          ${currentPrice.toFixed(4)}
        </div>
      </div>

      {/* Main Signal */}
      <div className="space-y-4">
        <div 
          className="text-6xl md:text-7xl font-bold tracking-tight transition-all duration-500 ease-out"
          style={{ 
            color: getSignalColor(signal.signalType),
            textShadow: `0 0 20px ${getSignalColor(signal.signalType)}30`
          }}
        >
          {signal.signal}
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>BUY</span>
            <span>NEUTRAL</span>
            <span>SELL</span>
          </div>
          <div className="relative">
            <Progress 
              value={getProgressValue()} 
              className="h-4 bg-muted"
            />
            <div 
              className="absolute top-0 left-0 h-4 rounded-full transition-all duration-500"
              style={{
                width: `${getProgressValue()}%`,
                backgroundColor: getProgressColor(),
              }}
            />
          </div>
          <div className="text-xs text-center text-muted-foreground">
            Band Position: {signal.bandPosition.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Price Targets */}
      {!isNaN(bollinger.upper) && !isNaN(bollinger.lower) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className={`space-y-1 p-3 border rounded-lg transition-all duration-300 ${
            signal.signalType === 'BUY' 
              ? 'bg-green-500/20 border-green-500/40 shadow-lg shadow-green-500/20' 
              : 'bg-green-500/10 border-green-500/20'
          }`}>
            <div className="text-green-400 font-medium flex items-center gap-2">
              Buy Target
              {signal.signalType === 'BUY' && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            </div>
            <div className="font-mono text-lg">
              ${formatPrice(bollinger.lower)}
            </div>
            <div className="text-xs text-muted-foreground">
              Lower Bollinger Band
            </div>
          </div>
          
          <div className={`space-y-1 p-3 border rounded-lg transition-all duration-300 ${
            signal.signalType === 'SELL' 
              ? 'bg-red-500/20 border-red-500/40 shadow-lg shadow-red-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="text-red-400 font-medium flex items-center gap-2">
              Sell Target
              {signal.signalType === 'SELL' && <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />}
            </div>
            <div className="font-mono text-lg">
              ${formatPrice(bollinger.upper)}
            </div>
            <div className="text-xs text-muted-foreground">
              Upper Bollinger Band
            </div>
          </div>
        </div>
      )}

      {/* Signal Strength Indicator */}
      <div className="flex items-center justify-center space-x-2">
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => {
            const threshold = (i + 1) * 20;
            const isActive = signal.percentage >= threshold;
            return (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'opacity-100 pulse-glow' 
                    : 'opacity-20'
                }`}
                style={{
                  backgroundColor: isActive ? getSignalColor(signal.signalType) : 'var(--muted-foreground)',
                  boxShadow: isActive ? `0 0 10px ${getSignalColor(signal.signalType)}50` : 'none'
                }}
              />
            );
          })}
        </div>
        <span className="text-sm text-muted-foreground ml-2">
          {signal.percentage.toFixed(0)}% strength
        </span>
      </div>
    </div>
  );
}