import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import StatsCard from '../components/Dashboard/StatsCard';
import WatchlistTable from '../components/Market/WatchlistTable';
import PositionsTable from '../components/Portfolio/PositionsTable';
import { dashboardAPI } from '../lib/api';
import { formatCurrency, formatPercent, formatDateTime } from '../lib/utils';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await dashboardAPI.getSummary();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
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

  const portfolio = dashboardData?.portfolio || {};
  const paperTrading = dashboardData?.paper_trading || {};
  const news = dashboardData?.recent_news || [];

  // Map the API response fields to expected names
  const portfolioValue = portfolio.total_market_value || portfolio.total_value || 0;
  const portfolioPnlPercent = portfolio.total_pl_pct || portfolio.total_pnl_percent || 0;
  const paperTradingValue = paperTrading.total_value || 10000;
  const paperTradingPnlPercent = paperTrading.return_pct || paperTrading.total_pnl_percent || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your trading overview and market insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Portfolio Value"
          value={formatCurrency(portfolioValue)}
          change={portfolioPnlPercent}
          changeLabel="all time"
          icon={<Briefcase className="h-6 w-6 text-indigo-600" />}
          trend={portfolioPnlPercent > 0 ? 'up' : portfolioPnlPercent < 0 ? 'down' : 'neutral'}
        />

        <StatsCard
          title="Paper Trading Account"
          value={formatCurrency(paperTradingValue)}
          change={paperTradingPnlPercent}
          changeLabel="from start"
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          trend={paperTradingPnlPercent > 0 ? 'up' : paperTradingPnlPercent < 0 ? 'down' : 'neutral'}
        />

        <StatsCard
          title="Win Rate"
          value={`${(paperTrading.win_rate || 0).toFixed(1)}%`}
          change={paperTrading.trades_count}
          changeLabel="total trades"
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          trend={paperTrading.win_rate > 50 ? 'up' : paperTrading.win_rate < 50 ? 'down' : 'neutral'}
        />

        <StatsCard
          title="Active Positions"
          value={portfolio.num_positions || portfolio.positions?.length || 0}
          icon={<Activity className="h-6 w-6 text-purple-600" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Watchlist */}
        <div>
          <WatchlistTable />
        </div>

        {/* Recent News */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent News</h3>
          </div>
          <div className="p-6">
            {news.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent news. Import news from the Market Data page.
              </p>
            ) : (
              <div className="space-y-4">
                {news.slice(0, 5).map((article: any) => (
                  <div key={article.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-50 dark:hover:bg-gray-700 -mx-2 -my-1 p-2 rounded transition-colors"
                    >
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {article.title}
                      </h4>
                      <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>{article.source}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDateTime(article.published_at)}</span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Positions */}
      <div>
        <PositionsTable />
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Portfolio Performance
        </h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Performance chart will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}