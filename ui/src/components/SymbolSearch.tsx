import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { symbolAPI } from '../lib/api';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface SymbolSearchProps {
  onSelectSymbol: (symbol: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
}

const SymbolSearch: React.FC<SymbolSearchProps> = ({
  onSelectSymbol,
  placeholder = "Search symbols...",
  className = "",
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 1) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await symbolAPI.searchSymbols(searchQuery, 10);
        setResults(response.symbols || []);
      } catch (error) {
        console.error('Symbol search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSymbol = (symbol: string) => {
    onSelectSymbol(symbol);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectSymbol(results[selectedIndex].symbol);
        } else if (results.length > 0) {
          handleSelectSymbol(results[0].symbol);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'text-blue-400',
      'Healthcare': 'text-green-400',
      'Financial': 'text-purple-400',
      'Energy': 'text-orange-400',
      'Consumer Discretionary': 'text-pink-400',
      'Consumer Staples': 'text-yellow-400',
      'Industrials': 'text-gray-400',
      'Communication': 'text-indigo-400',
      'Real Estate': 'text-red-400',
      'Materials': 'text-amber-400',
      'Utilities': 'text-teal-400',
      'Other': 'text-gray-500'
    };
    return colors[sector] || 'text-gray-500';
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (query || results.length > 0) && (
        <div className="absolute top-full mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((result, index) => (
                <button
                  key={result.symbol}
                  onClick={() => handleSelectSymbol(result.symbol)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 hover:bg-gray-800 flex items-start space-x-3 transition-colors ${
                    selectedIndex === index ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {result.symbol}
                      </span>
                      <span className="text-xs text-gray-500">
                        {result.exchange}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {result.name || 'No description'}
                    </div>
                    {result.sector && result.sector !== 'Other' && (
                      <div className={`text-xs mt-1 ${getSectorColor(result.sector)}`}>
                        {result.sector}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="p-4 text-center text-gray-500">
              No symbols found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SymbolSearch;