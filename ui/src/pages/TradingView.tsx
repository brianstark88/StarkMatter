import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
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
  ChevronDown
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

const TradingView: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const candlestickSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeries = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedInterval, setSelectedInterval] = useState('1D');
  const [chartType, setChartType] = useState<'candles' | 'line' | 'bars'>('candles');
  const [searchQuery, setSearchQuery] = useState('');

  const intervals = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'];
  const watchlistSymbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'SPY', 'QQQ', 'META', 'AMZN', 'AMD'];

  // Fetch historical data for selected symbol
  const { data: historicalData, isLoading: isLoadingChart } = useQuery({
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

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chart.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937', style: 1 },
        horzLines: { color: '#1f2937', style: 1 },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#6b7280',
          width: 1,
          style: 2,
          labelBackgroundColor: '#1f2937',
        },
        horzLine: {
          color: '#6b7280',
          width: 1,
          style: 2,
          labelBackgroundColor: '#1f2937',
        },
      },
      rightPriceScale: {
        borderColor: '#1f2937',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: true,
        secondsVisible: false,
      },
      watermark: {
        visible: true,
        fontSize: 48,
        horzAlign: 'center',
        vertAlign: 'center',
        color: 'rgba(156, 163, 175, 0.1)',
        text: selectedSymbol,
      },
    });

    // Add candlestick series
    try {
      candlestickSeries.current = chart.current.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
    } catch (error) {
      // Fallback for different API versions
      candlestickSeries.current = (chart.current as any).addCandleSeries ?
        (chart.current as any).addCandleSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        }) :
        chart.current.addLineSeries({
          color: '#22c55e',
          lineWidth: 2,
        }) as any;
    }

    // Add volume series
    try {
      volumeSeries.current = chart.current.addHistogramSeries({
        color: '#3b82f6',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    } catch (error) {
      // Fallback for volume
      volumeSeries.current = chart.current.addHistogramSeries({
        color: '#3b82f6',
        priceScaleId: '',
      } as any);
    }

    // Handle resize
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, [selectedSymbol]);

  // Update chart data
  useEffect(() => {
    if (!historicalData || !candlestickSeries.current || !volumeSeries.current) return;

    try {
      // Convert data to chart format
      const candleData = historicalData.map((d: ChartData) => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      const volumeData = historicalData.map((d: ChartData) => ({
        time: d.time as Time,
        value: d.volume,
        color: d.close >= d.open ? '#22c55e' : '#ef4444',
      }));

      candlestickSeries.current.setData(candleData);
      volumeSeries.current.setData(volumeData);

      if (chart.current) {
        chart.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
      // Fallback: try to set line data if candlestick fails
      try {
        const lineData = historicalData.map((d: ChartData) => ({
          time: d.time as Time,
          value: d.close,
        }));
        candlestickSeries.current.setData(lineData as any);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  }, [historicalData]);

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
            <button
              onClick={() => setChartType('bars')}
              className={`p-2 rounded ${chartType === 'bars' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Bars"
            >
              <BarChart3 className="h-4 w-4" />
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
            {watchlistSymbols.map(symbol => {
              const mockPrice = Math.random() * 500 + 50;
              const mockChange = (Math.random() - 0.5) * 20;
              const mockChangePercent = (Math.random() - 0.5) * 10;
              const mockVolume = Math.floor(Math.random() * 100000000);

              return (
                <div
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className={`p-3 border-b border-gray-800 cursor-pointer transition-colors hover:bg-gray-800 ${
                    selectedSymbol === symbol ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{symbol}</span>
                    <span className="text-sm">{formatCurrency(mockPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Vol {formatNumber(mockVolume, 0)}
                    </span>
                    <span className={`text-xs font-medium ${
                      mockChange >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {mockChange >= 0 ? '+' : ''}{formatPercentage(mockChangePercent)}
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
                    <span className="text-gray-500">Apple Inc.</span>
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
                  <div>
                    <span className="text-gray-500">Market Cap</span>
                    <div className="font-medium">$2.91T</div>
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
          <div ref={chartContainerRef} className="flex-1 bg-black" />
        </div>

        {/* Right Sidebar - Order Book */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Order Book */}
          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b border-gray-800">
              <h3 className="font-semibold">Order Book</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              {/* Asks */}
              <div className="h-1/2 overflow-y-auto">
                {[...Array(10)].map((_, i) => (
                  <div key={`ask-${i}`} className="flex justify-between px-3 py-1 text-xs">
                    <span className="text-red-500">{(currentPrice + (i + 1) * 0.01).toFixed(2)}</span>
                    <span className="text-gray-500">{(Math.random() * 10000).toFixed(0)}</span>
                    <span className="text-gray-600">{(Math.random() * 100000).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* Spread */}
              <div className="bg-gray-800 px-3 py-2 text-center font-medium">
                {formatCurrency(currentPrice)}
              </div>

              {/* Bids */}
              <div className="h-1/2 overflow-y-auto">
                {[...Array(10)].map((_, i) => (
                  <div key={`bid-${i}`} className="flex justify-between px-3 py-1 text-xs">
                    <span className="text-green-500">{(currentPrice - (i + 1) * 0.01).toFixed(2)}</span>
                    <span className="text-gray-500">{(Math.random() * 10000).toFixed(0)}</span>
                    <span className="text-gray-600">{(Math.random() * 100000).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="h-64 border-t border-gray-800">
            <div className="p-3 border-b border-gray-800">
              <h3 className="font-semibold">Recent Trades</h3>
            </div>
            <div className="overflow-y-auto h-48">
              <div className="px-3 py-2 grid grid-cols-3 gap-2 text-xs text-gray-500 border-b border-gray-800">
                <span>Price</span>
                <span>Size</span>
                <span>Time</span>
              </div>
              {[...Array(20)].map((_, i) => {
                const isUp = Math.random() > 0.5;
                return (
                  <div key={`trade-${i}`} className="px-3 py-1 grid grid-cols-3 gap-2 text-xs">
                    <span className={isUp ? 'text-green-500' : 'text-red-500'}>
                      {(currentPrice + (Math.random() - 0.5) * 0.1).toFixed(2)}
                    </span>
                    <span className="text-gray-400">{(Math.random() * 1000).toFixed(0)}</span>
                    <span className="text-gray-500">
                      {new Date(Date.now() - i * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingView;