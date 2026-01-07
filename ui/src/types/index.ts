// Type definitions for the StarkMatter Trading Platform

export interface MarketData {
  id: number;
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adj_close: number;
  volume: number;
  source: string;
  created_at: string;
}

export interface Quote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  market_cap: number;
  pe_ratio: number;
  dividend_yield: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  change: number;
  change_percent: number;
}

export interface Position {
  id: number;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: number;
  symbol: string;
  order_type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total_amount: number;
  executed_at: string;
  notes?: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  content?: string;
  url: string;
  source: string;
  published_at: string;
  sentiment_score?: number;
  symbols?: string[];
}

export interface TechnicalSignal {
  symbol: string;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  sma_20: number;
  sma_50: number;
  ema_12: number;
  ema_26: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
}

export interface PortfolioSummary {
  total_value: number;
  total_cost: number;
  total_pnl: number;
  total_pnl_percent: number;
  positions: Position[];
  cash_balance: number;
  day_change: number;
  day_change_percent: number;
}

export interface PaperAccount {
  cash_balance: number;
  positions_value: number;
  total_value: number;
  total_pnl: number;
  total_pnl_percent: number;
  trades_count: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  added_at: string;
}

export interface RedditSentiment {
  id: number;
  symbol: string;
  subreddit: string;
  mentions: number;
  sentiment_score: number;
  bullish_count: number;
  bearish_count: number;
  created_at: string;
}

export interface EconomicIndicator {
  id: number;
  series_id: string;
  name: string;
  value: number;
  unit: string;
  date: string;
  source: string;
}