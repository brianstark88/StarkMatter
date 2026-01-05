import React, { useEffect, useRef, useState } from 'react';
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
  TrendingDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { marketAPI } from '../lib/api';
import { formatCurrency, formatPercentage, formatNumber } from '../lib/utils';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const TradingViewSimple: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedInterval, setSelectedInterval] = useState('1D');
  const [chartType, setChartType] = useState<'candles' | 'line' | 'bars'>('candles');
  const [searchQuery, setSearchQuery] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const intervals = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'];
  const watchlistSymbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'SPY', 'QQQ', 'META', 'AMZN', 'AMD'];

  // Fetch historical data for selected symbol
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['historical', selectedSymbol],
    queryFn: async () => {
      try {
        const data = await marketAPI.getHistorical(selectedSymbol, 30);
        return data.map((item: any) => ({
          time: item.date,
          open: item.open || 0,
          high: item.high || 0,
          low: item.low || 0,
          close: item.close || 0,
          volume: item.volume || 0
        }));
      } catch (error) {
        // Return mock data for demo
        const now = new Date();
        return Array.from({ length: 30 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (30 - i));
          const basePrice = 150 + Math.random() * 50;
          return {
            time: date.toISOString().split('T')[0],
            open: basePrice + Math.random() * 5 - 2.5,
            high: basePrice + Math.random() * 5,
            low: basePrice - Math.random() * 5,
            close: basePrice + Math.random() * 5 - 2.5,
            volume: Math.floor(Math.random() * 100000000)
          };
        });
      }
    },
    refetchInterval: 60000,
  });

  // Simple canvas-based chart rendering
  useEffect(() => {
    if (!canvasRef.current || !historicalData || historicalData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate chart dimensions
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Find min and max values
    const prices = historicalData.flatMap((d: ChartData) => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 0.5;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), padding - 10, y + 3);
    }

    // Vertical grid lines
    const dataPoints = historicalData.length;
    for (let i = 0; i <= 5; i++) {
      const x = padding + (chartWidth / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();

      // Date labels
      const dataIndex = Math.floor((dataPoints - 1) * (i / 5));
      if (historicalData[dataIndex]) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x, canvas.height - padding + 20);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(historicalData[dataIndex].time.slice(5), 0, 0);
        ctx.restore();
      }
    }

    // Draw chart based on type
    const barWidth = chartWidth / dataPoints;

    if (chartType === 'candles') {
      // Draw candlestick chart
      historicalData.forEach((data: ChartData, index: number) => {
        const x = padding + index * barWidth + barWidth / 2;
        const yHigh = padding + ((maxPrice - data.high) / priceRange) * chartHeight;
        const yLow = padding + ((maxPrice - data.low) / priceRange) * chartHeight;
        const yOpen = padding + ((maxPrice - data.open) / priceRange) * chartHeight;
        const yClose = padding + ((maxPrice - data.close) / priceRange) * chartHeight;

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

      historicalData.forEach((data: ChartData, index: number) => {
        const x = padding + index * barWidth + barWidth / 2;
        const y = padding + ((maxPrice - data.close) / priceRange) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw volume bars at the bottom
    const maxVolume = Math.max(...historicalData.map((d: ChartData) => d.volume));
    const volumeHeight = chartHeight * 0.2;

    historicalData.forEach((data: ChartData, index: number) => {
      const x = padding + index * barWidth;
      const height = (data.volume / maxVolume) * volumeHeight;
      const y = canvas.height - padding - height;

      ctx.fillStyle = data.close >= data.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(x, y, barWidth * 0.8, height);
    });

  }, [historicalData, chartType]);

  // Mock current price data
  const currentPrice = 271.01;
  const priceChange = 3.45;
  const priceChangePercent = 1.29;

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header Bar */}
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-blue-400">StarkMatter Trading</h1>

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
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-800 rounded">
            <Grid3X3 className="h-4 w-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded">
            <Maximize2 className="h-4 w-4 text-gray-400" />
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
            {watchlistSymbols.map((symbol, index) => {
              // Use deterministic mock data based on symbol and index
              const seed = symbol.charCodeAt(0) + symbol.charCodeAt(1) + index;
              const mockPrice = (seed * 2.5) % 400 + 100;
              const mockChange = ((seed * 1.3) % 40) - 20;
              const mockChangePercent = ((seed * 0.7) % 20) - 10;
              const mockVolume = (seed * 1000000) % 100000000 + 10000000;
              const isPositive = mockChange >= 0;

              return (
                <div
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className={`p-3 border-b border-gray-800 cursor-pointer transition-colors hover:bg-gray-800 ${
                    selectedSymbol === symbol ? 'bg-gray-800' : ''
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
                    <span className="text-sm font-medium">{formatCurrency(mockPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Vol {formatNumber(mockVolume, 0)}
                    </span>
                    <span className={`text-xs font-medium ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isPositive ? '+' : ''}{formatPercentage(mockChangePercent)}
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
                       'Stock'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-2xl font-semibold">{formatCurrency(currentPrice)}</span>
                    <span className={`text-lg font-medium ${
                      priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {priceChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(priceChange))}
                      ({priceChange >= 0 ? '+' : ''}{formatPercentage(priceChangePercent)})
                    </span>
                  </div>
                </div>

                <div className="flex space-x-6 text-sm">
                  <div>
                    <span className="text-gray-500">Open</span>
                    <div className="font-medium">{formatCurrency(268.45)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">High</span>
                    <div className="font-medium">{formatCurrency(272.89)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Low</span>
                    <div className="font-medium">{formatCurrency(267.32)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Volume</span>
                    <div className="font-medium">{formatNumber(54829100, 0)}</div>
                  </div>
                </div>
              </div>

              {/* Indicators Dropdown */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                  <Activity className="h-4 w-4" />
                  <span>Indicators</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 bg-black p-4 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500">Loading chart data...</div>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ imageRendering: 'crisp-edges' }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewSimple;