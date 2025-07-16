import { useState, useEffect, useCallback, useRef } from 'react';
import { CandleData, MarketData, SignalData, TimeframeValue } from '../types/crypto';
import { fetchHistoricalData, createWebSocketConnection, getCurrentPrice } from '../services/binance';
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
  
  const wsRef = useRef<WebSocket | null>(null);
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

  // Handle new WebSocket data
  const handleNewCandle = useCallback((newCandle: CandleData) => {
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
        candleDataArray[lastIndex] = newCandle;
      } else {
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

  // Initialize data and WebSocket connection
  const initializeConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionStatus('connecting');

      // Close existing WebSocket if any
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
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

      // Create WebSocket connection
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
  }, [symbol, timeframe, processData, handleNewCandle]);

  // Initialize connection when symbol or timeframe changes
  useEffect(() => {
    initializeConnection();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
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
    connectionStatus
  };
}