"""
Yahoo Finance Data Import Service
Fetches stock data using yfinance library (free, no API key required)
"""
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
import logging
from typing import List, Dict, Optional
import sys
import os
import pytz

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_many, execute_query

logger = logging.getLogger(__name__)

# Eastern Time timezone
EST = pytz.timezone('America/New_York')


class YahooFinanceService:
    """Service for fetching data from Yahoo Finance"""

    def __init__(self):
        self.source = "yahoo"

    def fetch_historical_data(self, symbol: str, period: str = "1mo") -> pd.DataFrame:
        """
        Fetch historical price data

        Args:
            symbol: Stock ticker symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

        Returns:
            DataFrame with OHLCV data
        """
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)

            if hist.empty:
                logger.warning(f"No data returned for {symbol}")
                return pd.DataFrame()

            logger.info(f"Fetched {len(hist)} days of data for {symbol}")
            return hist
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            return pd.DataFrame()

    def fetch_quote(self, symbol: str) -> Dict:
        """
        Get real-time quote

        Args:
            symbol: Stock ticker symbol

        Returns:
            Dictionary with current quote data
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            quote = {
                'symbol': symbol,
                'price': info.get('currentPrice') or info.get('regularMarketPrice'),
                'open': info.get('regularMarketOpen'),
                'high': info.get('regularMarketDayHigh'),
                'low': info.get('regularMarketDayLow'),
                'volume': info.get('regularMarketVolume'),
                'market_cap': info.get('marketCap'),
                'pe_ratio': info.get('trailingPE'),
                'dividend_yield': info.get('dividendYield'),
                'fifty_two_week_high': info.get('fiftyTwoWeekHigh'),
                'fifty_two_week_low': info.get('fiftyTwoWeekLow'),
            }

            logger.info(f"Fetched quote for {symbol}: ${quote['price']}")
            return quote
        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {e}")
            return {}

    def fetch_news(self, symbol: str) -> List[Dict]:
        """
        Get latest news for a symbol

        Args:
            symbol: Stock ticker symbol

        Returns:
            List of news articles
        """
        try:
            ticker = yf.Ticker(symbol)
            news = ticker.news

            articles = []
            for item in news[:10]:  # Limit to 10 articles
                # Convert timestamp to EST
                timestamp = item.get('providerPublishTime', 0)
                published_utc = datetime.fromtimestamp(timestamp, tz=pytz.UTC)
                published_est = published_utc.astimezone(EST)

                articles.append({
                    'title': item.get('title'),
                    'publisher': item.get('publisher'),
                    'link': item.get('link'),
                    'published': published_est,
                    'symbol': symbol
                })

            logger.info(f"Fetched {len(articles)} news articles for {symbol}")
            return articles
        except Exception as e:
            logger.error(f"Error fetching news for {symbol}: {e}")
            return []

    def save_to_database(self, symbol: str, df: pd.DataFrame):
        """
        Save historical data to database

        Args:
            symbol: Stock ticker symbol
            df: DataFrame with historical data
        """
        if df.empty:
            logger.warning(f"No data to save for {symbol}")
            return

        try:
            # Prepare data for insertion
            rows = []
            for date, row in df.iterrows():
                rows.append((
                    symbol,
                    date.strftime('%Y-%m-%d'),
                    float(row.get('Open', 0)) if pd.notna(row.get('Open')) else None,
                    float(row.get('High', 0)) if pd.notna(row.get('High')) else None,
                    float(row.get('Low', 0)) if pd.notna(row.get('Low')) else None,
                    float(row.get('Close', 0)) if pd.notna(row.get('Close')) else None,
                    float(row.get('Close', 0)) if pd.notna(row.get('Close')) else None,  # adj_close
                    int(row.get('Volume', 0)) if pd.notna(row.get('Volume')) else 0,
                    self.source
                ))

            # Insert into database
            query = """
                INSERT OR REPLACE INTO market_data
                (symbol, date, open, high, low, close, adj_close, volume, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            execute_many(query, rows)

            logger.info(f"Saved {len(rows)} rows for {symbol} to database")
        except Exception as e:
            logger.error(f"Error saving data for {symbol}: {e}")

    def bulk_import(self, symbols: List[str], period: str = "1mo") -> Dict[str, any]:
        """
        Import data for multiple symbols

        Args:
            symbols: List of stock ticker symbols
            period: Time period to fetch

        Returns:
            Dictionary with import results
        """
        results = {
            'success': [],
            'failed': [],
            'total_rows': 0
        }

        for symbol in symbols:
            try:
                logger.info(f"Importing {symbol}...")

                # Fetch historical data
                hist = self.fetch_historical_data(symbol, period)

                if not hist.empty:
                    # Save to database
                    self.save_to_database(symbol, hist)

                    # Fetch and save news
                    news = self.fetch_news(symbol)
                    if news:
                        self._save_news(news)

                    results['success'].append(symbol)
                    results['total_rows'] += len(hist)
                else:
                    results['failed'].append(symbol)

            except Exception as e:
                logger.error(f"Error importing {symbol}: {e}")
                results['failed'].append(symbol)

        logger.info(f"Bulk import complete: {len(results['success'])} succeeded, {len(results['failed'])} failed")
        return results

    def _save_news(self, articles: List[Dict]):
        """Save news articles to database"""
        try:
            rows = []
            for article in articles:
                rows.append((
                    article['title'],
                    article.get('publisher'),
                    article.get('link'),
                    None,  # summary
                    article.get('symbol'),
                    None,  # sentiment_score (to be calculated later)
                    article['published'].strftime('%Y-%m-%d %H:%M:%S')
                ))

            query = """
                INSERT OR IGNORE INTO news
                (title, source, url, summary, symbols, sentiment_score, published_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            execute_many(query, rows)

            logger.info(f"Saved {len(rows)} news articles to database")
        except Exception as e:
            logger.error(f"Error saving news: {e}")


# Test function
if __name__ == "__main__":
    service = YahooFinanceService()

    # Test single symbol
    print("Testing Yahoo Finance Service...")
    data = service.fetch_historical_data("AAPL", "5d")
    print(f"Fetched {len(data)} days of data for AAPL")
    print(data.head())

    # Test quote
    quote = service.fetch_quote("AAPL")
    print(f"Current AAPL price: ${quote.get('price')}")
