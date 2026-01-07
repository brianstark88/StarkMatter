import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Building2,
  BarChart3
} from 'lucide-react';
import { symbolAPI } from '../lib/api';
import SymbolSearch from '../components/SymbolSearch';
import { useNavigate } from 'react-router-dom';

interface Symbol {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  price?: number;
  price_date?: string;
}

const SymbolBrowser: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [sortField, setSortField] = useState<'symbol' | 'name' | 'exchange' | 'sector' | 'price'>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch symbols with filters
  const { data: symbolsData, isLoading } = useQuery({
    queryKey: ['symbols', currentPage, pageSize, selectedExchange, selectedSector],
    queryFn: async () => {
      const params: any = {
        offset: currentPage * pageSize,
        limit: pageSize
      };
      if (selectedExchange) params.exchange = selectedExchange;
      if (selectedSector) params.sector = selectedSector;

      return await symbolAPI.listSymbols(params);
    }
  });

  // Fetch available sectors
  const { data: sectorsData } = useQuery({
    queryKey: ['sectors'],
    queryFn: symbolAPI.getSectors
  });

  // Fetch available exchanges
  const { data: exchangesData } = useQuery({
    queryKey: ['exchanges'],
    queryFn: symbolAPI.getExchanges
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['symbolStats'],
    queryFn: symbolAPI.getSymbolStats
  });

  const symbols = symbolsData?.symbols || [];
  const total = symbolsData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Sort symbols client-side
  const sortedSymbols = [...symbols].sort((a, b) => {
    if (sortField === 'price') {
      const aPrice = a.price || 0;
      const bPrice = b.price || 0;
      return sortDirection === 'asc' ? aPrice - bPrice : bPrice - aPrice;
    }

    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';

    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSymbolClick = (symbol: string) => {
    navigate(`/trading?symbol=${symbol}`);
  };

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'bg-blue-900/30 text-blue-400',
      'Healthcare': 'bg-green-900/30 text-green-400',
      'Financial': 'bg-purple-900/30 text-purple-400',
      'Energy': 'bg-orange-900/30 text-orange-400',
      'Consumer Discretionary': 'bg-pink-900/30 text-pink-400',
      'Consumer Staples': 'bg-yellow-900/30 text-yellow-400',
      'Industrials': 'bg-gray-900/30 text-gray-400',
      'Communication': 'bg-indigo-900/30 text-indigo-400',
      'Real Estate': 'bg-red-900/30 text-red-400',
      'Materials': 'bg-amber-900/30 text-amber-400',
      'Utilities': 'bg-teal-900/30 text-teal-400',
      'Other': 'bg-slate-900/30 text-slate-400'
    };
    return colors[sector] || 'bg-slate-900/30 text-slate-400';
  };

  const getExchangeBadgeColor = (exchange: string) => {
    if (exchange.includes('NASDAQ')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (exchange.includes('NYSE')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return '—';
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Symbol Browser
              </h1>
              <p className="text-gray-400 mt-1">
                Browse and search through {total.toLocaleString()} available symbols
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SymbolSearch
                onSelectSymbol={handleSymbolClick}
                placeholder="Search symbols..."
                className="w-full"
              />
            </div>

            {/* Exchange Filter */}
            <select
              value={selectedExchange}
              onChange={(e) => {
                setSelectedExchange(e.target.value);
                setCurrentPage(0);
              }}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Exchanges</option>
              {exchangesData?.exchanges.map((exchange: string) => (
                <option key={exchange} value={exchange}>{exchange}</option>
              ))}
            </select>

            {/* Sector Filter */}
            <select
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                setCurrentPage(0);
              }}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sectors</option>
              {sectorsData?.sectors.map((sector: string) => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statsData && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Symbols</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {statsData.total_symbols.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Exchanges</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {statsData.by_exchange?.length || 0}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Sectors</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {sectorsData?.sectors?.length || 0}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th
                        className="px-6 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors"
                        onClick={() => handleSort('symbol')}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-300">Symbol</span>
                          <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-300">Name</span>
                          <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-300">Price</span>
                          <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors"
                        onClick={() => handleSort('exchange')}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-300">Exchange</span>
                          <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors"
                        onClick={() => handleSort('sector')}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-300">Sector</span>
                          <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <span className="font-semibold text-gray-300">Industry</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sortedSymbols.map((symbol: Symbol) => (
                      <tr
                        key={symbol.symbol}
                        onClick={() => handleSymbolClick(symbol.symbol)}
                        className="hover:bg-gray-800/30 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-blue-400">
                            {symbol.symbol}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {symbol.name || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white">
                            {formatPrice(symbol.price)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getExchangeBadgeColor(symbol.exchange)}`}>
                            {symbol.exchange}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {symbol.sector && symbol.sector !== 'Other' ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getSectorColor(symbol.sector)}`}>
                              {symbol.sector}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {symbol.industry || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-800/30 px-6 py-4 flex items-center justify-between border-t border-gray-800">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(0);
                    }}
                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <span>
                    Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, total)} of {total}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm flex items-center space-x-1 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <span className="px-4 py-2 text-sm text-gray-400">
                    Page {currentPage + 1} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm flex items-center space-x-1 transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymbolBrowser;