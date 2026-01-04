# EPIC-002: Free Market Data Integration

## Epic Overview
Integrate FREE market data sources to provide comprehensive trading information without any recurring costs, using a combination of free APIs and web scraping.

## Business Value
- Zero cost market data access
- Comprehensive data from multiple free sources
- Local data storage for offline access
- Smart rate limit management
- Technical indicator calculations
- Historical data for analysis

## Acceptance Criteria
- [ ] Yahoo Finance integration (unlimited calls)
- [ ] Alpha Vantage free tier (25 calls/day)
- [ ] FMP free tier integration (250 calls/day)
- [ ] FRED economic data integration
- [ ] RSS news feed aggregation
- [ ] Reddit sentiment scraping
- [ ] Local database storage
- [ ] Rate limit management system
- [ ] Data export for Claude Code analysis

## User Stories

### US-007: Yahoo Finance Integration
**As a** trader
**I want to** access unlimited market data from Yahoo Finance
**So that** I have comprehensive stock information without API limits

**Acceptance Criteria:**
- Historical price data (1m, 5m, 1d, etc.)
- Real-time quotes (15-min delay acceptable)
- Company financials and info
- News and analyst recommendations
- Options chain data
- No rate limiting concerns

### US-008: Free API Integration
**As a** trader
**I want to** supplement Yahoo data with other free sources
**So that** I have technical indicators and verified data

**Acceptance Criteria:**
- Alpha Vantage for technical indicators (25/day limit)
- FMP for detailed fundamentals (250/day limit)
- FRED for economic indicators (generous limits)
- Smart rotation between sources
- Fallback mechanisms

### US-009: News Aggregation
**As a** trader
**I want to** aggregate news from free sources
**So that** I stay informed without paying for news APIs

**Acceptance Criteria:**
- RSS feeds from major outlets
- Reddit scraping for sentiment
- Google Trends integration
- Local storage of articles
- Sentiment scoring

### US-010: Data Import Dashboard
**As a** user
**I want to** easily import all daily data
**So that** I can start my trading day with complete information

**Acceptance Criteria:**
- One-click import all data
- Progress indicators
- Error handling and retry
- Import history
- Manual CSV/JSON upload option

## Technical Implementation

### Free Data Sources

```yaml
Primary Sources:
  Yahoo Finance (yfinance):
    - Unlimited API calls
    - 15-minute delayed quotes
    - Historical data
    - Financials, news, options
    - Implementation: Python library

  Alpha Vantage:
    - 25 API calls/day (free)
    - Technical indicators
    - Real-time quotes
    - Forex and crypto
    - Implementation: REST API

  Financial Modeling Prep:
    - 250 API calls/day (free)
    - Financial statements
    - Company profiles
    - Analyst ratings
    - Implementation: REST API

Economic Data:
  FRED (Federal Reserve):
    - Unlimited with API key
    - 500,000+ economic series
    - CPI, unemployment, GDP
    - Implementation: REST API

News & Sentiment:
  RSS Feeds:
    - CNBC, Reuters, Bloomberg
    - MarketWatch, Seeking Alpha
    - No rate limits
    - Implementation: feedparser

  Reddit:
    - r/wallstreetbets, r/stocks
    - PRAW library
    - Sentiment analysis
    - Implementation: Python scraping

Alternative Data:
  Google Trends:
    - Search interest data
    - pytrends library
    - No official API limits
    - Implementation: Python library

  OpenInsider:
    - Insider trading data
    - Web scraping
    - No rate limits
    - Implementation: BeautifulSoup
```

### Database Schema (SQLite)

```sql
-- Market data from Yahoo Finance
CREATE TABLE market_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    date DATE NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    adj_close REAL,
    volume INTEGER,
    source TEXT DEFAULT 'yahoo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, date, source)
);

-- Intraday data
CREATE TABLE intraday_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    price REAL,
    volume INTEGER,
    source TEXT,
    UNIQUE(symbol, timestamp)
);

-- Technical indicators
CREATE TABLE technical_indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    date DATE NOT NULL,
    indicator TEXT NOT NULL,
    value REAL,
    parameters JSON,
    source TEXT,
    UNIQUE(symbol, date, indicator)
);

-- Company fundamentals
CREATE TABLE fundamentals (
    symbol TEXT PRIMARY KEY,
    company_name TEXT,
    sector TEXT,
    industry TEXT,
    market_cap REAL,
    pe_ratio REAL,
    dividend_yield REAL,
    beta REAL,
    financials JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News articles
CREATE TABLE news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    source TEXT,
    url TEXT UNIQUE,
    published_at TIMESTAMP,
    symbols JSON,
    sentiment_score REAL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reddit mentions
CREATE TABLE reddit_mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT UNIQUE,
    subreddit TEXT,
    title TEXT,
    score INTEGER,
    num_comments INTEGER,
    symbols JSON,
    sentiment REAL,
    created_at TIMESTAMP,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API rate limits tracking
CREATE TABLE rate_limits (
    service TEXT PRIMARY KEY,
    daily_limit INTEGER,
    calls_today INTEGER DEFAULT 0,
    last_reset DATE,
    hourly_limit INTEGER,
    calls_this_hour INTEGER DEFAULT 0,
    last_hour_reset TIMESTAMP
);

-- Import history
CREATE TABLE import_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_type TEXT,
    status TEXT,
    records_imported INTEGER,
    errors JSON,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

### Data Import Service

```python
class DataImportService:
    def __init__(self):
        self.rate_limiter = RateLimitManager()
        self.db = Database()

    async def daily_import(self, symbols: List[str]):
        """Main import orchestration"""
        results = {
            "market_data": await self.import_yahoo_data(symbols),
            "technicals": await self.import_technicals(symbols),
            "fundamentals": await self.import_fundamentals(symbols),
            "economic": await self.import_economic_data(),
            "news": await self.import_news(),
            "sentiment": await self.import_sentiment(symbols)
        }
        return results

    async def import_yahoo_data(self, symbols: List[str]):
        """Import from Yahoo Finance - unlimited calls"""
        import yfinance as yf

        for symbol in symbols:
            ticker = yf.Ticker(symbol)

            # Get historical data
            hist = ticker.history(period="1mo")
            self.db.save_market_data(symbol, hist)

            # Get company info
            info = ticker.info
            self.db.save_fundamentals(symbol, info)

            # Get news
            news = ticker.news
            self.db.save_news(news)

        return {"symbols_imported": len(symbols)}

    async def import_technicals(self, symbols: List[str]):
        """Import technical indicators - rate limited"""
        imported = 0

        for symbol in symbols[:5]:  # Limit to 5 most important
            if not self.rate_limiter.can_call("alpha_vantage"):
                break

            indicators = await self.fetch_alpha_vantage(symbol)
            self.db.save_indicators(symbol, indicators)
            self.rate_limiter.record_call("alpha_vantage")
            imported += 1

        return {"symbols_imported": imported}

    async def import_economic_data(self):
        """Import from FRED - generous limits"""
        indicators = ["DGS10", "UNRATE", "CPIAUCSL", "GDP"]

        for indicator in indicators:
            data = await self.fetch_fred(indicator)
            self.db.save_economic(indicator, data)

        return {"indicators_imported": len(indicators)}
```

### Rate Limit Management

```python
class RateLimitManager:
    def __init__(self):
        self.limits = {
            "alpha_vantage": {"daily": 25, "per_minute": 5},
            "fmp": {"daily": 250, "per_minute": 300},
            "finnhub": {"per_minute": 60},
            "reddit": {"per_minute": 60}
        }
        self.reset_daily_counts()

    def can_call(self, service: str) -> bool:
        """Check if we can make an API call"""
        if service not in self.limits:
            return True  # No limits for this service

        daily_ok = self.check_daily_limit(service)
        minute_ok = self.check_minute_limit(service)

        return daily_ok and minute_ok

    def use_fallback(self, primary: str) -> str:
        """Get fallback service when primary is rate limited"""
        fallbacks = {
            "alpha_vantage": "yahoo",
            "fmp": "yahoo",
            "finnhub": "fmp"
        }
        return fallbacks.get(primary, "yahoo")
```

### Data Export for Claude

```python
def export_market_summary(date: str = None) -> str:
    """Export data in markdown format for Claude Code"""

    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    return f"""
# Market Data Summary for {date}

## Market Overview
- S&P 500: {get_index_data("SPY")}
- VIX: {get_index_data("VIX")}
- 10-Year Treasury: {get_economic("DGS10")}

## Top Movers
### Gainers
{format_top_movers("gainers")}

### Losers
{format_top_movers("losers")}

## Watchlist Stocks
{format_watchlist_data()}

## Economic Indicators
- Unemployment Rate: {get_economic("UNRATE")}
- CPI: {get_economic("CPIAUCSL")}
- GDP Growth: {get_economic("GDP")}

## News Sentiment
### Positive Sentiment
{get_positive_news()}

### Negative Sentiment
{get_negative_news()}

## Reddit Trending
{get_reddit_trending()}

## Unusual Activity
- Insider Trades: {get_insider_summary()}
- Options Flow: {get_options_summary()}

## Technical Signals
{get_technical_signals()}

## Analysis Questions for Claude:
1. What are the key market themes today?
2. Which stocks show the strongest momentum?
3. Are there any concerning economic signals?
4. What sectors are rotating?
5. Any high-conviction trade ideas?
"""
```

## API Endpoints

```yaml
Data Import:
  POST /import/daily:
    body: { symbols: ["AAPL", "GOOGL", ...] }
    response: { status, imported, errors }

  POST /import/yahoo:
    body: { symbols, period }
    response: { imported, data }

  POST /import/news:
    response: { articles_imported, sources }

  GET /import/status:
    response: {
      rate_limits: { ... },
      last_import: "...",
      next_available: { ... }
    }

Data Access:
  GET /data/market/{symbol}:
    query: { period, interval }
    response: { prices, volume, indicators }

  GET /data/news:
    query: { symbols, date, sentiment }
    response: [ { article }, ... ]

  GET /data/sentiment/{symbol}:
    response: {
      news_sentiment,
      reddit_sentiment,
      overall_score
    }

Export:
  GET /export/claude:
    query: { date, symbols }
    response: { markdown: "..." }

  GET /export/json:
    query: { date, data_types }
    response: { ... }
```

## Implementation Phases

### Phase 1: Core Data Sources (Week 1)
- Yahoo Finance integration
- Local SQLite database
- Basic import dashboard
- Manual import triggers

### Phase 2: Supplementary Sources (Week 2)
- Alpha Vantage integration
- FMP integration
- FRED economic data
- Rate limit management

### Phase 3: News & Sentiment (Week 3)
- RSS feed aggregation
- Reddit scraping setup
- Google Trends integration
- Sentiment analysis

### Phase 4: Export & Analysis (Week 4)
- Claude export formats
- Analysis templates
- Historical tracking
- Performance metrics

## Success Metrics
- Data coverage: 95% of needed information
- Import time: < 5 minutes daily
- Storage usage: < 5GB
- Zero API costs
- Rate limit compliance: 100%