import { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, Briefcase } from 'lucide-react';
import PositionsTable from '../components/Portfolio/PositionsTable';
import StatsCard from '../components/Dashboard/StatsCard';
import { portfolioAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import type { PortfolioSummary } from '../types';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    quantity: 0,
    price: 0
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const data = await portfolioAPI.getSummary();
      setPortfolio(data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPosition = async () => {
    if (!newPosition.symbol || newPosition.quantity <= 0 || newPosition.price <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    try {
      await portfolioAPI.addPosition(newPosition);
      await fetchPortfolio();
      setShowAddPosition(false);
      setNewPosition({ symbol: '', quantity: 0, price: 0 });
    } catch (error) {
      console.error('Failed to add position:', error);
      alert('Failed to add position');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your investment positions and track performance
          </p>
        </div>
        <button
          onClick={() => setShowAddPosition(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Position
        </button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Value"
          value={formatCurrency(portfolio?.total_value || 0)}
          icon={<Briefcase className="h-6 w-6 text-indigo-600" />}
        />
        <StatsCard
          title="Total P&L"
          value={formatCurrency(portfolio?.total_pnl || 0)}
          change={portfolio?.total_pnl_percent}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          trend={portfolio?.total_pnl_percent && portfolio.total_pnl_percent > 0 ? 'up' : 'down'}
        />
        <StatsCard
          title="Day Change"
          value={formatCurrency(portfolio?.day_change || 0)}
          change={portfolio?.day_change_percent}
          changeLabel="today"
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          trend={portfolio?.day_change && portfolio.day_change > 0 ? 'up' : 'down'}
        />
        <StatsCard
          title="Positions"
          value={portfolio?.positions?.length || 0}
          icon={<Briefcase className="h-6 w-6 text-purple-600" />}
        />
      </div>

      {/* Positions Table */}
      <PositionsTable />

      {/* Add Position Modal */}
      {showAddPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Add New Position
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  value={newPosition.symbol}
                  onChange={(e) => setNewPosition({ ...newPosition, symbol: e.target.value.toUpperCase() })}
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
                  value={newPosition.quantity}
                  onChange={(e) => setNewPosition({ ...newPosition, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="100"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Average Price
                </label>
                <input
                  type="number"
                  value={newPosition.price}
                  onChange={(e) => setNewPosition({ ...newPosition, price: parseFloat(e.target.value) || 0 })}
                  placeholder="150.00"
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Value: {formatCurrency(newPosition.quantity * newPosition.price)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={addPosition}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Position
              </button>
              <button
                onClick={() => {
                  setShowAddPosition(false);
                  setNewPosition({ symbol: '', quantity: 0, price: 0 });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Allocation Chart Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Portfolio Allocation
        </h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Allocation chart will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}
