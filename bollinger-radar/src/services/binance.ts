import { CandleData, BinanceKlineData, TimeframeValue } from '../types/crypto';

const BINANCE_BASE_URL = 'https://api.binance.com';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

/**
 * Fetch historical kline data from Binance REST API
 */
export async function fetchHistoricalData(
  symbol: string, 
  interval: TimeframeValue, 
  limit: number = 300
): Promise<CandleData[]> {
  try {
    const url = `${BINANCE_BASE_URL}/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.map((kline: any[]) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5])
    }));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
}

/**
 * Create WebSocket connection for real-time data
 * Now processes all candle updates, not just closed candles
 */
export function createWebSocketConnection(
  symbol: string,
  interval: TimeframeValue,
  onMessage: (candleData: CandleData, isClosed: boolean) => void,
  onError?: (error: Event) => void
): WebSocket {
  const wsUrl = `${BINANCE_WS_URL}/${symbol.toLowerCase()}@kline_${interval}`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log(`WebSocket connected to ${symbol} ${interval}`);
  };

  ws.onmessage = (event) => {
    try {
      const data: BinanceKlineData = JSON.parse(event.data);

      // Process ALL kline updates for real-time price updates
      const candleData: CandleData = {
        timestamp: data.k.t,
        open: parseFloat(data.k.o),
        high: parseFloat(data.k.h),
        low: parseFloat(data.k.l),
        close: parseFloat(data.k.c),
        volume: parseFloat(data.k.v)
      };

      // Pass both the candle data and whether it's closed
      onMessage(candleData, data.k.x);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) {
      onError(error);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return ws;
}

/**
 * Create WebSocket connection for real-time ticker price updates
 * Provides faster updates than kline for current price
 */
export function createTickerWebSocket(
  symbol: string,
  onPriceUpdate: (price: number) => void,
  onError?: (error: Event) => void
): WebSocket {
  const wsUrl = `${BINANCE_WS_URL}/${symbol.toLowerCase()}@ticker`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log(`Ticker WebSocket connected for ${symbol}`);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.c); // 'c' is the last price
      onPriceUpdate(price);
    } catch (error) {
      console.error('Error parsing ticker message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('Ticker WebSocket error:', error);
    if (onError) {
      onError(error);
    }
  };

  ws.onclose = () => {
    console.log('Ticker WebSocket connection closed');
  };

  return ws;
}

/**
 * Get current price for a symbol
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    const url = `${BINANCE_BASE_URL}/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch current price: ${response.statusText}`);
    }

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching current price:', error);
    throw error;
  }
}

/**
 * Validate if a trading pair exists on Binance
 */
export async function validateSymbol(symbol: string): Promise<boolean> {
  try {
    const url = `${BINANCE_BASE_URL}/api/v3/exchangeInfo?symbol=${symbol.toUpperCase()}`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error('Error validating symbol:', error);
    return false;
  }
}