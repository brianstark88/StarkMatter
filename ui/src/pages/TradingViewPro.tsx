import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Activity,
  Plus,
  Search,
  Settings,
  Maximize2,
  Grid3X3,
  LineChart,
  CandlestickChart,
  BarChart3,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ZoomIn,
  ZoomOut,
  Move,
  Crosshair,
  TrendingUpDown,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketAPI, paperTradingAPI } from '../lib/api';
import { formatCurrency, formatPercentage, formatNumber, formatVolume } from '../lib/utils';
import { useQuoteStream } from '../hooks/useWebSocket';
import TradingModal from '../components/TradingModal';
import type { OrderData } from '../components/TradingModal';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  sma20?: number[];
  sma50?: number[];
  sma200?: number[];
  ema20?: number[];
  rsi?: number[];
  macd?: { macd: number[], signal: number[], histogram: number[] };
  bollinger?: { upper: number[], middle: number[], lower: number[] };
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  pe: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

const TradingViewPro: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedInterval, setSelectedInterval] = useState('1D');
  const [chartType, setChartType] = useState<'candles' | 'line' | 'bars'>('candles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['SMA20', 'Volume']);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorCanvasRef = useRef<HTMLCanvasElement>(null);
  const [tradingModal, setTradingModal] = useState<{ isOpen: boolean; orderType: 'BUY' | 'SELL' }>({
    isOpen: false,
    orderType: 'BUY'
  });
  const queryClient = useQueryClient();

  const intervals = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'];
  const watchlistSymbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'SPY', 'QQQ', 'META', 'AMZN', 'AMD'];

  // WebSocket connection for real-time quotes
  const { quotes: wsQuotes, isConnected: wsConnected } = useQuoteStream(watchlistSymbols);
  const availableIndicators = [
    'SMA20', 'SMA50', 'SMA200', 'EMA20', 'RSI', 'MACD', 'Bollinger Bands',
    'Volume', 'VWAP', 'Stochastic', 'ATR', 'OBV'
  ];

  // Fetch historical data for selected symbol
  const { data: historicalData, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['historical', selectedSymbol],
    queryFn: async () => {
      const response = await marketAPI.getHistorical(selectedSymbol, 60);
      // Handle both array and object response formats
      const data = Array.isArray(response) ? response : (response?.data || []);
      return data.map((item: any) => ({
        time: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close || item.adj_close,
        volume: item.volume
      }));
    },
    refetchInterval: isAutoRefresh ? 10000 : false,
  });

  // Fetch quotes for all watchlist symbols
  const watchlistQueries = useQueries({
    queries: watchlistSymbols.map(symbol => ({
      queryKey: ['quote', symbol],
      queryFn: async () => {
        try {
          const quote = await marketAPI.getQuote(symbol);
          return {
            symbol,
            price: quote.price || Math.random() * 500 + 50,
            change: quote.change || (Math.random() - 0.5) * 20,
            changePercent: quote.changePercent || (Math.random() - 0.5) * 10,
            open: quote.open || 0,
            high: quote.high || 0,
            low: quote.low || 0,
            volume: quote.volume || Math.floor(Math.random() * 100000000),
            marketCap: quote.marketCap || 0,
            pe: quote.peRatio || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
          };
        } catch (error) {
          // Fallback to mock data
          return {
            symbol,
            price: Math.random() * 500 + 50,
            change: (Math.random() - 0.5) * 20,
            changePercent: (Math.random() - 0.5) * 10,
            open: 0,
            high: 0,
            low: 0,
            volume: Math.floor(Math.random() * 100000000),
            marketCap: 0,
            pe: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
          };
        }
      },
      refetchInterval: isAutoRefresh ? 5000 : false,
    })),
  });

  // Fetch paper trading account info
  const { data: paperAccount } = useQuery({
    queryKey: ['paperAccount'],
    queryFn: paperTradingAPI.getAccount,
    refetchInterval: isAutoRefresh ? 5000 : false,
  });

  // Fetch recent trades
  const { data: recentTrades } = useQuery({
    queryKey: ['recentTrades'],
    queryFn: () => paperTradingAPI.getTrades(20),
    refetchInterval: isAutoRefresh ? 5000 : false,
  });

  // Trade execution mutation
  const tradeMutation = useMutation({
    mutationFn: (order: OrderData) => paperTradingAPI.executeTrade(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paperAccount'] });
      queryClient.invalidateQueries({ queryKey: ['recentTrades'] });
    },
  });

  // Fetch technical indicators
  const { data: technicalData } = useQuery({
    queryKey: ['technical', selectedSymbol],
    queryFn: async () => {
      try {
        const signals = await marketAPI.getSignals(selectedSymbol);
        return signals;
      } catch (error) {
        return null;
      }
    },
    refetchInterval: 60000,
  });

  // Calculate technical indicators
  const calculateIndicators = useCallback((data: ChartData[]): TechnicalIndicators => {
    const indicators: TechnicalIndicators = {};
    const closePrices = data.map(d => d.close);

    // Simple Moving Averages
    if (selectedIndicators.includes('SMA20')) {
      indicators.sma20 = calculateSMA(closePrices, 20);
    }
    if (selectedIndicators.includes('SMA50')) {
      indicators.sma50 = calculateSMA(closePrices, 50);
    }
    if (selectedIndicators.includes('SMA200')) {
      indicators.sma200 = calculateSMA(closePrices, 200);
    }

    // EMA
    if (selectedIndicators.includes('EMA20')) {
      indicators.ema20 = calculateEMA(closePrices, 20);
    }

    // RSI
    if (selectedIndicators.includes('RSI')) {
      indicators.rsi = calculateRSI(closePrices, 14);
    }

    // MACD
    if (selectedIndicators.includes('MACD')) {
      indicators.macd = calculateMACD(closePrices);
    }

    // Bollinger Bands
    if (selectedIndicators.includes('Bollinger Bands')) {
      indicators.bollinger = calculateBollingerBands(closePrices, 20, 2);
    }

    return indicators;
  }, [selectedIndicators]);

  // Technical indicator calculations
  const calculateSMA = (data: number[], period: number): number[] => {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  const calculateEMA = (data: number[], period: number): number[] => {
    const ema = [];
    const multiplier = 2 / (period + 1);

    // Start with SMA
    const sma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(sma);

    for (let i = period; i < data.length; i++) {
      const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(value);
    }

    // Pad beginning with NaN
    return Array(period - 1).fill(NaN).concat(ema);
  };

  const calculateRSI = (data: number[], period: number = 14): number[] => {
    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < data.length; i++) {
      const difference = data[i] - data[i - 1];
      gains.push(difference > 0 ? difference : 0);
      losses.push(difference < 0 ? -difference : 0);
    }

    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        rsi.push(NaN);
      } else {
        const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  };

  const calculateMACD = (data: number[]): { macd: number[], signal: number[], histogram: number[] } => {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    const macd = ema12.map((val, i) => val - ema26[i]);
    const signal = calculateEMA(macd.filter(v => !isNaN(v)), 9);
    const histogram = macd.map((val, i) => val - (signal[i] || 0));

    return { macd, signal, histogram };
  };

  const calculateBollingerBands = (data: number[], period: number, stdDev: number):
    { upper: number[], middle: number[], lower: number[] } => {
    const middle = calculateSMA(data, period);
    const upper = [];
    const lower = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = middle[i];
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
        const std = Math.sqrt(variance);
        upper.push(mean + stdDev * std);
        lower.push(mean - stdDev * std);
      }
    }

    return { upper, middle, lower };
  };

  // Enhanced chart rendering with indicators
  useEffect(() => {
    if (!canvasRef.current || !historicalData || historicalData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Calculate visible data range based on zoom and pan
    const dataCount = historicalData.length;
    const visibleCount = Math.floor(dataCount / zoomLevel);
    const startIndex = Math.max(0, Math.min(dataCount - visibleCount, panOffset));
    const endIndex = Math.min(dataCount, startIndex + visibleCount);
    const visibleData = historicalData.slice(startIndex, endIndex);

    if (visibleData.length === 0) return;

    // Calculate chart dimensions
    const padding = { top: 20, right: 80, bottom: 40, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find price range
    const prices = visibleData.flatMap((d: ChartData) => [d.high, d.low]);
    const minPrice = Math.min(...prices) * 0.995;
    const maxPrice = Math.max(...prices) * 1.005;
    const priceRange = maxPrice - minPrice;

    // Calculate indicators
    const indicators = calculateIndicators(historicalData);

    // Draw grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 0.5;

    // Horizontal grid lines and price labels
    for (let i = 0; i <= 10; i++) {
      const y = padding.top + (chartHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (priceRange / 10) * i;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), width - padding.right + 35, y + 3);
    }

    // Draw chart
    const barWidth = chartWidth / visibleData.length;

    if (chartType === 'candles') {
      // Draw candlestick chart
      visibleData.forEach((data: ChartData, index: number) => {
        const x = padding.left + index * barWidth + barWidth / 2;
        const yHigh = padding.top + ((maxPrice - data.high) / priceRange) * chartHeight;
        const yLow = padding.top + ((maxPrice - data.low) / priceRange) * chartHeight;
        const yOpen = padding.top + ((maxPrice - data.open) / priceRange) * chartHeight;
        const yClose = padding.top + ((maxPrice - data.close) / priceRange) * chartHeight;

        const isGreen = data.close >= data.open;
        ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1;

        // Draw wick
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Draw body
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.abs(yOpen - yClose) || 1;
        ctx.fillRect(x - barWidth * 0.3, bodyTop, barWidth * 0.6, bodyHeight);
      });
    } else {
      // Draw line chart
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      visibleData.forEach((data: ChartData, index: number) => {
        const x = padding.left + index * barWidth + barWidth / 2;
        const y = padding.top + ((maxPrice - data.close) / priceRange) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw technical indicators
    const drawIndicatorLine = (values: number[], color: string, lineWidth: number = 1) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      let firstPoint = true;
      for (let i = startIndex; i < endIndex; i++) {
        if (isNaN(values[i])) continue;

        const x = padding.left + (i - startIndex) * barWidth + barWidth / 2;
        const y = padding.top + ((maxPrice - values[i]) / priceRange) * chartHeight;

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    // Draw moving averages
    if (indicators.sma20) {
      drawIndicatorLine(indicators.sma20, '#fbbf24', 1);
    }
    if (indicators.sma50) {
      drawIndicatorLine(indicators.sma50, '#3b82f6', 1);
    }
    if (indicators.sma200) {
      drawIndicatorLine(indicators.sma200, '#8b5cf6', 1);
    }
    if (indicators.ema20) {
      drawIndicatorLine(indicators.ema20, '#10b981', 1);
    }

    // Draw Bollinger Bands
    if (indicators.bollinger) {
      drawIndicatorLine(indicators.bollinger.upper, 'rgba(168, 85, 247, 0.3)', 1);
      drawIndicatorLine(indicators.bollinger.middle, 'rgba(168, 85, 247, 0.5)', 1);
      drawIndicatorLine(indicators.bollinger.lower, 'rgba(168, 85, 247, 0.3)', 1);

      // Fill between bands
      ctx.fillStyle = 'rgba(168, 85, 247, 0.05)';
      ctx.beginPath();
      for (let i = startIndex; i < endIndex; i++) {
        if (isNaN(indicators.bollinger.upper[i])) continue;
        const x = padding.left + (i - startIndex) * barWidth + barWidth / 2;
        const yUpper = padding.top + ((maxPrice - indicators.bollinger.upper[i]) / priceRange) * chartHeight;
        if (i === startIndex) {
          ctx.moveTo(x, yUpper);
        } else {
          ctx.lineTo(x, yUpper);
        }
      }
      for (let i = endIndex - 1; i >= startIndex; i--) {
        if (isNaN(indicators.bollinger.lower[i])) continue;
        const x = padding.left + (i - startIndex) * barWidth + barWidth / 2;
        const yLower = padding.top + ((maxPrice - indicators.bollinger.lower[i]) / priceRange) * chartHeight;
        ctx.lineTo(x, yLower);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Draw volume bars at the bottom
    const maxVolume = Math.max(...visibleData.map((d: ChartData) => d.volume));
    const volumeHeight = chartHeight * 0.2;

    visibleData.forEach((data: ChartData, index: number) => {
      const x = padding.left + index * barWidth;
      const barHeight = (data.volume / maxVolume) * volumeHeight;
      const y = height - padding.bottom - barHeight;

      ctx.fillStyle = data.close >= data.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);
    });

    // Draw crosshair
    if (showCrosshair && mousePos.x > 0 && mousePos.y > 0) {
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([5, 5]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, padding.top);
      ctx.lineTo(mousePos.x, height - padding.bottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padding.left, mousePos.y);
      ctx.lineTo(width - padding.right, mousePos.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Price label at crosshair
      const price = maxPrice - ((mousePos.y - padding.top) / chartHeight) * priceRange;
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(width - padding.right + 5, mousePos.y - 10, 70, 20);
      ctx.fillStyle = '#f3f4f6';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), width - padding.right + 10, mousePos.y + 3);
    }

  }, [historicalData, chartType, zoomLevel, panOffset, selectedIndicators, calculateIndicators, showCrosshair, mousePos]);

  // Handle canvas mouse events
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleCanvasMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Get current stock quote
  const currentQuote = watchlistQueries.find(q => q.data?.symbol === selectedSymbol)?.data;

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header Bar */}
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            StarkMatter Pro
          </h1>

          {/* Symbol Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbols..."
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none w-64"
            />
          </div>

          {/* Interval Selector */}
          <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
            {intervals.map(interval => (
              <button
                key={interval}
                onClick={() => setSelectedInterval(interval)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedInterval === interval
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {interval}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('candles')}
              className={`p-2 rounded ${chartType === 'candles' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Candlestick"
            >
              <CandlestickChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Line"
            >
              <LineChart className="h-4 w-4" />
            </button>
          </div>

          {/* Chart Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoomLevel(Math.min(zoomLevel * 1.2, 5))}
              className="p-2 hover:bg-gray-800 rounded"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => setZoomLevel(Math.max(zoomLevel / 1.2, 0.5))}
              className="p-2 hover:bg-gray-800 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => setShowCrosshair(!showCrosshair)}
              className={`p-2 rounded ${showCrosshair ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
              title="Crosshair"
            >
              <Crosshair className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* WebSocket connection indicator */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-800">
            {wsConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-400" />
                <span className="text-xs text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-400" />
                <span className="text-xs text-red-400">Offline</span>
              </>
            )}
          </div>

          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`p-2 rounded ${isAutoRefresh ? 'bg-green-900 text-green-400' : 'hover:bg-gray-800 text-gray-400'}`}
            title={isAutoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          >
            {isAutoRefresh ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            onClick={() => refetchHistory()}
            className="p-2 hover:bg-gray-800 rounded"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded">
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Watchlist */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Watchlist</h2>
              <button className="p-1 hover:bg-gray-800 rounded">
                <Plus className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {watchlistSymbols.map((symbol) => {
              // Use WebSocket quote if available, fallback to query data
              const wsQuote = wsQuotes.get(symbol);
              const queryData = watchlistQueries.find(q => q.data?.symbol === symbol)?.data;
              const stock = wsQuote || queryData;

              if (!stock) return null;
              const isPositive = (stock.change || stock.changePercent || 0) >= 0;

              return (
                <div
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className={`p-3 border-b border-gray-800 cursor-pointer transition-colors hover:bg-gray-800 ${
                    selectedSymbol === symbol ? 'bg-gray-800 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{symbol}</span>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(stock.price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Vol {formatVolume(stock.volume)}
                    </span>
                    <span className={`text-xs font-medium ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isPositive ? '+' : ''}{formatPercentage(stock.changePercent)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col">
          {/* Stock Info Bar */}
          <div className="bg-gray-900 px-4 py-3 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold">{selectedSymbol}</h2>
                    <span className="text-gray-500">
                      {selectedSymbol === 'AAPL' ? 'Apple Inc.' :
                       selectedSymbol === 'GOOGL' ? 'Alphabet Inc.' :
                       selectedSymbol === 'MSFT' ? 'Microsoft Corp.' :
                       selectedSymbol === 'NVDA' ? 'NVIDIA Corp.' :
                       selectedSymbol === 'TSLA' ? 'Tesla Inc.' :
                       selectedSymbol === 'META' ? 'Meta Platforms' :
                       selectedSymbol === 'AMZN' ? 'Amazon.com Inc.' :
                       selectedSymbol === 'AMD' ? 'Advanced Micro Devices' :
                       'Stock'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-2xl font-semibold">
                      {currentQuote ? formatCurrency(currentQuote.price) : '$---.--'}
                    </span>
                    {currentQuote && (
                      <span className={`text-lg font-medium ${
                        currentQuote.change >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {currentQuote.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(currentQuote.change))}
                        ({currentQuote.change >= 0 ? '+' : ''}{formatPercentage(currentQuote.changePercent)})
                      </span>
                    )}
                  </div>
                </div>

                {currentQuote && (
                  <div className="flex space-x-6 text-sm">
                    <div>
                      <span className="text-gray-500">Open</span>
                      <div className="font-medium">{formatCurrency(currentQuote.open)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">High</span>
                      <div className="font-medium">{formatCurrency(currentQuote.high)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Low</span>
                      <div className="font-medium">{formatCurrency(currentQuote.low)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Volume</span>
                      <div className="font-medium">{formatVolume(currentQuote.volume)}</div>
                    </div>
                  </div>
                )}

                {/* Technical Signals */}
                {technicalData && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      Signal: <span className={`font-medium ${
                        technicalData.signal === 'BUY' ? 'text-green-500' :
                        technicalData.signal === 'SELL' ? 'text-red-500' :
                        'text-yellow-500'
                      }`}>{technicalData.signal || 'HOLD'}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Indicators Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                  <Activity className="h-4 w-4" />
                  <span>Indicators ({selectedIndicators.length})</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 hidden group-hover:block z-10">
                  <div className="p-2">
                    {availableIndicators.map(indicator => (
                      <label key={indicator} className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIndicators.includes(indicator)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIndicators([...selectedIndicators, indicator]);
                            } else {
                              setSelectedIndicators(selectedIndicators.filter(i => i !== indicator));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{indicator}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 bg-black p-4 relative">
            {loadingHistory ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500">Loading chart data...</div>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                style={{ imageRendering: 'crisp-edges' }}
              />
            )}

            {/* Indicator panels */}
            {selectedIndicators.includes('RSI') && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gray-900 border-t border-gray-800 p-2">
                <div className="text-xs text-gray-500">RSI (14)</div>
                <canvas ref={indicatorCanvasRef} className="w-full h-16" />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Trade Panel */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <h3 className="font-semibold">Trade {selectedSymbol}</h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Order Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Order Type</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2">
                <option>Market Order</option>
                <option>Limit Order</option>
                <option>Stop Loss</option>
                <option>Take Profit</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Quantity</label>
              <input
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                placeholder="0"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Price</label>
              <input
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                placeholder={currentQuote ? currentQuote.price.toFixed(2) : '0.00'}
              />
            </div>

            {/* Trade Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTradingModal({ isOpen: true, orderType: 'BUY' })}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition">
                BUY
              </button>
              <button
                onClick={() => setTradingModal({ isOpen: true, orderType: 'SELL' })}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition">
                SELL
              </button>
            </div>

            {/* Position Info */}
            <div className="border-t border-gray-800 pt-4">
              <h4 className="text-sm font-medium mb-2">Paper Trading Account</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Balance:</span>
                  <span>{paperAccount ? formatCurrency(paperAccount.balance) : '$10,000.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Buying Power:</span>
                  <span>{paperAccount ? formatCurrency(paperAccount.buying_power) : '$10,000.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total P&L:</span>
                  <span className={paperAccount?.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {paperAccount ? formatCurrency(paperAccount.total_pnl) : '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Win Rate:</span>
                  <span>{paperAccount?.win_rate ? `${(paperAccount.win_rate * 100).toFixed(1)}%` : '0%'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="flex-1 border-t border-gray-800">
            <div className="p-3 border-b border-gray-800">
              <h3 className="font-semibold">Recent Trades</h3>
            </div>
            <div className="overflow-y-auto h-48">
              <div className="px-3 py-2 grid grid-cols-4 gap-2 text-xs text-gray-500 border-b border-gray-800">
                <span>Time</span>
                <span>Symbol</span>
                <span>Side</span>
                <span>Total</span>
              </div>
              {recentTrades && recentTrades.length > 0 ? (
                recentTrades.map((trade: any) => (
                  <div key={trade.id} className="px-3 py-1 grid grid-cols-4 gap-2 text-xs hover:bg-gray-800">
                    <span className="text-gray-400">
                      {new Date(trade.executed_at).toLocaleTimeString()}
                    </span>
                    <span className="text-white font-medium">{trade.symbol}</span>
                    <span className={trade.order_type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                      {trade.order_type} {trade.quantity}
                    </span>
                    <span>{formatCurrency(trade.price * trade.quantity)}</span>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  No trades yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trading Modal */}
      <TradingModal
        isOpen={tradingModal.isOpen}
        onClose={() => setTradingModal({ ...tradingModal, isOpen: false })}
        symbol={selectedSymbol}
        currentPrice={currentQuote?.price || 100}
        orderType={tradingModal.orderType}
        onSubmit={async (order) => {
          await tradeMutation.mutateAsync(order);
          setTradingModal({ ...tradingModal, isOpen: false });
        }}
      />
    </div>
  );
};

export default TradingViewPro;