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
 */
export function createWebSocketConnection(
  symbol: string,
  interval: TimeframeValue,
  onMessage: (candleData: CandleData) => void,
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
      
      // Only process closed klines for historical data consistency
      if (data.k.x) {
        const candleData: CandleData = {
          timestamp: data.k.t,
          open: parseFloat(data.k.o),
          high: parseFloat(data.k.h),
          low: parseFloat(data.k.l),
          close: parseFloat(data.k.c),
          volume: parseFloat(data.k.v)
        };
        
        onMessage(candleData);
      }
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