# StarkMatter Trading Platform

A local-first, AI-powered trading platform using free data sources. Built with FastAPI, it provides market data aggregation, technical analysis, portfolio management, and paper trading capabilities—all powered by free APIs and designed for analysis with Claude Code.

## Features

### Data Sources (All Free!)
- **Yahoo Finance** - Historical prices, quotes, and news
- **Alpha Vantage** - Technical indicators (25 calls/day free)
- **FRED** - Economic indicators from Federal Reserve
- **RSS Feeds** - News from CNBC, MarketWatch, Reuters, Yahoo
- **Reddit** - Sentiment analysis from r/wallstreetbets and other trading subreddits

### Core Capabilities
- 📊 **Market Data Import** - Automated daily imports from multiple sources
- 📈 **Technical Analysis** - RSI, MACD, Bollinger Bands, Moving Averages, and more
- 💼 **Portfolio Management** - Track positions and P&L
- 📝 **Paper Trading** - Simulated trading with $10,000 virtual account
- 🤖 **Claude Integration** - Export data in markdown format for AI analysis
- 📰 **News & Sentiment** - Aggregate financial news and Reddit sentiment

### Technology Stack
- **FastAPI** - High-performance Python web framework
- **SQLite** - Local database (no external DB required)
- **yfinance** - Yahoo Finance data
- **pandas** - Data analysis
- **ta** - Technical analysis library
- **praw** - Reddit API
- **React** - UI (optional, API-first design)

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Setup

1. Navigate to the project:
```bash
cd /Users/brian/StarkMatter
```

2. Run the deployment script:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

3. Configure your API keys (optional but recommended):
```bash
nano .env
```

Add your free API keys:
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
- **FRED**: https://fred.stlouisfed.org/docs/api/api_key.html
- **Reddit**: https://www.reddit.com/prefs/apps

4. Start the server:
```bash
./scripts/start.sh
```

5. Access the API:
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Frontend (optional): http://localhost:5173

### Stop Servers

```bash
./scripts/stop.sh
```

## Project Structure

```
StarkMatter/
├── api/
│   ├── main.py                    # FastAPI application
│   ├── database.py                # Database connection & init
│   ├── schema.sql                 # Database schema
│   ├── services/                  # Business logic
│   │   ├── yahoo_import.py        # Yahoo Finance integration
│   │   ├── alpha_vantage.py       # Alpha Vantage API
│   │   ├── fred_import.py         # FRED economic data
│   │   ├── news_aggregator.py     # RSS news feeds
│   │   ├── reddit_scraper.py      # Reddit sentiment
│   │   ├── portfolio.py           # Portfolio management
│   │   ├── technical_analysis.py  # Technical indicators
│   │   └── paper_trading.py       # Paper trading engine
│   └── routers/                   # API endpoints
│       ├── market_data.py         # Market data routes
│       └── portfolio.py           # Portfolio routes
├── data/
│   └── trading.db                 # SQLite database
├── scripts/
│   ├── deploy.sh                  # Setup script
│   ├── start.sh                   # Start server
│   ├── stop.sh                    # Stop server
│   └── claude_helpers.py          # Claude analysis tools
├── ui/                            # React frontend (optional)
├── requirements.txt               # Python dependencies
└── .env.example                   # Environment template
```

## Daily Workflow

### 1. Morning Data Import
```bash
# Import market data for your watchlist
curl -X POST "http://localhost:8000/api/market/import/daily"

# Import news
curl -X POST "http://localhost:8000/api/market/import/news"

# Import Reddit sentiment (if configured)
curl -X POST "http://localhost:8000/api/market/import/reddit"

# Import economic indicators (if configured)
curl -X POST "http://localhost:8000/api/market/import/economic"
```

### 2. Analysis with Claude
```bash
# Generate morning summary
python scripts/claude_helpers.py morning

# Analyze a specific stock
python scripts/claude_helpers.py stock AAPL

# Portfolio analysis
python scripts/claude_helpers.py portfolio
```

### 3. Paper Trading
```bash
# View account
curl "http://localhost:8000/api/portfolio/paper/account"

# Execute a trade
curl -X POST "http://localhost:8000/api/portfolio/paper/trade" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "quantity": 10, "order_type": "BUY"}'

# Check performance
curl "http://localhost:8000/api/portfolio/paper/performance"
```

## API Endpoints

### Market Data
- `POST /api/market/import/daily` - Import daily market data for symbols
- `GET /api/market/quote/{symbol}` - Get current quote
- `GET /api/market/historical/{symbol}` - Get historical prices
- `POST /api/market/import/news` - Import latest news
- `GET /api/market/news` - Get news articles
- `POST /api/market/import/reddit` - Scrape Reddit sentiment
- `POST /api/market/import/economic` - Import FRED economic data
- `GET /api/market/signals/{symbol}` - Get technical signals
- `GET /api/market/watchlist` - Get watchlist
- `POST /api/market/watchlist/{symbol}` - Add to watchlist

### Portfolio & Trading
- `GET /api/portfolio` - Get portfolio summary
- `GET /api/portfolio/positions` - Get all positions
- `GET /api/portfolio/positions/{symbol}` - Get specific position
- `POST /api/portfolio/positions` - Add/update position
- `GET /api/portfolio/paper/account` - Get paper trading account
- `GET /api/portfolio/paper/performance` - Get performance metrics
- `POST /api/portfolio/paper/trade` - Execute paper trade
- `GET /api/portfolio/paper/trades` - Get trade history
- `POST /api/portfolio/paper/reset` - Reset paper account
- `GET /api/portfolio/export/summary` - Export for Claude analysis

### General
- `GET /` - API information
- `GET /health` - Health check
- `GET /api/dashboard` - Dashboard summary
- `GET /docs` - Swagger documentation
- `GET /redoc` - ReDoc documentation

## Using with Claude Code

StarkMatter is designed to work seamlessly with Claude Code for market analysis:

1. **Ask Claude to import data:**
   ```
   "Import today's market data for AAPL, GOOGL, and TSLA"
   ```

2. **Ask Claude to analyze:**
   ```
   "Analyze NVDA using all available data in the database"
   "Show me stocks with RSI < 30"
   "What's the sentiment on Reddit for TSLA?"
   ```

3. **Ask Claude for trading advice:**
   ```
   "Should I buy AAPL based on technical indicators?"
   "Show me my portfolio performance"
   "Execute a paper trade: Buy 10 shares of MSFT"
   ```

The platform stores all data locally in SQLite, making it instantly accessible to Claude Code for analysis.

## Example Use Cases

### 1. Technical Analysis
```python
# Get signals for a stock
curl "http://localhost:8000/api/market/signals/AAPL"
```

Returns buy/sell signals based on RSI, MACD, Bollinger Bands, and moving averages.

### 2. Sentiment Analysis
```python
# Check Reddit sentiment
curl -X POST "http://localhost:8000/api/market/import/reddit?subreddits=wallstreetbets,stocks"
```

Aggregates mentions and sentiment scores from trading subreddits.

### 3. Portfolio Tracking
```python
# Add a position
curl -X POST "http://localhost:8000/api/portfolio/positions" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "quantity": 100, "price": 150.00}'

# View portfolio
curl "http://localhost:8000/api/portfolio"
```

## Data Sources & Free Tiers

- **Yahoo Finance**: Unlimited, no API key needed
- **Alpha Vantage**: 25 calls/day (free)
- **FRED**: Unlimited with free API key
- **Reddit**: 60 requests/minute with free app
- **News RSS**: Unlimited, no API key needed

## Troubleshooting

### Issue: API keys not working
- Ensure you've copied `.env.example` to `.env`
- Check that API keys are properly formatted
- The platform will work without API keys (using Yahoo Finance only)

### Issue: Database locked
- Close any other connections to the database
- Restart the server

### Issue: No data showing
- Run the import endpoints first: `/api/market/import/daily`
- Check the logs in `logs/` directory

## License

MIT
