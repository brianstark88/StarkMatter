import { useState, useEffect } from 'react';
import { Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercent, formatVolume, cn, getChangeColor } from '../../lib/utils';
import { marketAPI } from '../../lib/api';
import type { WatchlistItem } from '../../types';

export default function WatchlistTable() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const data = await marketAPI.getWatchlist();
      // Handle both array and object with symbols property
      let watchlistData: WatchlistItem[] = [];
      if (Array.isArray(data)) {
        watchlistData = data;
      } else if (data && typeof data === 'object' && 'symbols' in data) {
        const symbolsData = (data as { symbols?: WatchlistItem[] }).symbols;
        watchlistData = Array.isArray(symbolsData) ? symbolsData : [];
      }
      setWatchlist(watchlistData);
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await marketAPI.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Watchlist</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Change
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Volume
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {watchlist.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <TrendingUp className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No symbols in watchlist. Add symbols from the market data page.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              watchlist.map((item) => (
                <tr key={item.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTrendIcon(item.change_percent)}
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {item.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={cn("text-sm font-medium", getChangeColor(item.change))}>
                        {item.change > 0 ? '+' : ''}{formatCurrency(Math.abs(item.change))}
                      </span>
                      <span className={cn("text-xs", getChangeColor(item.change_percent))}>
                        {formatPercent(item.change_percent)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatVolume(item.volume)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => removeFromWatchlist(item.symbol)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}