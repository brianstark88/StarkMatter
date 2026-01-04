import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent, cn, getChangeColor } from '../../lib/utils';
import { portfolioAPI } from '../../lib/api';
import type { Position } from '../../types';

export default function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const data = await portfolioAPI.getPositions();
      setPositions(data);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setLoading(false);
    }
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

  const totalValue = positions.reduce((sum, pos) => sum + pos.market_value, 0);
  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0);
  const totalCost = positions.reduce((sum, pos) => sum + (pos.quantity * pos.average_price), 0);
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Positions</h3>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalValue)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total P&L:</span>
              <span className={cn("ml-2 font-semibold", getChangeColor(totalPnL))}>
                {formatCurrency(totalPnL)} ({formatPercent(totalPnLPercent)})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Avg Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Market Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Unrealized P&L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                % Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No positions in portfolio. Start by adding positions or using paper trading.
                </td>
              </tr>
            ) : (
              positions.map((position) => (
                <tr key={position.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {position.symbol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {position.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(position.average_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(position.current_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(position.market_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn("text-sm font-medium", getChangeColor(position.unrealized_pnl))}>
                      {formatCurrency(position.unrealized_pnl)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn("text-sm font-medium", getChangeColor(position.unrealized_pnl_percent))}>
                      {formatPercent(position.unrealized_pnl_percent)}
                    </span>
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