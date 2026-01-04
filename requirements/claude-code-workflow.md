# Claude Code VSCode Integration Workflow

## Overview
This document describes how to use Claude Code directly in VSCode for AI-powered trading analysis. Claude has full access to your local files, can execute code, run queries, and analyze your data in real-time - no copying or pasting required!

## Key Capabilities
Claude Code in VSCode can:
- ✅ Directly read and query your SQLite database
- ✅ Execute Python scripts to fetch and analyze data
- ✅ Run your FastAPI backend and make API calls
- ✅ Access all market data files in your project
- ✅ Generate and save reports directly to your database
- ✅ Update your portfolio and track trades
- ✅ Execute data imports from free APIs
- ✅ Create visualizations and charts

## Daily Trading Workflow

### Morning Routine (6:00-7:00 AM)

#### Step 1: Start Your Trading Session
```
1. Open VSCode with StarkMatter project
2. Open Claude Code in VSCode
3. Say: "Good morning! Let's start today's trading session"
```

#### Step 2: Claude Imports Market Data
```
Claude will:
1. Check what data needs updating
2. Run Python scripts to fetch from Yahoo Finance
3. Import economic data from FRED
4. Scrape news and Reddit sentiment
5. Store everything in your local database
6. Generate a morning summary
```

Example prompt:
```
"Please run the morning data import and show me a summary of:
- Pre-market movers
- Key economic data today
- News sentiment
- Technical signals on my watchlist"
```

#### Step 3: Real-Time Analysis
```
Claude can directly:
- Query your database for any stock
- Calculate technical indicators
- Analyze news sentiment
- Compare with historical patterns
- Generate trade recommendations
```

Example prompts:
```
"Analyze AAPL's current setup using the data in our database"
"What stocks in our database show bullish technical signals?"
"Check Reddit sentiment for my watchlist stocks"
```

#### Step 4: Trade Execution Support
```
Claude helps with:
- Entry/exit point calculation
- Position sizing based on your portfolio
- Risk management checks
- Stop loss and target setting
- Trade logging in database
```

## Claude's Direct Database Access

### Query Examples Claude Can Run

```python
# Claude can execute queries like these directly:

# Get latest price data
"""
SELECT * FROM market_data
WHERE symbol = 'AAPL'
ORDER BY date DESC
LIMIT 30
"""

# Find trending stocks
"""
SELECT symbol, sentiment_score, mention_count
FROM reddit_mentions
WHERE scraped_at > datetime('now', '-24 hours')
ORDER BY mention_count DESC
"""

# Check your portfolio
"""
SELECT * FROM portfolio_positions
WHERE user_id = 'your_id'
"""

# Get technical indicators
"""
SELECT * FROM technical_indicators
WHERE symbol IN ('AAPL', 'GOOGL', 'TSLA')
AND indicator = 'RSI'
AND date = date('now')
"""
```

## Real-Time Capabilities

### Live Data Fetching
Claude can run Python code to fetch data in real-time:

```python
# Example: Claude can execute this directly
import yfinance as yf

def get_live_quote(symbol):
    ticker = yf.Ticker(symbol)
    return ticker.info

# Claude runs: "Let me check AAPL's current price..."
data = get_live_quote('AAPL')
print(f"AAPL is currently at ${data['regularMarketPrice']}")
```

### Automated Analysis Pipeline
Claude can run complete analysis workflows:

```python
# Claude can execute full analysis pipelines
async def analyze_stock(symbol):
    # Fetch latest data
    price_data = fetch_yahoo_data(symbol)

    # Calculate indicators
    indicators = calculate_technicals(price_data)

    # Get news sentiment
    news = fetch_news(symbol)
    sentiment = analyze_sentiment(news)

    # Check Reddit
    reddit_data = scrape_reddit(symbol)

    # Generate analysis
    return generate_report(price_data, indicators, sentiment, reddit_data)
```

## Interactive Analysis Sessions

### Market Overview
```
You: "Show me today's market overview"
Claude: [Queries database, fetches real-time data, generates summary]
```

### Stock Deep Dive
```
You: "Deep dive on NVDA with all available data"
Claude: [Runs comprehensive analysis using database and APIs]
```

### Portfolio Review
```
You: "Review my portfolio and suggest adjustments"
Claude: [Analyzes positions, calculates risk, suggests rebalancing]
```

### Trade Ideas
```
You: "Find me the best trading opportunities for today"
Claude: [Scans database, applies filters, ranks opportunities]
```

## Data Management Commands

### Commands Claude Can Execute

```python
# Import fresh data
"Claude, please import the latest market data for my watchlist"

# Update technical indicators
"Calculate fresh RSI and MACD for all stocks in the database"

# Clean old data
"Remove market data older than 6 months to save space"

# Backup database
"Create a backup of today's database"

# Export for records
"Export today's trades and analysis to CSV"
```

## Advanced Workflows

### Strategy Backtesting
```
You: "Backtest a strategy where we buy when RSI < 30 and sell when RSI > 70"
Claude: [Runs backtest using historical data in database]
```

### Pattern Recognition
```
You: "Find all stocks showing a bull flag pattern in the last week"
Claude: [Queries database, analyzes patterns, returns matches]
```

### Correlation Analysis
```
You: "Show me correlation between my portfolio stocks"
Claude: [Calculates correlations using database data]
```

### Risk Analysis
```
You: "Calculate my portfolio's VaR and suggest hedges"
Claude: [Analyzes positions, calculates risk metrics, suggests hedges]
```

## Database Schema Claude Works With

Claude has full access to these tables:

```sql
-- Market data
market_data (symbol, date, open, high, low, close, volume)
intraday_data (symbol, timestamp, price, volume)

-- Fundamentals
fundamentals (symbol, pe_ratio, market_cap, financials)

-- News & Sentiment
news (title, source, sentiment_score, symbols)
reddit_mentions (post_id, subreddit, symbols, sentiment)

-- Technical Indicators
technical_indicators (symbol, date, indicator, value)

-- Your Portfolio
portfolio_positions (symbol, quantity, avg_cost, current_value)
trade_history (symbol, action, quantity, price, timestamp)

-- Analysis History
claude_analyses (query, response, accuracy, outcome)
```

## Code Execution Examples

### Example 1: Morning Report
```python
# You: "Generate my morning report"
# Claude executes:

def generate_morning_report():
    # Get pre-market movers
    movers = db.query("SELECT * FROM market_data WHERE ...")

    # Get economic calendar
    econ = fetch_fred_data()

    # Get news sentiment
    news = db.query("SELECT * FROM news WHERE ...")

    # Format report
    report = format_markdown_report(movers, econ, news)

    # Save to database
    db.execute("INSERT INTO reports ...")

    return report
```

### Example 2: Real-Time Alert
```python
# You: "Alert me if any of my stocks move >5%"
# Claude sets up:

async def monitor_positions():
    positions = db.query("SELECT symbol FROM portfolio_positions")

    for symbol in positions:
        current = yf.Ticker(symbol).info['regularMarketPrice']
        previous = db.query(f"SELECT close FROM market_data WHERE symbol='{symbol}'")

        change = (current - previous) / previous * 100
        if abs(change) > 5:
            print(f"ALERT: {symbol} moved {change:.2f}%!")
```

## File Access Examples

### Claude Can Read Your Files
```
"Claude, read the config file and show me my API keys setup"
"Analyze the CSV file I just downloaded"
"Check the logs for any import errors"
```

### Claude Can Write Analysis
```
"Save this analysis to a new file in the reports folder"
"Update my watchlist.json with these symbols"
"Create a markdown report of today's trades"
```

## Best Practices for VSCode Workflow

### Organize Your Prompts
1. **Morning Routine**: "Run morning import and analysis"
2. **Midday Check**: "Any significant moves in my positions?"
3. **EOD Review**: "Summarize today's performance"
4. **Weekly Review**: "Analyze this week's trades"

### Efficient Commands
- Use shortcuts: "Check AAPL" instead of long requests
- Chain operations: "Import data then analyze SPY"
- Save templates: "Run my momentum scan"

### Context Preservation
- Claude remembers the conversation context
- Reference previous analysis: "Like we discussed earlier"
- Build on findings: "Dig deeper into that correlation"

## Integration with Your Development

### While Coding
```
"Claude, help me add a new indicator to the database"
"Debug why this import is failing"
"Optimize this query for better performance"
```

### Testing Strategies
```
"Test this trading strategy on last month's data"
"Verify the accuracy of our sentiment analysis"
"Check if our technical indicators match Yahoo's"
```

## Performance Optimization

### Claude Can Help Optimize
```
"Profile the data import process and suggest improvements"
"Index the database for faster queries"
"Implement caching for frequently accessed data"
```

## Troubleshooting

### Common Issues Claude Can Fix

**Database Issues**
```
"The database seems slow, can you analyze and fix it?"
"Help me recover from this corrupted database"
```

**Import Failures**
```
"Debug why Yahoo Finance import is failing"
"Handle rate limiting gracefully"
```

**Analysis Errors**
```
"Why is this calculation giving wrong results?"
"Fix the sentiment analysis scoring"
```

## Cost Benefits

### What You Save
- ❌ No API integration needed ($100-500/month saved)
- ❌ No cloud infrastructure ($500-1000/month saved)
- ❌ No separate analysis tools ($200-500/month saved)
- ✅ Just your existing Claude Code subscription

### What You Get
- Real-time code execution
- Direct database access
- Automated data imports
- Interactive analysis
- Full development support

## Tips for Maximum Effectiveness

1. **Start Simple**: Begin with basic queries, build complexity
2. **Be Specific**: "Check RSI for AAPL" vs "analyze something"
3. **Use Context**: Reference your files and database
4. **Iterate Quickly**: Refine based on results
5. **Save Useful Patterns**: Note commands that work well
6. **Leverage Code**: Let Claude write and execute Python
7. **Trust the Access**: Claude can see and do everything locally

## Example Daily Conversation

```
You: "Good morning Claude, let's start trading"
Claude: [Runs morning import, generates summary]

You: "NVDA looks interesting, dig deeper"
Claude: [Queries database, fetches latest, analyzes]

You: "Set up a paper trade for NVDA"
Claude: [Calculates size, sets stops, logs trade]

You: "Monitor this position and alert me"
Claude: [Sets up monitoring code]

You: "End of day, how did we do?"
Claude: [Analyzes performance, saves report]
```

## Conclusion

With Claude Code in VSCode, you have a powerful AI assistant that can directly access and manipulate your trading data, execute code, and provide real-time analysis - all without any API costs or complex integrations. This is a true AI-powered trading workstation using tools you already have!