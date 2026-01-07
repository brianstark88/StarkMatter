"""
Data Formatter for AI Analysis
Formats market data, indicators, news, and other data sources for prompt injection
Implements token budgeting and data summarization strategies
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database import execute_query
from services.technical_analysis import TechnicalAnalysisService
from services.news_aggregator import NewsAggregator
from services.reddit_scraper import RedditScraper
from services.portfolio import PortfolioService

logger = logging.getLogger(__name__)


class DataFormatter:
    """Formats data from various sources for AI prompt injection"""

    def __init__(self):
        self.technical_service = TechnicalAnalysisService()
        self.news_service = NewsAggregator()
        self.reddit_service = RedditScraper()
        self.portfolio_service = PortfolioService()

    def format_market_data(
        self,
        symbol: str,
        days: int = 30,
        token_budget: int = 500
    ) -> str:
        """
        Format OHLCV market data within token budget

        Args:
            symbol: Stock symbol
            days: Number of days to retrieve
            token_budget: Maximum tokens to use

        Returns:
            Formatted market data string
        """
        try:
            # Fetch market data
            query = """
                SELECT date, open, high, low, close, volume
                FROM market_data
                WHERE symbol = ?
                ORDER BY date DESC
                LIMIT ?
            """
            rows = execute_query(query, (symbol, days), fetch='all')

            if not rows:
                return f"**Market Data:** No price data available for {symbol}"

            # Reverse to chronological order
            rows = list(reversed(rows))

            # Strategy based on token budget
            if token_budget < 200:
                return self._statistical_summary(symbol, rows)
            elif token_budget < 400:
                return self._key_points_summary(symbol, rows)
            else:
                return self._weekly_aggregation(symbol, rows)

        except Exception as e:
            logger.error(f"Error formatting market data for {symbol}: {e}")
            return f"**Market Data:** Error retrieving data for {symbol}"

    def _statistical_summary(self, symbol: str, rows: List[Dict]) -> str:
        """Ultra-compact statistical summary (~100 tokens)"""
        if not rows:
            return f"**{symbol}:** No data"

        start_price = rows[0]['close']
        end_price = rows[-1]['close']
        high = max(r['high'] for r in rows)
        low = min(r['low'] for r in rows)
        avg_volume = sum(r['volume'] or 0 for r in rows) / len(rows)
        change_pct = ((end_price - start_price) / start_price) * 100

        trend = "Uptrend" if change_pct > 5 else "Downtrend" if change_pct < -5 else "Sideways"

        return f"""**{len(rows)}-Day Summary for {symbol}:**
- Period: {rows[0]['date']} to {rows[-1]['date']}
- Change: ${start_price:.2f} → ${end_price:.2f} ({change_pct:+.1f}%)
- Range: ${low:.2f} (low) to ${high:.2f} (high)
- Avg Volume: {avg_volume:,.0f}
- Trend: {trend}"""

    def _key_points_summary(self, symbol: str, rows: List[Dict]) -> str:
        """Key inflection points (~250 tokens)"""
        if not rows:
            return f"**{symbol}:** No data"

        lines = [f"**Recent Price Action for {symbol}:**"]

        # Recent performance
        start_price = rows[0]['close']
        end_price = rows[-1]['close']
        change_pct = ((end_price - start_price) / start_price) * 100

        lines.append(f"- {len(rows)}-day change: ${start_price:.2f} → ${end_price:.2f} ({change_pct:+.1f}%)")

        # Find high and low points
        high_idx = max(range(len(rows)), key=lambda i: rows[i]['high'])
        low_idx = max(range(len(rows)), key=lambda i: -rows[i]['low'])

        lines.append(f"- High: ${rows[high_idx]['high']:.2f} on {rows[high_idx]['date']}")
        lines.append(f"- Low: ${rows[low_idx]['low']:.2f} on {rows[low_idx]['date']}")

        # Current position
        current = rows[-1]
        lines.append(f"- Current: ${current['close']:.2f} (as of {current['date']})")

        # Recent volatility
        recent_5 = rows[-5:] if len(rows) >= 5 else rows
        volatility = max(r['high'] for r in recent_5) - min(r['low'] for r in recent_5)
        vol_pct = (volatility / recent_5[0]['close']) * 100
        lines.append(f"- Recent 5-day volatility: {vol_pct:.1f}%")

        return "\n".join(lines)

    def _weekly_aggregation(self, symbol: str, rows: List[Dict]) -> str:
        """Weekly OHLCV bars (~400 tokens)"""
        if not rows:
            return f"**{symbol}:** No data"

        # Group by week
        from collections import defaultdict
        import datetime as dt

        weekly = defaultdict(list)
        for row in rows:
            date = dt.datetime.strptime(row['date'], '%Y-%m-%d')
            week_start = date - dt.timedelta(days=date.weekday())
            week_key = week_start.strftime('%Y-%m-%d')
            weekly[week_key].append(row)

        lines = [f"**Weekly Price Data for {symbol}:**"]
        lines.append("| Week | Open | High | Low | Close | Change |")
        lines.append("|------|------|------|-----|-------|--------|")

        for week_start in sorted(weekly.keys()):
            week_data = weekly[week_start]
            week_open = week_data[0]['open']
            week_high = max(d['high'] for d in week_data)
            week_low = min(d['low'] for d in week_data)
            week_close = week_data[-1]['close']
            change = ((week_close - week_open) / week_open) * 100

            lines.append(
                f"| {week_start} | ${week_open:.2f} | ${week_high:.2f} | "
                f"${week_low:.2f} | ${week_close:.2f} | {change:+.1f}% |"
            )

        return "\n".join(lines)

    def format_technical_indicators(
        self,
        symbol: str,
        token_budget: int = 300
    ) -> str:
        """
        Format technical indicators with interpretation

        Args:
            symbol: Stock symbol
            token_budget: Maximum tokens to use

        Returns:
            Formatted indicators string
        """
        try:
            # Get latest indicators
            indicators = self.technical_service.calculate_indicators(symbol)

            if not indicators:
                return f"**Technical Indicators:** No indicator data available for {symbol}"

            lines = [f"**Technical Indicators for {symbol}:**"]

            # RSI
            rsi = indicators.get('rsi')
            if rsi:
                rsi_status = "OVERSOLD" if rsi < 30 else "OVERBOUGHT" if rsi > 70 else "neutral"
                lines.append(f"- RSI(14): {rsi:.1f} ({rsi_status})")

            # MACD
            macd = indicators.get('macd')
            macd_signal = indicators.get('macd_signal')
            if macd is not None and macd_signal is not None:
                macd_hist = macd - macd_signal
                macd_status = "bullish crossover" if macd_hist > 0 else "bearish crossover"
                lines.append(f"- MACD: {macd:.2f} / Signal: {macd_signal:.2f} ({macd_status})")

            # Moving Averages
            price = indicators.get('current_price', 0)
            sma_20 = indicators.get('sma_20')
            sma_50 = indicators.get('sma_50')
            sma_200 = indicators.get('sma_200')

            if sma_20:
                lines.append(f"- SMA(20): ${sma_20:.2f} (price {'above' if price > sma_20 else 'below'})")
            if sma_50:
                lines.append(f"- SMA(50): ${sma_50:.2f} (price {'above' if price > sma_50 else 'below'})")
            if sma_200:
                lines.append(f"- SMA(200): ${sma_200:.2f} (price {'above' if price > sma_200 else 'below'})")

            # Bollinger Bands
            bb_upper = indicators.get('bb_upper')
            bb_lower = indicators.get('bb_lower')
            if bb_upper and bb_lower:
                if price > bb_upper:
                    bb_position = "above upper band (overbought)"
                elif price < bb_lower:
                    bb_position = "below lower band (oversold)"
                else:
                    bb_position = "within bands (normal)"
                lines.append(f"- Bollinger Bands: ${bb_lower:.2f} - ${bb_upper:.2f} (price {bb_position})")

            return "\n".join(lines)

        except Exception as e:
            logger.error(f"Error formatting indicators for {symbol}: {e}")
            return f"**Technical Indicators:** Error calculating indicators for {symbol}"

    def format_news_summary(
        self,
        symbol: str,
        limit: int = 10,
        token_budget: int = 400
    ) -> str:
        """
        Format recent news with sentiment

        Args:
            symbol: Stock symbol
            limit: Maximum number of articles
            token_budget: Maximum tokens to use

        Returns:
            Formatted news string
        """
        try:
            # Query news mentioning this symbol
            query = """
                SELECT title, source, published_at, sentiment_score
                FROM news
                WHERE symbols LIKE ?
                ORDER BY published_at DESC
                LIMIT ?
            """
            news = execute_query(query, (f'%{symbol}%', limit), fetch='all')

            if not news:
                return f"**News:** No recent news available for {symbol}"

            lines = [f"**Recent News Headlines for {symbol}:**"]

            for article in news:
                # Truncate headline if needed
                headline = article['title']
                if len(headline) > 80:
                    headline = headline[:77] + "..."

                # Sentiment indicator
                sentiment = article.get('sentiment_score', 0)
                sentiment_label = "+" if sentiment > 0.2 else "-" if sentiment < -0.2 else "~"

                # Format date
                pub_date = article.get('published_at', '')
                if pub_date:
                    try:
                        date_obj = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                        date_str = date_obj.strftime('%Y-%m-%d')
                    except:
                        date_str = pub_date[:10]
                else:
                    date_str = "recent"

                lines.append(f"- [{sentiment_label}] {date_str}: {headline}")

            # Aggregate sentiment
            sentiments = [a.get('sentiment_score', 0) for a in news if a.get('sentiment_score') is not None]
            if sentiments:
                avg_sentiment = sum(sentiments) / len(sentiments)
                sentiment_summary = "BULLISH" if avg_sentiment > 0.3 else "BEARISH" if avg_sentiment < -0.3 else "NEUTRAL"
                lines.append(f"\n**Overall Sentiment:** {sentiment_summary} (score: {avg_sentiment:.2f})")

            return "\n".join(lines)

        except Exception as e:
            logger.error(f"Error formatting news for {symbol}: {e}")
            return f"**News:** Error retrieving news for {symbol}"

    def format_reddit_sentiment(
        self,
        symbol: str,
        token_budget: int = 200
    ) -> str:
        """
        Format Reddit sentiment data

        Args:
            symbol: Stock symbol
            token_budget: Maximum tokens to use

        Returns:
            Formatted Reddit sentiment string
        """
        try:
            # Query recent Reddit mentions
            query = """
                SELECT title, subreddit, score, num_comments, sentiment_score, created_at
                FROM reddit_mentions
                WHERE symbol = ?
                ORDER BY created_at DESC
                LIMIT 10
            """
            mentions = execute_query(query, (symbol,), fetch='all')

            if not mentions:
                return f"**Reddit Sentiment:** No recent mentions found for {symbol}"

            lines = [f"**Reddit Mentions for {symbol}:**"]

            # Top posts
            top_posts = sorted(mentions, key=lambda x: x.get('score', 0), reverse=True)[:3]
            for post in top_posts:
                title = post['title'][:60] + "..." if len(post['title']) > 60 else post['title']
                score = post.get('score', 0)
                subreddit = post.get('subreddit', 'unknown')
                lines.append(f"- r/{subreddit}: {title} ({score} upvotes)")

            # Aggregate sentiment
            sentiments = [m.get('sentiment_score', 0) for m in mentions if m.get('sentiment_score') is not None]
            if sentiments:
                avg_sentiment = sum(sentiments) / len(sentiments)
                sentiment_summary = "BULLISH" if avg_sentiment > 0.3 else "BEARISH" if avg_sentiment < -0.3 else "NEUTRAL"
                lines.append(f"\n**Overall Reddit Sentiment:** {sentiment_summary} (avg: {avg_sentiment:.2f})")
            else:
                lines.append(f"\n**Overall Reddit Sentiment:** No sentiment data available")

            lines.append(f"**Total Mentions:** {len(mentions)} posts in last 7 days")

            return "\n".join(lines)

        except Exception as e:
            logger.error(f"Error formatting Reddit sentiment for {symbol}: {e}")
            return f"**Reddit Sentiment:** Error retrieving data for {symbol}"

    def format_portfolio_data(self, token_budget: int = 300) -> str:
        """
        Format current portfolio positions

        Args:
            token_budget: Maximum tokens to use

        Returns:
            Formatted portfolio string
        """
        try:
            positions = self.portfolio_service.get_positions()

            if not positions:
                return "**Portfolio:** No positions currently held"

            lines = ["**Current Portfolio Positions:**"]
            lines.append("| Symbol | Quantity | Avg Cost | Current Price | P/L % |")
            lines.append("|--------|----------|----------|---------------|-------|")

            for position in positions:
                symbol = position['symbol']
                quantity = position['quantity']
                avg_cost = position['average_cost']

                # Get current price
                current_price = self._get_current_price(symbol)
                if current_price:
                    pl_pct = ((current_price - avg_cost) / avg_cost) * 100
                    lines.append(
                        f"| {symbol} | {quantity:.2f} | ${avg_cost:.2f} | "
                        f"${current_price:.2f} | {pl_pct:+.1f}% |"
                    )
                else:
                    lines.append(f"| {symbol} | {quantity:.2f} | ${avg_cost:.2f} | N/A | N/A |")

            # Total value
            total_value = sum(
                p['quantity'] * (self._get_current_price(p['symbol']) or p['average_cost'])
                for p in positions
            )
            lines.append(f"\n**Total Portfolio Value:** ${total_value:,.2f}")

            return "\n".join(lines)

        except Exception as e:
            logger.error(f"Error formatting portfolio data: {e}")
            return "**Portfolio:** Error retrieving portfolio data"

    def _get_current_price(self, symbol: str) -> Optional[float]:
        """Get most recent closing price for a symbol"""
        query = """
            SELECT close
            FROM market_data
            WHERE symbol = ?
            ORDER BY date DESC
            LIMIT 1
        """
        result = execute_query(query, (symbol,), fetch='one')
        return result['close'] if result else None

    def prepare_analysis_context(
        self,
        symbol: str,
        includes: List[str],
        token_budgets: Optional[Dict[str, int]] = None
    ) -> Dict[str, str]:
        """
        Prepare complete analysis context with all requested data

        Args:
            symbol: Stock symbol
            includes: List of data types to include
                     (market_data, indicators, news, reddit, portfolio)
            token_budgets: Optional custom token budgets per data type

        Returns:
            Dictionary with all formatted data
        """
        if token_budgets is None:
            token_budgets = {
                'market_data': 500,
                'indicators': 300,
                'news': 400,
                'reddit': 200,
                'portfolio': 300
            }

        context = {'symbol': symbol}

        if 'market_data' in includes or 'price_data' in includes:
            context['price_data'] = self.format_market_data(
                symbol,
                days=30,
                token_budget=token_budgets.get('market_data', 500)
            )

        if 'indicators' in includes or 'technical_indicators' in includes:
            context['indicators'] = self.format_technical_indicators(
                symbol,
                token_budget=token_budgets.get('indicators', 300)
            )

        if 'news' in includes:
            context['news_summary'] = self.format_news_summary(
                symbol,
                limit=10,
                token_budget=token_budgets.get('news', 400)
            )

        if 'reddit' in includes:
            context['reddit_sentiment'] = self.format_reddit_sentiment(
                symbol,
                token_budget=token_budgets.get('reddit', 200)
            )

        if 'portfolio' in includes:
            context['portfolio_data'] = self.format_portfolio_data(
                token_budget=token_budgets.get('portfolio', 300)
            )

        return context
