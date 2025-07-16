import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

import { TIMEFRAMES, TimeframeValue } from './types/crypto';
import { useBollingerRadar } from './hooks/useBollingerRadar';
import { SignalDisplay } from './components/SignalDisplay';
import { PriceChart } from './components/PriceChart';

export default function App() {
  const [symbol, setSymbol] = useState('LINKUSDT');
  const [timeframe, setTimeframe] = useState<TimeframeValue>('4h');
  
  const {
    marketData,
    currentPrice,
    signal,
    isLoading,
    error,
    connectionStatus
  } = useBollingerRadar({ symbol, timeframe });

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
            <Wifi className="w-3 h-3 mr-1" />
            Live
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Connecting
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="outline">
            <WifiOff className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <WifiOff className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Bollinger Band Radar
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time crypto trading signals
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {getConnectionStatusBadge()}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Trading Pair & Timeframe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="LINKUSDT"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter any Binance trading pair (e.g., BTCUSDT, ETHUSDT)
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Timeframe</label>
                
                {/* Quick Select Buttons */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setTimeframe(tf.value as TimeframeValue)}
                      className={`px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                        timeframe === tf.value
                          ? 'bg-primary text-primary-foreground shadow-md scale-105'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground hover:scale-102'
                      }`}
                    >
                      {tf.value.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Higher timeframes provide more reliable signals but slower updates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-destructive/50">
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Make sure the symbol exists on Binance and try again.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Signal Display */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground">Loading market data...</p>
                    </div>
                  </div>
                ) : (
                  <SignalDisplay
                    signal={signal}
                    currentPrice={currentPrice}
                    symbol={symbol}
                    bollinger={marketData.length > 0 ? marketData[marketData.length - 1].bollinger : { upper: 0, middle: 0, lower: 0 }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Price Chart (Last 50 periods)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <PriceChart data={marketData} currentPrice={currentPrice} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-1 bg-green-500 rounded"></div>
                    <span className="font-medium">Lower Band</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Oversold = BUY signal</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-1 bg-neutral-500 rounded"></div>
                    <span className="font-medium">Middle Band</span>
                  </div>
                  <p className="text-xs text-muted-foreground">20-period SMA</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-1 bg-red-500 rounded"></div>
                    <span className="font-medium">Upper Band</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Overbought = SELL signal</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-3 border-t border-border/50">
                <div className="space-y-1">
                  <span className="font-medium text-blue-400">Short-term (15m-1h)</span>
                  <p className="text-muted-foreground">Scalping & day trading</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-400">Medium-term (4h-1d)</span>
                  <p className="text-muted-foreground">Swing trading</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-purple-400">Long-term (1w-1M)</span>
                  <p className="text-muted-foreground">Position & investment</p>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                Data by Binance WebSocket API • Uses 20-period SMA ± 2σ • Price targets update per timeframe • Not financial advice
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
