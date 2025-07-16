import { CandleData, BollingerBands, SignalData } from '../types/crypto';

/**
 * Calculate Simple Moving Average for the given period
 */
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }
    
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  
  return sma;
}

/**
 * Calculate Standard Deviation for the given period
 */
function calculateStandardDeviation(prices: number[], sma: number[], period: number, index: number): number {
  if (index < period - 1 || isNaN(sma[index])) {
    return NaN;
  }
  
  const slice = prices.slice(index - period + 1, index + 1);
  const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma[index], 2), 0) / period;
  
  return Math.sqrt(variance);
}

/**
 * Calculate Bollinger Bands for price data
 * @param data Array of candle data
 * @param period Period for moving average (default: 20)
 * @param multiplier Standard deviation multiplier (default: 2)
 */
export function calculateBollingerBands(
  data: CandleData[], 
  period: number = 20, 
  multiplier: number = 2
): BollingerBands[] {
  const closes = data.map(candle => candle.close);
  const sma = calculateSMA(closes, period);
  
  return data.map((_, index) => {
    const middle = sma[index];
    
    if (isNaN(middle)) {
      return {
        upper: NaN,
        middle: NaN,
        lower: NaN
      };
    }
    
    const stdDev = calculateStandardDeviation(closes, sma, period, index);
    const upper = middle + (stdDev * multiplier);
    const lower = middle - (stdDev * multiplier);
    
    return {
      upper,
      middle,
      lower
    };
  });
}

/**
 * Calculate signal based on current price and Bollinger Bands
 * @param currentPrice Current price
 * @param bollinger Bollinger Bands data
 */
export function calculateSignal(currentPrice: number, bollinger: BollingerBands): SignalData {
  const { upper, middle, lower } = bollinger;
  
  if (isNaN(upper) || isNaN(middle) || isNaN(lower)) {
    return {
      bandPosition: 0,
      signal: 'LOADING...',
      signalType: 'NEUTRAL',
      percentage: 0
    };
  }
  
  // Calculate band position: ((price - mid) / (upper - lower)) × 200 - 100
  // This gives us -100 at lower band, 0 at middle, +100 at upper band
  const bandWidth = upper - lower;
  const bandPosition = ((currentPrice - middle) / bandWidth) * 200 - 100;
  
  let signal: string;
  let signalType: 'BUY' | 'SELL' | 'NEUTRAL';
  let percentage: number;
  
  if (bandPosition <= -100) {
    signal = 'BUY 100%';
    signalType = 'BUY';
    percentage = 100;
  } else if (bandPosition >= 100) {
    signal = 'SELL 100%';
    signalType = 'SELL';
    percentage = 100;
  } else if (bandPosition < 0) {
    percentage = Math.abs(bandPosition);
    signal = `BUY ${percentage.toFixed(0)}%`;
    signalType = 'BUY';
  } else if (bandPosition > 0) {
    percentage = bandPosition;
    signal = `SELL ${percentage.toFixed(0)}%`;
    signalType = 'SELL';
  } else {
    signal = 'NEUTRAL';
    signalType = 'NEUTRAL';
    percentage = 0;
  }
  
  return {
    bandPosition,
    signal,
    signalType,
    percentage: Math.min(100, Math.max(0, percentage))
  };
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number): string {
  if (price > 1000) {
    return price.toFixed(2);
  } else if (price > 1) {
    return price.toFixed(4);
  } else {
    return price.toFixed(6);
  }
}

/**
 * Get signal color based on signal type
 */
export function getSignalColor(signalType: 'BUY' | 'SELL' | 'NEUTRAL'): string {
  switch (signalType) {
    case 'BUY':
      return 'var(--buy-color)';
    case 'SELL':
      return 'var(--sell-color)';
    default:
      return 'var(--neutral-color)';
  }
}