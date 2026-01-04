import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { paperTradingAPI, marketAPI } from '../lib/api';
import { formatCurrency, formatPercent, formatDateTime, cn, getChangeColor } from '../lib/utils';
import type { PaperAccount, Trade, Quote } from '../types';

export default function PaperTrading() {
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [executing, setExecuting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountData, tradesData] = await Promise.all([
        paperTradingAPI.getAccount(),
        paperTradingAPI.getTrades()
      ]);
      setAccount(accountData);
      // Ensure trades is always an array
      setTrades(Array.isArray(tradesData) ? tradesData : []);
    } catch (error) {
      console.error('Failed to fetch paper trading data:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuote = async () => {
    if (!symbol) return;
    try {
      const quoteData = await marketAPI.getQuote(symbol.toUpperCase());
      setQuote(quoteData);
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      setQuote(null);
    }
  };

  const executeTrade = async () => {
    if (!symbol || quantity <= 0) return;

    setExecuting(true);
    try {
      await paperTradingAPI.executeTrade({
        symbol: symbol.toUpperCase(),
        quantity,
        order_type: orderType
      });

      // Refresh data
      await fetchData();

      // Reset form
      setSymbol('');
      setQuantity(1);
      setQuote(null);
    } catch (error) {
      console.error('Failed to execute trade:', error);
      alert('Failed to execute trade. Please try again.');
    } finally {
      setExecuting(false);
    }
  };

  const resetAccount = async () => {
    if (!confirm('Are you sure you want to reset your paper trading account? This will clear all trades and positions.')) {
      return;
    }

    try {
      await paperTradingAPI.resetAccount();
      await fetchData();
    } catch (error) {
      console.error('Failed to reset account:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paper Trading</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Practice trading with virtual money - $10,000 starting balance
          </p>
        </div>
        <button
          onClick={resetAccount}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Account
        </button>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Account Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(account?.total_value || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total P&L</p>
              <p className={cn("text-2xl font-bold", getChangeColor(account?.total_pnl || 0))}>
                {formatCurrency(account?.total_pnl || 0)}
              </p>
              <p className={cn("text-sm", getChangeColor(account?.total_pnl_percent || 0))}>
                {formatPercent(account?.total_pnl_percent || 0)}
              </p>
            </div>
            {(account?.total_pnl || 0) >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-500" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-500" />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(account?.win_rate || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {account?.winning_trades || 0}W / {account?.losing_trades || 0}L
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cash Balance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(account?.cash_balance || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Trade Execution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Execute Trade</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onBlur={fetchQuote}
              placeholder="AAPL"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as 'BUY' | 'SELL')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Est. Price
            </label>
            <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
              <span className="text-gray-900 dark:text-white">
                {quote ? formatCurrency(quote.price) : '—'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total
            </label>
            <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
              <span className="text-gray-900 dark:text-white">
                {quote ? formatCurrency(quote.price * quantity) : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={executeTrade}
            disabled={!symbol || quantity <= 0 || executing}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-colors",
              orderType === 'BUY'
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white",
              (!symbol || quantity <= 0 || executing) && "opacity-50 cursor-not-allowed"
            )}
          >
            {executing ? 'Executing...' : `${orderType} ${quantity} ${symbol}`}
          </button>
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trade History</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No trades yet. Start trading to see your history.
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDateTime(trade.executed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {trade.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        trade.order_type === 'BUY'
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      )}>
                        {trade.order_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {trade.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(trade.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(trade.total_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}