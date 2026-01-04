import { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, Download, TrendingUp } from 'lucide-react';
import { marketAPI } from '../lib/api';
import { formatCurrency, formatPercent, formatVolume, cn, getChangeColor } from '../lib/utils';
import type { Quote, MarketData as MarketDataType } from '../types';

export default function MarketData() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [historicalData, setHistoricalData] = useState<MarketDataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingDaily, setImportingDaily] = useState(false);
  const [importingNews, setImportingNews] = useState(false);

  const searchQuote = async () => {
    if (!searchSymbol) return;

    setLoading(true);
    try {
      const [quoteData, historical] = await Promise.all([
        marketAPI.getQuote(searchSymbol.toUpperCase()),
        marketAPI.getHistorical(searchSymbol.toUpperCase(), 30)
      ]);
      setQuote(quoteData);
      setHistoricalData(historical);
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      setQuote(null);
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!searchSymbol) return;

    try {
      await marketAPI.addToWatchlist(searchSymbol.toUpperCase());
      alert(`${searchSymbol.toUpperCase()} added to watchlist`);
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  const importDailyData = async () => {
    setImportingDaily(true);
    try {
      await marketAPI.importDaily();
      alert('Daily market data imported successfully');
    } catch (error) {
      console.error('Failed to import daily data:', error);
      alert('Failed to import daily data');
    } finally {
      setImportingDaily(false);
    }
  };

  const importNews = async () => {
    setImportingNews(true);
    try {
      await marketAPI.importNews();
      alert('News imported successfully');
    } catch (error) {
      console.error('Failed to import news:', error);
      alert('Failed to import news');
    } finally {
      setImportingNews(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Data</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Search stocks, view quotes, and manage your watchlist
        </p>
      </div>

      {/* Import Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Import</h2>
        <div className="flex gap-4">
          <button
            onClick={importDailyData}
            disabled={importingDaily}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {importingDaily ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {importingDaily ? 'Importing...' : 'Import Daily Data'}
          </button>
          <button
            onClick={importNews}
            disabled={importingNews}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {importingNews ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {importingNews ? 'Importing...' : 'Import News'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Search Stock</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && searchQuote()}
                placeholder="Enter symbol (e.g., AAPL)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={searchQuote}
            disabled={!searchSymbol || loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={addToWatchlist}
            disabled={!searchSymbol}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Watchlist
          </button>
        </div>
      </div>

      {/* Quote Display */}
      {quote && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{quote.symbol}</h2>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(quote.price)}
                </span>
                <span className={cn("ml-4 text-lg font-medium", getChangeColor(quote.change_percent || 0))}>
                  {quote.change > 0 ? '+' : ''}{formatCurrency(quote.change || 0)}
                  ({formatPercent(quote.change_percent || 0)})
                </span>
              </div>
            </div>
            <TrendingUp className={cn(
              "h-8 w-8",
              quote.change_percent && quote.change_percent > 0 ? "text-green-500" : "text-red-500"
            )} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {formatCurrency(quote.open)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {formatCurrency(quote.high)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {formatCurrency(quote.low)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {formatVolume(quote.volume)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Market Cap</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {quote.market_cap ? formatVolume(quote.market_cap) : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">P/E Ratio</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {quote.pe_ratio ? quote.pe_ratio.toFixed(2) : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">52W High</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {quote.fifty_two_week_high ? formatCurrency(quote.fifty_two_week_high) : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">52W Low</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {quote.fifty_two_week_low ? formatCurrency(quote.fifty_two_week_low) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historical Data */}
      {historicalData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Historical Data (Last 30 Days)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Open
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    High
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Low
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Close
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {historicalData.slice(0, 10).map((data, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(data.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(data.open)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(data.high)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(data.low)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(data.close)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatVolume(data.volume)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}