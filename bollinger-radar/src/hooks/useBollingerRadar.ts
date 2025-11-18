import { useState, useEffect, useCallback, useRef } from 'react';
import { CandleData, MarketData, SignalData, TimeframeValue } from '../types/crypto';
import { fetchHistoricalData, createWebSocketConnection, createTickerWebSocket, getCurrentPrice } from '../services/binance';
import { calculateBollingerBands, calculateSignal } from '../utils/bollinger';

interface UseBollingerRadarOptions {
  symbol: string;
  timeframe: TimeframeValue;
}

interface UseBollingerRadarReturn {
  marketData: MarketData[];
  currentPrice: number;
  signal: SignalData;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: number;
}

export function useBollingerRadar({ symbol, timeframe }: UseBollingerRadarOptions): UseBollingerRadarReturn {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [signal, setSignal] = useState<SignalData>({
    bandPosition: 0,
    signal: 'LOADING...',
    signalType: 'NEUTRAL',
    percentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const wsRef = useRef<WebSocket | null>(null);
  const tickerWsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate Bollinger Bands and signals
  const processData = useCallback((candleData: CandleData[]) => {
    const bollingerData = calculateBollingerBands(candleData);
    
    const processedData: MarketData[] = candleData.map((candle, index) => ({
      ...candle,
      bollinger: bollingerData[index]
    }));

    setMarketData(processedData);

    // Calculate signal for the latest data point
    const latestData = processedData[processedData.length - 1];
    if (latestData && !isNaN(latestData.bollinger.upper)) {
      const newSignal = calculateSignal(latestData.close, latestData.bollinger);
      setSignal(newSignal);
      setCurrentPrice(latestData.close);
    }
  }, []);

  // Handle real-time ticker price updates
  const handleTickerUpdate = useCallback((price: number) => {
    setCurrentPrice(price);
    setLastUpdate(Date.now());

    // Recalculate signal with new price but existing Bollinger Bands
    setMarketData(prevData => {
      if (prevData.length === 0) return prevData;

      const latestData = prevData[prevData.length - 1];
      if (latestData && !isNaN(latestData.bollinger.upper)) {
        const newSignal = calculateSignal(price, latestData.bollinger);
        setSignal(newSignal);
      }

      return prevData;
    });
  }, []);

  // Handle new WebSocket data (both real-time and closed candles)
  const handleNewCandle = useCallback((newCandle: CandleData, isClosed: boolean) => {
    setLastUpdate(Date.now());

    setMarketData(prevData => {
      // Convert to CandleData array for processing
      const candleDataArray = prevData.map(item => ({
        timestamp: item.timestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));

      const lastIndex = candleDataArray.length - 1;

      if (candleDataArray[lastIndex]?.timestamp === newCandle.timestamp) {
        // Update existing candle (intra-candle update)
        candleDataArray[lastIndex] = newCandle;
      } else if (isClosed) {
        // Add new closed candle
        candleDataArray.push(newCandle);
        // Keep only last 300 candles
        if (candleDataArray.length > 300) {
          candleDataArray.shift();
        }
      }

      // Recalculate Bollinger Bands for all data
      const bollingerData = calculateBollingerBands(candleDataArray);
      const processedData: MarketData[] = candleDataArray.map((candle, index) => ({
        ...candle,
        bollinger: bollingerData[index]
      }));

      // Update signal for latest data
      const latestData = processedData[processedData.length - 1];
      if (latestData && !isNaN(latestData.bollinger.upper)) {
        const newSignal = calculateSignal(latestData.close, latestData.bollinger);
        setSignal(newSignal);
        setCurrentPrice(latestData.close);
      }

      return processedData;
    });
  }, []);

  // Initialize data and WebSocket connections
  const initializeConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionStatus('connecting');

      // Close existing WebSockets if any
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (tickerWsRef.current) {
        tickerWsRef.current.close();
        tickerWsRef.current = null;
      }

      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Fetch historical data
      const historicalData = await fetchHistoricalData(symbol, timeframe);
      processData(historicalData);

      // Get current price
      const price = await getCurrentPrice(symbol);
      setCurrentPrice(price);
      setLastUpdate(Date.now());

      // Create kline WebSocket connection (for candle updates)
      const ws = createWebSocketConnection(
        symbol,
        timeframe,
        handleNewCandle,
        () => {
          setConnectionStatus('error');
          // Retry connection after 5 seconds
          retryTimeoutRef.current = setTimeout(() => {
            initializeConnection();
          }, 5000);
        }
      );

      ws.onopen = () => {
        setConnectionStatus('connected');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
      };

      wsRef.current = ws;

      // Create ticker WebSocket connection (for real-time price updates)
      const tickerWs = createTickerWebSocket(
        symbol,
        handleTickerUpdate,
        (error) => {
          console.error('Ticker WebSocket error:', error);
          // Don't retry ticker separately, main retry will handle both
        }
      );

      tickerWsRef.current = tickerWs;
      setIsLoading(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setConnectionStatus('error');
      setIsLoading(false);

      // Retry connection after 5 seconds on error
      retryTimeoutRef.current = setTimeout(() => {
        initializeConnection();
      }, 5000);
    }
  }, [symbol, timeframe, processData, handleNewCandle, handleTickerUpdate]);

  // Initialize connection when symbol or timeframe changes
  useEffect(() => {
    initializeConnection();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (tickerWsRef.current) {
        tickerWsRef.current.close();
        tickerWsRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [initializeConnection]);

  return {
    marketData,
    currentPrice,
    signal,
    isLoading,
    error,
    connectionStatus,
    lastUpdate
  };
}