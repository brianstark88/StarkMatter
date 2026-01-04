# System Architecture Design - Local-First Trading Platform

## Overview
StarkMatter is a local-first trading platform that runs entirely on your machine, aggregates free market data, and leverages Claude Code for AI-powered analysis without any recurring API costs.

## Architecture Principles
1. **Local-First**: Everything runs on your machine
2. **Zero Recurring Costs**: Only free data sources
3. **Claude Code Integration**: Use existing subscription for analysis
4. **Data Aggregation**: Combine multiple free sources
5. **Offline Capable**: Work with cached data
6. **Privacy First**: Your data never leaves your machine

## Simplified Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Your Local Machine                     │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │            React Frontend (localhost:5173)       │    │
│  │  • Data Import Dashboard                        │    │
│  │  • Portfolio Tracker                            │    │
│  │  • Analysis Viewer                              │    │
│  │  • Claude Export Tools                          │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                    │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │         FastAPI Backend (localhost:8000)        │    │
│  │  • Data Import Service                          │    │
│  │  • Free API Integrations                        │    │
│  │  • Web Scraping Engine                          │    │
│  │  • Analysis Storage                             │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                    │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │           Local Database (SQLite)                │    │
│  │  • Market Data    • News & Sentiment            │    │
│  │  • Fundamentals   • Economic Indicators         │    │
│  │  • Analysis History • Portfolio Data            │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
└───────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Free External Sources                   │
├─────────────────────────────────────────────────────────┤
│ • Yahoo Finance (yfinance)  • FRED (Economic Data)      │
│ • Alpha Vantage (25/day)    • SEC EDGAR                 │
│ • FMP (250/day)             • RSS News Feeds            │
│ • Reddit (PRAW)             • Google Trends             │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Claude Code                          │
│         (Manual Analysis via Copy/Paste)                 │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (React + TypeScript)
**Purpose**: User interface for data management and analysis viewing

**Key Features**:
- **Import Dashboard**: One-click daily data import
- **Data Viewer**: Browse imported market data, news, sentiment
- **Export Tools**: Format data for Claude Code analysis
- **Analysis Library**: Store and review Claude insights
- **Portfolio Tracker**: Paper trading and position management
- **Charts**: Visualize market data and technical indicators

### 2. Backend (FastAPI)
**Purpose**: Handle data aggregation, storage, and processing

**Services**:
- **Data Import Service**: Orchestrate data collection from all sources
- **Market Data Service**: Fetch from yfinance, Alpha Vantage, FMP
- **News Aggregator**: Collect RSS feeds, scrape news sites
- **Sentiment Analyzer**: Reddit scraping, basic NLP
- **Economic Data Service**: FRED API integration
- **Export Service**: Format data for Claude Code

### 3. Local Database (SQLite)
**Purpose**: Store all data locally for fast access and historical analysis

**Schema Design**:
```sql
-- Core market data
CREATE TABLE market_data (
    symbol TEXT,
    date DATE,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER,
    source TEXT,
    PRIMARY KEY (symbol, date)
);

-- Intraday data
CREATE TABLE intraday_data (
    symbol TEXT,
    timestamp DATETIME,
    price REAL,
    volume INTEGER,
    PRIMARY KEY (symbol, timestamp)
);

-- Company fundamentals
CREATE TABLE fundamentals (
    symbol TEXT PRIMARY KEY,
    market_cap REAL,
    pe_ratio REAL,
    dividend_yield REAL,
    earnings_date DATE,
    data JSON,
    updated_at DATETIME
);

-- News articles
CREATE TABLE news (
    id INTEGER PRIMARY KEY,
    title TEXT,
    source TEXT,
    url TEXT,
    published_at DATETIME,
    sentiment_score REAL,
    symbols JSON,
    content TEXT
);

-- Claude analyses
CREATE TABLE analyses (
    id INTEGER PRIMARY KEY,
    query TEXT,
    context JSON,
    response TEXT,
    created_at DATETIME,
    tags JSON
);
```

## Data Collection Strategy

### Daily Import Workflow

**Pre-Market (6:00 AM)**:
```python
async def morning_import():
    # 1. Market Data
    await import_yahoo_finance()  # Unlimited
    await import_alpha_vantage()  # 25 calls
    await import_fmp_data()       # 250 calls

    # 2. Economic Data
    await import_fred_data()      # Latest indicators

    # 3. News & Sentiment
    await import_rss_feeds()      # All major outlets
    await scrape_reddit()         # WSB, stocks
    await check_google_trends()   # Trending tickers

    # 4. Alternative Data
    await scrape_openinsider()    # Insider trades
    await get_options_flow()      # Limited free data

    # 5. Generate Summary
    return generate_import_summary()
```

### Rate Limit Management
```python
class RateLimitManager:
    limits = {
        "alpha_vantage": {"daily": 25, "used": 0},
        "fmp": {"daily": 250, "used": 0},
        "finnhub": {"per_minute": 60, "used": 0}
    }

    def can_call(self, service):
        # Check if we have quota remaining
        return self.limits[service]["used"] < self.limits[service]["daily"]
```

## Claude Code Integration Workflow

### 1. Data Export for Analysis
```python
def export_for_claude(symbols: List[str], date: str):
    """Generate markdown summary for Claude Code"""

    return f"""
    # Market Analysis for {date}

    ## Market Overview
    {get_market_summary()}

    ## Watchlist Stocks
    {get_symbol_data(symbols)}

    ## Economic Indicators
    {get_economic_data()}

    ## News Sentiment
    {get_news_summary()}

    ## Unusual Activity
    {get_unusual_activity()}

    ## Technical Indicators
    {get_technical_analysis()}
    """
```

### 2. Claude Prompt Templates
Store reusable prompts for common analyses:
- Daily market analysis
- Individual stock deep dive
- Sector rotation analysis
- Risk assessment
- Trade idea generation

### 3. Analysis Storage
Save Claude's responses back to the database for:
- Historical reference
- Performance tracking
- Pattern recognition
- Knowledge building

## Free Data Sources Implementation

### Primary Sources

**1. Yahoo Finance (yfinance)**
```python
import yfinance as yf

async def get_yahoo_data(symbol: str):
    ticker = yf.Ticker(symbol)
    return {
        "info": ticker.info,
        "history": ticker.history(period="1mo"),
        "news": ticker.news,
        "financials": ticker.financials
    }
```

**2. Alpha Vantage (Limited)**
```python
async def get_technical_indicators(symbol: str):
    # Use sparingly - only 25 calls/day
    indicators = ["RSI", "MACD", "SMA"]
    return fetch_alpha_vantage(symbol, indicators)
```

**3. Financial Modeling Prep**
```python
async def get_fundamentals(symbol: str):
    # 250 calls/day - use for detailed financials
    return fetch_fmp_financials(symbol)
```

### Web Scraping

**Reddit Sentiment**
```python
import praw

reddit = praw.Reddit(client_id="...", client_secret="...")

def get_reddit_sentiment():
    wsb = reddit.subreddit("wallstreetbets")
    mentions = analyze_posts(wsb.hot(limit=100))
    return calculate_sentiment(mentions)
```

**News RSS Feeds**
```python
import feedparser

NEWS_FEEDS = [
    "https://feeds.finance.yahoo.com/rss/2.0/headline",
    "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    "https://feeds.bloomberg.com/markets/news.rss"
]

def aggregate_news():
    articles = []
    for feed_url in NEWS_FEEDS:
        feed = feedparser.parse(feed_url)
        articles.extend(feed.entries)
    return articles
```

## Performance Optimization

### Caching Strategy
- Cache all API responses for 24 hours
- Store technical indicators for 1 hour
- Keep news for 7 days
- Maintain 6 months of historical data locally

### Database Optimization
- Use SQLite with proper indexing
- Implement data compression for old records
- Regular VACUUM operations
- Partition tables by date for faster queries

## Security Considerations

### Local Security
- All data stored locally (no cloud exposure)
- Encrypted database option
- No credentials in code (use .env file)
- Secure API key storage

### Data Privacy
- No user data leaves the machine
- No third-party tracking
- Complete data ownership
- Easy data export/backup

## Backup & Recovery

### Daily Backups
```python
def backup_database():
    # Automated daily backup
    timestamp = datetime.now().strftime("%Y%m%d")
    shutil.copy("trading.db", f"backups/trading_{timestamp}.db")

    # Keep last 30 days of backups
    cleanup_old_backups(days=30)
```

## Development Workflow

### Local Development
```bash
# Start backend
cd api
uvicorn app:app --reload

# Start frontend
cd ui
npm run dev

# Access application
# Frontend: http://localhost:5173
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Testing Strategy
- Unit tests for data importers
- Integration tests for API endpoints
- Mock external API responses
- Test rate limit handling
- Validate data quality checks

## Migration from Cloud Architecture

### Key Simplifications
1. **No Kubernetes**: Simple local processes
2. **No Redis**: SQLite for all storage
3. **No Celery**: Async Python for background tasks
4. **No OAuth**: Simple local authentication
5. **No Cloud APIs**: All free sources
6. **No Monitoring Stack**: Basic logging only

### What We Keep
1. **FastAPI**: Still the best for APIs
2. **React**: Modern UI framework
3. **PostgreSQL/SQLite**: Reliable data storage
4. **Docker**: Optional for consistency
5. **Git**: Version control

## Cost Analysis

### Eliminated Costs
- ❌ Cloud hosting: $500-1000/month
- ❌ Claude API: $100-500/month
- ❌ Premium market data: $200-500/month
- ❌ Monitoring tools: $100/month

### Remaining Costs
- ✅ Claude Code subscription: Already paid
- ✅ Internet connection: Existing
- ✅ Local machine: Existing
- **Total additional cost: $0/month**

## Future Enhancements

### Potential Upgrades (Optional)
1. **Raspberry Pi Server**: Dedicated device ($50 one-time)
2. **Premium Data** (if needed): Alpha Vantage ($50/month)
3. **Better Options Data**: Unusual Whales ($20/month)
4. **Automated Trading**: Broker API integration
5. **Mobile App**: React Native companion app

### Community Features
1. Share analysis templates
2. Open source prompt library
3. Community indicators
4. Shared watchlists (via export/import)