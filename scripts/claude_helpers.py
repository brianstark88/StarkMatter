"""
Claude Analysis Helper Scripts
Generate formatted data exports for Claude Code analysis
"""
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Add parent to path
sys.path.append(str(Path(__file__).parent.parent))


class ClaudeAnalysisHelper:
    """Helper class for generating Claude-friendly analysis exports"""

    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = Path(__file__).parent.parent / "data" / "trading.db"
        self.db_path = str(db_path)

    def generate_morning_summary(self) -> str:
        """
        Generate morning market summary for Claude

        Returns:
            Markdown-formatted summary
        """
        conn = sqlite3.connect(self.db_path)

        # Get pre-market movers (yesterday's biggest changes)
        movers_query = """
        WITH latest_prices AS (
            SELECT
                symbol,
                close,
                date,
                LAG(close) OVER (PARTITION BY symbol ORDER BY date) as prev_close
            FROM market_data
            WHERE date >= date('now', '-5 days')
        )
        SELECT
            symbol,
            close as current_price,
            prev_close,
            ((close - prev_close) / prev_close * 100) as change_pct
        FROM latest_prices
        WHERE prev_close IS NOT NULL
        AND date = (SELECT MAX(date) FROM market_data)
        ORDER BY ABS(change_pct) DESC
        LIMIT 10
        """

        try:
            movers = pd.read_sql_query(movers_query, conn)
        except:
            movers = pd.DataFrame()

        # Get sentiment summary
        sentiment_query = """
        SELECT
            symbol,
            AVG(sentiment_score) as avg_sentiment,
            COUNT(*) as mentions
        FROM reddit_mentions
        WHERE created_at > datetime('now', '-24 hours')
        GROUP BY symbol
        ORDER BY mentions DESC
        LIMIT 10
        """

        try:
            sentiment = pd.read_sql_query(sentiment_query, conn)
        except:
            sentiment = pd.DataFrame()

        # Get latest technical signals
        signals_query = """
        SELECT symbol, signal_type, indicator, strength
        FROM signals
        WHERE date = date('now')
        ORDER BY strength DESC
        LIMIT 10
        """

        try:
            signals = pd.read_sql_query(signals_query, conn)
        except:
            signals = pd.DataFrame()

        conn.close()

        # Format for Claude
        summary = f"""# Market Analysis for {datetime.now().strftime('%Y-%m-%d')}

## Top Movers (Latest Session)
"""

        if not movers.empty:
            for _, row in movers.iterrows():
                change_indicator = "🟢" if row['change_pct'] > 0 else "🔴"
                summary += f"- **{row['symbol']}**: ${row['current_price']:.2f} {change_indicator} {row['change_pct']:.2f}%\n"
        else:
            summary += "*No data available*\n"

        summary += f"""
## Reddit Sentiment (Last 24h)
"""

        if not sentiment.empty:
            for _, row in sentiment.iterrows():
                sentiment_emoji = "😊" if row['avg_sentiment'] > 0.1 else "😐" if row['avg_sentiment'] > -0.1 else "😞"
                summary += f"- **{row['symbol']}**: {row['mentions']} mentions, sentiment: {row['avg_sentiment']:.2f} {sentiment_emoji}\n"
        else:
            summary += "*No data available*\n"

        summary += f"""
## Recent Technical Signals
"""

        if not signals.empty:
            for _, row in signals.iterrows():
                signal_emoji = "📈" if row['signal_type'] == 'BUY' else "📉"
                summary += f"- {signal_emoji} **{row['symbol']}**: {row['signal_type']} - {row['indicator']} (strength: {row['strength']:.0f})\n"
        else:
            summary += "*No signals found*\n"

        summary += """
## Analysis Questions:
1. Which stocks show the strongest momentum?
2. Is sentiment aligned with price action?
3. Any contrarian opportunities?
4. Key levels to watch today?
"""

        return summary

    def analyze_stock(self, symbol: str) -> str:
        """
        Generate comprehensive stock analysis for Claude

        Args:
            symbol: Stock ticker

        Returns:
            Markdown-formatted analysis
        """
        conn = sqlite3.connect(self.db_path)

        # Get price data (last 30 days)
        price_query = f"""
        SELECT date, open, high, low, close, volume
        FROM market_data
        WHERE symbol = '{symbol}'
        ORDER BY date DESC
        LIMIT 30
        """

        try:
            prices = pd.read_sql_query(price_query, conn)
        except:
            prices = pd.DataFrame()

        # Get technical signals
        signals_query = f"""
        SELECT signal_type, indicator, strength, date
        FROM signals
        WHERE symbol = '{symbol}'
        ORDER BY date DESC
        LIMIT 5
        """

        try:
            signals = pd.read_sql_query(signals_query, conn)
        except:
            signals = pd.DataFrame()

        # Get news
        news_query = f"""
        SELECT title, source, published_at
        FROM news
        WHERE symbols LIKE '%{symbol}%'
        ORDER BY published_at DESC
        LIMIT 5
        """

        try:
            news = pd.read_sql_query(news_query, conn)
        except:
            news = pd.DataFrame()

        # Get Reddit mentions
        reddit_query = f"""
        SELECT title, sentiment_score, score, created_at
        FROM reddit_mentions
        WHERE symbol = '{symbol}'
        ORDER BY created_at DESC
        LIMIT 5
        """

        try:
            reddit = pd.read_sql_query(reddit_query, conn)
        except:
            reddit = pd.DataFrame()

        conn.close()

        # Build analysis
        analysis = f"""# {symbol} Analysis

## Price Action (Last 30 Days)
"""

        if not prices.empty:
            latest = prices.iloc[0]
            oldest = prices.iloc[-1]
            change = ((latest['close'] - oldest['close']) / oldest['close']) * 100

            analysis += f"""
- **Current Price**: ${latest['close']:.2f}
- **30-Day Change**: {change:.2f}%
- **High/Low**: ${prices['high'].max():.2f} / ${prices['low'].min():.2f}
- **Avg Volume**: {prices['volume'].mean():,.0f}

### Recent Price Data
"""
            for _, row in prices.head(5).iterrows():
                analysis += f"- {row['date']}: ${row['close']:.2f}\n"
        else:
            analysis += "*No price data available*\n"

        analysis += """
## Technical Signals
"""

        if not signals.empty:
            for _, row in signals.iterrows():
                signal_emoji = "📈" if row['signal_type'] == 'BUY' else "📉"
                analysis += f"- {signal_emoji} **{row['signal_type']}**: {row['indicator']} (strength: {row['strength']:.0f}, {row['date']})\n"
        else:
            analysis += "*No signals found*\n"

        analysis += """
## Recent News
"""

        if not news.empty:
            for _, row in news.iterrows():
                analysis += f"- [{row['source']}] {row['title']}\n"
        else:
            analysis += "*No news available*\n"

        analysis += """
## Reddit Mentions
"""

        if not reddit.empty:
            for _, row in reddit.iterrows():
                sentiment_emoji = "😊" if row['sentiment_score'] > 0.1 else "😐" if row['sentiment_score'] > -0.1 else "😞"
                analysis += f"- {row['title']} {sentiment_emoji} (score: {row['score']}, sentiment: {row['sentiment_score']:.2f})\n"
        else:
            analysis += "*No Reddit mentions found*\n"

        analysis += """
## Questions for Analysis:
1. Technical setup: Bullish or bearish?
2. Is news sentiment supportive of price action?
3. What are the key support/resistance levels?
4. Entry and exit points?
5. Risk/reward assessment?
"""

        return analysis

    def export_portfolio_analysis(self) -> str:
        """Generate portfolio analysis for Claude"""
        conn = sqlite3.connect(self.db_path)

        # Get positions
        positions_query = """
        SELECT
            p.symbol,
            p.quantity,
            p.average_cost,
            m.close as current_price
        FROM positions p
        LEFT JOIN (
            SELECT symbol, close, date
            FROM market_data m1
            WHERE date = (SELECT MAX(date) FROM market_data m2 WHERE m2.symbol = m1.symbol)
        ) m ON p.symbol = m.symbol
        """

        try:
            positions = pd.read_sql_query(positions_query, conn)
        except:
            positions = pd.DataFrame()

        # Get trades
        trades_query = """
        SELECT symbol, action, quantity, price, timestamp
        FROM trades
        ORDER BY timestamp DESC
        LIMIT 20
        """

        try:
            trades = pd.read_sql_query(trades_query, conn)
        except:
            trades = pd.DataFrame()

        conn.close()

        # Build analysis
        analysis = f"""# Portfolio Analysis - {datetime.now().strftime('%Y-%m-%d')}

## Current Positions
"""

        if not positions.empty:
            total_value = 0
            total_cost = 0

            for _, row in positions.iterrows():
                if pd.notna(row['current_price']):
                    value = row['quantity'] * row['current_price']
                    cost = row['quantity'] * row['average_cost']
                    pl = value - cost
                    pl_pct = (pl / cost) * 100 if cost > 0 else 0

                    total_value += value
                    total_cost += cost

                    pl_emoji = "🟢" if pl > 0 else "🔴"
                    analysis += f"- **{row['symbol']}**: {row['quantity']} shares @ ${row['average_cost']:.2f}\n"
                    analysis += f"  Current: ${row['current_price']:.2f}, Value: ${value:.2f}, P&L: ${pl:.2f} ({pl_pct:.2f}%) {pl_emoji}\n"

            total_pl = total_value - total_cost
            total_pl_pct = (total_pl / total_cost) * 100 if total_cost > 0 else 0

            analysis += f"""
### Portfolio Summary
- **Total Value**: ${total_value:,.2f}
- **Total Cost**: ${total_cost:,.2f}
- **Total P&L**: ${total_pl:,.2f} ({total_pl_pct:.2f}%)
"""
        else:
            analysis += "*No positions*\n"

        analysis += """
## Recent Trades
"""

        if not trades.empty:
            for _, row in trades.iterrows():
                action_emoji = "📈" if row['action'] == 'BUY' else "📉"
                analysis += f"- {action_emoji} {row['action']} {row['quantity']} {row['symbol']} @ ${row['price']:.2f} ({row['timestamp']})\n"
        else:
            analysis += "*No trades*\n"

        analysis += """
## Analysis Questions:
1. Portfolio allocation - well diversified?
2. Which positions are winners/losers?
3. Should I take profits or cut losses?
4. Any rebalancing needed?
"""

        return analysis


# CLI interface
if __name__ == "__main__":
    helper = ClaudeAnalysisHelper()

    print("=" * 60)
    print("Claude Analysis Helper")
    print("=" * 60)
    print()

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "morning":
            print(helper.generate_morning_summary())

        elif command == "stock" and len(sys.argv) > 2:
            symbol = sys.argv[2].upper()
            print(helper.analyze_stock(symbol))

        elif command == "portfolio":
            print(helper.export_portfolio_analysis())

        else:
            print("Invalid command")
            print("Usage:")
            print("  python claude_helpers.py morning")
            print("  python claude_helpers.py stock AAPL")
            print("  python claude_helpers.py portfolio")
    else:
        # Default: morning summary
        print(helper.generate_morning_summary())
