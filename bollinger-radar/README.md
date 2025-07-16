# Bollinger Band Radar 🎯

A modern, real-time cryptocurrency trading dashboard that provides **BUY/SELL signals** based on Bollinger Band analysis. Built with React, TypeScript, and the Binance WebSocket API.

## ✨ Features

- **Real-time Data**: Live price updates via Binance WebSocket
- **Visual Signals**: Large, clear BUY/SELL indicators with strength percentages
- **Price Targets**: Displays exact upper/lower band prices for buy/sell decisions
- **Interactive Chart**: Price history with Bollinger Bands overlay
- **Essential Timeframes**: 6 carefully selected intervals (15m, 1h, 4h, 1d, 1w, 1M)
- **Any Trading Pair**: Support for all Binance spot trading pairs
- **Modern UI**: Dark theme with smooth animations and responsive design
- **Connection Status**: Live indicator showing WebSocket connection health

## 🚀 How It Works

### Bollinger Bands Mathematics
- **Middle Band**: 20-period Simple Moving Average (SMA)
- **Upper Band**: Middle Band + (2 × Standard Deviation)
- **Lower Band**: Middle Band - (2 × Standard Deviation)

### Signal Calculation
```
Band Position = ((Current Price - Middle Band) / (Upper Band - Lower Band)) × 200 - 100
```

- **≤ -100**: **BUY 100%** (Price at or below lower band = oversold)
- **≥ +100**: **SELL 100%** (Price at or above upper band = overbought)
- **Between**: Proportional BUY/SELL percentage based on position

## 📊 Usage

1. **Enter Symbol**: Type any Binance trading pair (e.g., BTCUSDT, ETHUSDT, LINKUSDT)
2. **Select Timeframe**: Choose from 6 essential intervals (15 minutes to 1 month)
3. **Monitor Signals**: Watch for BUY/SELL percentages and exact price targets
4. **View Chart**: Analyze price movement relative to Bollinger Bands

### Essential Timeframes

- **Short-term (15m-1h)**: Best for scalping and day trading
- **Medium-term (4h-1d)**: Ideal for swing trading  
- **Long-term (1w-1M)**: Perfect for position and investment strategies

### Available Timeframes

**15m**: 15 Minutes - Intraday scalping  
**1h**: 1 Hour - Short-term trading  
**4h**: 4 Hours - Swing trading  
**1d**: 1 Day - Daily analysis  
**1w**: 1 Week - Weekly trends  
**1M**: 1 Month - Long-term investment

## 🛠️ Technical Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS V4 + ShadCN UI
- **Charts**: Recharts
- **Data Source**: Binance REST API + WebSocket
- **Real-time**: WebSocket connection with auto-reconnection

## 🔧 Installation & Setup

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## 📡 Data Sources

- **Historical Data**: Binance REST API (`/api/v3/klines`)
- **Real-time Updates**: Binance WebSocket (`wss://stream.binance.com:9443/ws`)
- **Price Data**: Up to 300 candles for Bollinger Band calculation

## ⚠️ Important Notes

- **Not Financial Advice**: This tool is for educational and analysis purposes only
- **Market Risk**: Cryptocurrency trading involves significant risk
- **Technical Analysis**: Bollinger Bands are one indicator among many
- **No API Keys**: Uses public Binance endpoints, no authentication required

## 🎨 Features Highlights

### Real-time Signal Display
- Large, animated signal text with color coding
- Progress bar showing band position (-100% to +100%)
- Signal strength indicators with glow effects
- Live price updates with gradient styling
- **Exact price targets**: Shows precise upper and lower band prices

### Interactive Controls
- Symbol input with validation
- 6 essential timeframe buttons for quick selection
- Connection status indicator
- Error handling with user-friendly messages

### Price Target System
- **Buy Target**: Shows exact lower Bollinger Band price
- **Sell Target**: Shows exact upper Bollinger Band price
- Updates automatically based on selected timeframe
- Helps traders set precise entry/exit points

### Live Chart
- Last 50 periods price history
- Bollinger Bands overlay (upper, middle, lower)
- Current price reference line
- Responsive design for all screen sizes

## 📈 Supported Trading Pairs

Any spot trading pair available on Binance, including:
- Major cryptocurrencies: BTC, ETH, ADA, DOT, LINK
- Stablecoins: USDT, USDC, BUSD
- Altcoins: MATIC, AVAX, SOL, UNI, AAVE
- Forex pairs: EURUSDT, GBPUSDT

## 🔄 Auto-reconnection

The dashboard automatically:
- Reconnects on WebSocket disconnection
- Retries failed API requests
- Shows connection status in real-time
- Handles network interruptions gracefully

---

**Built with ❤️ using modern web technologies for the crypto trading community.**