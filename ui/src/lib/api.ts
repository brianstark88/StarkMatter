import axios from 'axios';
import type {
  MarketData,
  Quote,
  Position,
  Trade,
  NewsArticle,
  TechnicalSignal,
  PortfolioSummary,
  PaperAccount,
  WatchlistItem,
  RedditSentiment,
  EconomicIndicator
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Market Data APIs
export const marketAPI = {
  importDaily: async (symbols?: string[]) => {
    const params = symbols ? { symbols: symbols.join(',') } : {};
    return apiClient.post('/api/market/import/daily', null, { params });
  },

  getQuote: async (symbol: string): Promise<Quote> => {
    const { data } = await apiClient.get(`/api/market/quote/${symbol}`);
    return data;
  },

  getHistorical: async (symbol: string, days = 30): Promise<any> => {
    const { data } = await apiClient.get(`/api/market/historical/${symbol}`, { params: { days } });
    // API returns {symbol, data: [...]} format
    return data;
  },

  getSignals: async (symbol: string): Promise<TechnicalSignal> => {
    const { data } = await apiClient.get(`/api/market/signals/${symbol}`);
    return data;
  },

  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const { data } = await apiClient.get('/api/market/watchlist');
    return data;
  },

  addToWatchlist: async (symbol: string) => {
    return apiClient.post(`/api/market/watchlist/${symbol}`);
  },

  removeFromWatchlist: async (symbol: string) => {
    return apiClient.delete(`/api/market/watchlist/${symbol}`);
  },

  importNews: async () => {
    return apiClient.post('/api/market/import/news');
  },

  getNews: async (limit = 20): Promise<NewsArticle[]> => {
    const { data } = await apiClient.get('/api/market/news', { params: { limit } });
    // Backend returns {count, articles}, extract the articles array
    return Array.isArray(data) ? data : (data?.articles || []);
  },

  importReddit: async (subreddits?: string[]) => {
    const params = subreddits ? { subreddits: subreddits.join(',') } : {};
    return apiClient.post('/api/market/import/reddit', null, { params });
  },

  getSentiment: async (symbol?: string): Promise<RedditSentiment[]> => {
    try {
      const { data } = await apiClient.get('/api/market/sentiment', { params: { symbol } });
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // Handle 404 gracefully - endpoint might not exist yet
      if (error?.response?.status === 404) {
        console.warn('Sentiment endpoint not available');
        return [];
      }
      throw error;
    }
  },

  importEconomic: async () => {
    return apiClient.post('/api/market/import/economic');
  },

  getEconomicData: async (): Promise<EconomicIndicator[]> => {
    const { data } = await apiClient.get('/api/market/economic');
    return data;
  },
};

// Portfolio APIs
export const portfolioAPI = {
  getSummary: async (): Promise<PortfolioSummary> => {
    const { data } = await apiClient.get('/api/portfolio');
    return data;
  },

  getPositions: async (): Promise<Position[]> => {
    const { data } = await apiClient.get('/api/portfolio/positions');
    // Backend returns {count, positions}, extract the positions array
    return Array.isArray(data) ? data : (data?.positions || []);
  },

  getPosition: async (symbol: string): Promise<Position> => {
    const { data } = await apiClient.get(`/api/portfolio/positions/${symbol}`);
    return data;
  },

  addPosition: async (position: { symbol: string; quantity: number; price: number }) => {
    return apiClient.post('/api/portfolio/positions', position);
  },

  updatePosition: async (symbol: string, updates: Partial<Position>) => {
    return apiClient.put(`/api/portfolio/positions/${symbol}`, updates);
  },

  deletePosition: async (symbol: string) => {
    return apiClient.delete(`/api/portfolio/positions/${symbol}`);
  },
};

// Paper Trading APIs
export const paperTradingAPI = {
  getAccount: async (): Promise<PaperAccount> => {
    const { data } = await apiClient.get('/api/portfolio/paper/account');
    return data;
  },

  getPerformance: async () => {
    const { data } = await apiClient.get('/api/portfolio/paper/performance');
    return data;
  },

  executeTrade: async (trade: { symbol: string; quantity: number; order_type: 'BUY' | 'SELL' }) => {
    const { data } = await apiClient.post('/api/portfolio/paper/trade', trade);
    return data;
  },

  getTrades: async (limit = 50): Promise<Trade[]> => {
    const { data } = await apiClient.get('/api/portfolio/paper/trades', { params: { limit } });
    // Backend returns {count, trades}, extract the trades array
    return Array.isArray(data) ? data : (data?.trades || []);
  },

  resetAccount: async () => {
    return apiClient.post('/api/portfolio/paper/reset');
  },
};

// Dashboard API
export const dashboardAPI = {
  getSummary: async () => {
    const { data } = await apiClient.get('/api/dashboard');
    return data;
  },
};

// Health Check
export const healthAPI = {
  check: async () => {
    const { data } = await apiClient.get('/health');
    return data;
  },
};

// Re-export consolidated API object
export const api = {
  ...marketAPI,
  ...portfolioAPI,
  ...paperTradingAPI,
  ...dashboardAPI,
  ...healthAPI,
  getMarketOverview: async () => {
    try {
      const response = await apiClient.get('/api/market/overview');
      return response.data;
    } catch (error) {
      // Return mock data for now
      return { indices: [], movers: [] };
    }
  },
  getHistoricalData: async (symbol: string, period = '1mo'): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/api/market/historical/${symbol}`);
      // Convert data to chart format
      return response.data.map((item: any) => ({
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
  }
};