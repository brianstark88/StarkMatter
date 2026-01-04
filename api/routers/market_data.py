"""
Market Data Router
Endpoints for importing and accessing market data
"""
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import date, datetime
import logging
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.yahoo_import import YahooFinanceService
from services.news_aggregator import NewsAggregator
from services.reddit_scraper import RedditScraper
from services.fred_import import FREDService
from services.technical_analysis import TechnicalAnalysisService
from database import execute_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/market", tags=["market"])


@router.post("/import/daily")
async def import_daily_data(symbols: Optional[List[str]] = Query(default=None)):
    """
    Import daily market data for specified symbols

    Args:
        symbols: List of ticker symbols (defaults to watchlist if not provided)

    Returns:
        Import results summary
    """
    try:
        # Get default symbols if not provided
        if not symbols:
            default_symbols = os.getenv('DEFAULT_SYMBOLS', 'AAPL,GOOGL,MSFT,NVDA,TSLA,SPY,QQQ')
            symbols = [s.strip() for s in default_symbols.split(',')]

        logger.info(f"Starting import for {len(symbols)} symbols")

        # Import from Yahoo Finance
        yahoo_service = YahooFinanceService()
        results = yahoo_service.bulk_import(symbols, period="1mo")

        return {
            "status": "success",
            "symbols_requested": len(symbols),
            "symbols_imported": len(results['success']),
            "symbols_failed": len(results['failed']),
            "total_rows": results['total_rows'],
            "success": results['success'],
            "failed": results['failed']
        }

    except Exception as e:
        logger.error(f"Error importing daily data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """
    Get latest quote for a symbol

    Args:
        symbol: Stock ticker symbol

    Returns:
        Current quote data
    """
    try:
        yahoo_service = YahooFinanceService()
        quote = yahoo_service.fetch_quote(symbol)

        if not quote:
            raise HTTPException(status_code=404, detail=f"No quote data found for {symbol}")

        return quote

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/historical/{symbol}")
async def get_historical(
    symbol: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(default=100, le=1000)
):
    """
    Get historical price data for a symbol

    Args:
        symbol: Stock ticker symbol
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        limit: Maximum number of days to return

    Returns:
        Historical OHLCV data
    """
    try:
        query = """
            SELECT date, open, high, low, close, adj_close, volume
            FROM market_data
            WHERE symbol = ?
        """

        params = [symbol]

        if start_date:
            query += " AND date >= ?"
            params.append(start_date.strftime('%Y-%m-%d'))

        if end_date:
            query += " AND date <= ?"
            params.append(end_date.strftime('%Y-%m-%d'))

        query += " ORDER BY date DESC LIMIT ?"
        params.append(limit)

        results = execute_query(query, tuple(params), fetch='all')

        if not results:
            raise HTTPException(status_code=404, detail=f"No historical data found for {symbol}")

        return {
            "symbol": symbol,
            "data": results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/news")
async def import_news(limit_per_source: int = Query(default=10, le=50)):
    """
    Import latest financial news from RSS feeds

    Args:
        limit_per_source: Number of articles per source

    Returns:
        Import results
    """
    try:
        aggregator = NewsAggregator()
        articles = aggregator.fetch_and_save(limit_per_source)

        return {
            "status": "success",
            "articles_imported": len(articles),
            "latest_headlines": [
                {
                    "title": a['title'],
                    "source": a['source'],
                    "published": a['published'].isoformat()
                }
                for a in articles[:5]
            ]
        }

    except Exception as e:
        logger.error(f"Error importing news: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/news")
async def get_news(limit: int = Query(default=20, le=100)):
    """
    Get latest news articles

    Args:
        limit: Maximum number of articles

    Returns:
        List of news articles
    """
    try:
        query = """
            SELECT * FROM news
            ORDER BY published_at DESC
            LIMIT ?
        """

        results = execute_query(query, (limit,), fetch='all')

        return {
            "count": len(results) if results else 0,
            "articles": results if results else []
        }

    except Exception as e:
        logger.error(f"Error fetching news: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/reddit")
async def import_reddit(
    subreddits: Optional[List[str]] = Query(default=None),
    limit_per_sub: int = Query(default=50, le=100)
):
    """
    Scrape Reddit for stock mentions

    Args:
        subreddits: List of subreddit names
        limit_per_sub: Posts per subreddit

    Returns:
        Import results with trending tickers
    """
    try:
        scraper = RedditScraper()

        if not scraper.reddit:
            return {
                "status": "skipped",
                "message": "Reddit API not configured"
            }

        if not subreddits:
            subreddits = ['wallstreetbets', 'stocks', 'investing']

        mentions = scraper.scrape_multiple_subreddits(subreddits, limit_per_sub)
        scraper.save_to_database(mentions)

        trending = scraper.get_trending_tickers(mentions, min_mentions=3)

        return {
            "status": "success",
            "total_mentions": len(mentions),
            "trending_tickers": trending
        }

    except Exception as e:
        logger.error(f"Error importing Reddit data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/economic")
async def import_economic():
    """
    Import economic indicators from FRED

    Returns:
        Import results
    """
    try:
        fred_service = FREDService()

        if not fred_service.fred:
            return {
                "status": "skipped",
                "message": "FRED API not configured"
            }

        indicators = fred_service.fetch_all_indicators()
        fred_service.save_to_database(indicators)

        latest = fred_service.get_latest_indicators()

        return {
            "status": "success",
            "indicators_imported": len(indicators),
            "latest_values": latest
        }

    except Exception as e:
        logger.error(f"Error importing economic data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/signals/{symbol}")
async def get_signals(symbol: str):
    """
    Get technical analysis signals for a symbol

    Args:
        symbol: Stock ticker symbol

    Returns:
        Buy/sell signals based on technical indicators
    """
    try:
        ta_service = TechnicalAnalysisService()
        signals = ta_service.find_signals(symbol)

        # Save signals to database
        if signals:
            ta_service.save_signals(symbol, signals)

        return {
            "symbol": symbol,
            "signals": signals,
            "count": len(signals)
        }

    except Exception as e:
        logger.error(f"Error getting signals for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sentiment")
async def get_sentiment(symbol: Optional[str] = Query(default=None)):
    """
    Get Reddit sentiment data for symbols
    
    Args:
        symbol: Optional symbol to filter by
    
    Returns:
        List of sentiment data aggregated by symbol
    """
    try:
        if symbol:
            query = """
                SELECT 
                    symbol,
                    subreddit,
                    COUNT(*) as mentions,
                    AVG(sentiment_score) as sentiment_score,
                    SUM(CASE WHEN sentiment_score > 0 THEN 1 ELSE 0 END) as bullish_count,
                    SUM(CASE WHEN sentiment_score < 0 THEN 1 ELSE 0 END) as bearish_count,
                    MAX(created_at) as created_at
                FROM reddit_mentions
                WHERE symbol = ?
                GROUP BY symbol, subreddit
                ORDER BY mentions DESC
                LIMIT 50
            """
            results = execute_query(query, (symbol,), fetch='all')
        else:
            query = """
                SELECT 
                    symbol,
                    subreddit,
                    COUNT(*) as mentions,
                    AVG(sentiment_score) as sentiment_score,
                    SUM(CASE WHEN sentiment_score > 0 THEN 1 ELSE 0 END) as bullish_count,
                    SUM(CASE WHEN sentiment_score < 0 THEN 1 ELSE 0 END) as bearish_count,
                    MAX(created_at) as created_at
                FROM reddit_mentions
                GROUP BY symbol, subreddit
                ORDER BY mentions DESC
                LIMIT 50
            """
            results = execute_query(query, fetch='all')
        
        if not results:
            return []
        
        # Format results to match expected structure
        sentiment_data = []
        for idx, row in enumerate(results):
            # Use index + hash to create a positive ID
            row_id = abs(hash(f"{row['symbol']}_{row['subreddit']}")) % (10**9)
            sentiment_data.append({
                "id": row_id,
                "symbol": row['symbol'],
                "subreddit": row['subreddit'],
                "mentions": row['mentions'],
                "sentiment_score": float(row['sentiment_score']) if row['sentiment_score'] is not None else 0.0,
                "bullish_count": int(row['bullish_count']) if row['bullish_count'] is not None else 0,
                "bearish_count": int(row['bearish_count']) if row['bearish_count'] is not None else 0,
                "created_at": row['created_at']
            })
        
        return sentiment_data
    
    except Exception as e:
        logger.error(f"Error fetching sentiment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/watchlist")
async def get_watchlist():
    """Get symbols in watchlist"""
    try:
        query = "SELECT * FROM watchlist ORDER BY symbol"
        results = execute_query(query, fetch='all')

        return {
            "count": len(results) if results else 0,
            "symbols": results if results else []
        }

    except Exception as e:
        logger.error(f"Error fetching watchlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/watchlist/{symbol}")
async def add_to_watchlist(symbol: str, notes: Optional[str] = None):
    """Add symbol to watchlist"""
    try:
        query = """
            INSERT OR IGNORE INTO watchlist (symbol, notes)
            VALUES (?, ?)
        """
        execute_query(query, (symbol.upper(), notes))

        return {
            "status": "success",
            "symbol": symbol.upper()
        }

    except Exception as e:
        logger.error(f"Error adding {symbol} to watchlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/watchlist/{symbol}")
async def remove_from_watchlist(symbol: str):
    """Remove symbol from watchlist"""
    try:
        query = "DELETE FROM watchlist WHERE symbol = ?"
        execute_query(query, (symbol.upper(),))

        return {
            "status": "success",
            "symbol": symbol.upper()
        }

    except Exception as e:
        logger.error(f"Error removing {symbol} from watchlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))
