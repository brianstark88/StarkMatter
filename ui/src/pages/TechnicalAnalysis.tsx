import { useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { marketAPI } from '../lib/api';
import { formatCurrency, formatNumber, cn, getSignalColor } from '../lib/utils';
import type { TechnicalSignal } from '../types';

export default function TechnicalAnalysis() {
  const [symbol, setSymbol] = useState('');
  const [signals, setSignals] = useState<TechnicalSignal | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSignals = async () => {
    if (!symbol) return;

    setLoading(true);
    try {
      const data = await marketAPI.getSignals(symbol.toUpperCase());
      setSignals(data);
    } catch (error) {
      console.error('Failed to fetch signals:', error);
      setSignals(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Technical Analysis</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Analyze stocks using technical indicators and signals
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchSignals()}
            placeholder="Enter symbol (e.g., AAPL)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={fetchSignals}
            disabled={!symbol || loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Technical Indicators */}
      {signals && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {signals.symbol} - Technical Indicators
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Signal:</span>
                <span className={cn(
                  "px-3 py-1 rounded-full font-medium text-sm",
                  signals.signal === 'BUY' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                  signals.signal === 'SELL' ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                )}>
                  {signals.signal}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  Strength: {(signals.strength * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* RSI */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">RSI (14)</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(signals.rsi)}
                </p>
                <p className={cn("text-sm",
                  signals.rsi < 30 ? "text-green-600" :
                  signals.rsi > 70 ? "text-red-600" :
                  "text-gray-600"
                )}>
                  {signals.rsi < 30 ? "Oversold" : signals.rsi > 70 ? "Overbought" : "Neutral"}
                </p>
              </div>

              {/* MACD */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">MACD</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(signals.macd.histogram)}
                </p>
                <p className={cn("text-sm",
                  signals.macd.histogram > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {signals.macd.histogram > 0 ? "Bullish" : "Bearish"}
                </p>
              </div>

              {/* SMA 20 */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">SMA 20</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(signals.sma_20)}
                </p>
              </div>

              {/* SMA 50 */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">SMA 50</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(signals.sma_50)}
                </p>
              </div>
            </div>
          </div>

          {/* Bollinger Bands */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Bollinger Bands
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upper Band</p>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {formatCurrency(signals.bollinger.upper)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Middle Band</p>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {formatCurrency(signals.bollinger.middle)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lower Band</p>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {formatCurrency(signals.bollinger.lower)}
                </p>
              </div>
            </div>
          </div>

          {/* EMA Values */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Exponential Moving Averages
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">EMA 12</p>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {formatCurrency(signals.ema_12)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">EMA 26</p>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {formatCurrency(signals.ema_26)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {!signals && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Enter a symbol above to see technical analysis
            </p>
          </div>
        </div>
      )}
    </div>
  );
}