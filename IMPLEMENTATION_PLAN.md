# StarkMatter Trading Platform - Implementation Plan

## Overview
Step-by-step implementation plan for building a local-first, AI-powered trading platform using free data sources and Claude Code for analysis.

## Project Timeline: 6 Weeks

---

## Phase 1: Foundation Setup (Week 1)
**Goal**: Set up development environment and core infrastructure

### Day 1-2: Environment Setup

#### 1.1 Python Backend Setup
```bash
# Create virtual environment
cd /Users/brian/StarkMatter
python3 -m venv venv
source venv/bin/activate

# Install core dependencies
pip install fastapi uvicorn sqlalchemy yfinance pandas numpy
pip install python-dotenv aiofiles httpx beautifulsoup4 feedparser
pip install praw  # Reddit API
pip install fredapi  # FRED economic data
pip install ta-lib  # Technical indicators (may need brew install ta-lib first)

# Save requirements
pip freeze > requirements.txt
```

#### 1.2 Database Setup
```python
# Create api/database.py
import sqlite3
from pathlib import Path

DB_PATH = Path("data/trading.db")
DB_PATH.parent.mkdir(exist_ok=True)

def init_database():
    """Initialize SQLite database with schema"""
    conn = sqlite3.connect(DB_PATH)

    # Create tables
    with open('api/schema.sql', 'r') as f:
        conn.executescript(f.read())

    conn.commit()
    conn.close()
```

#### 1.3 Create Database Schema
```sql
-- api/schema.sql

-- Market data table
CREATE TABLE IF NOT EXISTS market_data (
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

-- Add indexes for performance
CREATE INDEX idx_symbol_date ON market_data(symbol, date);

-- Continue with all tables from requirements...
```

### Day 3-4: Core API Structure

#### 1.4 FastAPI Application Setup
```python
# api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="StarkMatter Trading API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    from database import init_database
    init_database()

@app.get("/")
async def root():
    return {"message": "StarkMatter Trading API", "status": "running"}
```

#### 1.5 Project Structure
```
StarkMatter/
├── api/
│   ├── main.py              # FastAPI app
│   ├── database.py          # Database connection
│   ├── schema.sql           # Database schema
│   ├── models/              # SQLAlchemy models
│   ├── routers/             # API endpoints
│   │   ├── market_data.py
│   │   ├── portfolio.py
│   │   └── analysis.py
│   ├── services/            # Business logic
│   │   ├── data_import.py
│   │   ├── technical_analysis.py
│   │   └── sentiment.py
│   └── utils/               # Helpers
├── data/                    # Local data storage
│   ├── trading.db          # SQLite database
│   └── backups/            # Database backups
├── ui/                      # React frontend (existing)
├── scripts/                 # Utility scripts
│   ├── morning_import.py
│   └── backtest.py
└── notebooks/              # Jupyter notebooks for analysis
```

### Day 5: Configuration Management

#### 1.6 Environment Configuration
```python
# .env file
# Free API Keys (register for free tiers)
ALPHA_VANTAGE_API_KEY=your_free_key_here
FMP_API_KEY=your_free_key_here
FRED_API_KEY=your_free_key_here
REDDIT_CLIENT_ID=your_reddit_app_id
REDDIT_CLIENT_SECRET=your_reddit_secret

# Rate Limits (calls per day)
ALPHA_VANTAGE_LIMIT=25
FMP_LIMIT=250

# Watchlist
DEFAULT_SYMBOLS=AAPL,GOOGL,MSFT,NVDA,TSLA,SPY,QQQ
```

---

## Phase 2: Data Import Layer (Week 2)
**Goal**: Implement all free data source integrations

### Day 6-7: Yahoo Finance Integration

#### 2.1 Yahoo Finance Service
```python
# api/services/yahoo_import.py
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd

class YahooFinanceService:
    def fetch_historical_data(self, symbol: str, period: str = "1mo"):
        """Fetch historical price data"""
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        return hist

    def fetch_quote(self, symbol: str):
        """Get real-time quote"""
        ticker = yf.Ticker(symbol)
        return ticker.info

    def fetch_news(self, symbol: str):
        """Get latest news"""
        ticker = yf.Ticker(symbol)
        return ticker.news

    def bulk_import(self, symbols: list):
        """Import data for multiple symbols"""
        results = {}
        for symbol in symbols:
            try:
                results[symbol] = {
                    'history': self.fetch_historical_data(symbol),
                    'quote': self.fetch_quote(symbol),
                    'news': self.fetch_news(symbol)
                }
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
        return results
```

### Day 8-9: Free API Integrations

#### 2.2 Alpha Vantage Integration (Rate Limited)
```python
# api/services/alpha_vantage.py
import requests
from typing import Dict
import time

class AlphaVantageService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
        self.daily_calls = 0
        self.max_daily = 25

    def fetch_technical_indicator(self, symbol: str, indicator: str):
        """Fetch technical indicators (RSI, MACD, etc.)"""
        if self.daily_calls >= self.max_daily:
            raise Exception("Daily API limit reached")

        params = {
            'function': indicator,
            'symbol': symbol,
            'interval': 'daily',
            'apikey': self.api_key
        }

        response = requests.get(self.base_url, params=params)
        self.daily_calls += 1

        return response.json()
```

#### 2.3 FRED Economic Data
```python
# api/services/fred_import.py
from fredapi import Fred

class FREDService:
    def __init__(self, api_key: str):
        self.fred = Fred(api_key=api_key)

    def fetch_economic_indicators(self):
        """Fetch key economic indicators"""
        indicators = {
            'DGS10': 'fetch_10_year_treasury',
            'UNRATE': 'unemployment_rate',
            'CPIAUCSL': 'cpi_inflation',
            'GDP': 'gdp_growth',
            'DEXUSEU': 'usd_eur_exchange',
            'VIXCLS': 'vix_close'
        }

        data = {}
        for code, name in indicators.items():
            try:
                data[name] = self.fred.get_series_latest_release(code)
            except Exception as e:
                print(f"Error fetching {name}: {e}")

        return data
```

### Day 10: News & Sentiment Scrapers

#### 2.4 RSS News Aggregator
```python
# api/services/news_aggregator.py
import feedparser
from datetime import datetime

class NewsAggregator:
    def __init__(self):
        self.feeds = {
            'CNBC': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
            'MarketWatch': 'http://feeds.marketwatch.com/marketwatch/topstories',
            'Reuters': 'https://feeds.reuters.com/reuters/businessNews',
            'Yahoo': 'https://feeds.finance.yahoo.com/rss/2.0/headline'
        }

    def fetch_all_news(self):
        """Aggregate news from all sources"""
        all_articles = []

        for source, url in self.feeds.items():
            feed = feedparser.parse(url)

            for entry in feed.entries[:10]:  # Last 10 articles
                article = {
                    'title': entry.title,
                    'source': source,
                    'url': entry.link,
                    'published': entry.published_parsed,
                    'summary': entry.get('summary', '')
                }
                all_articles.append(article)

        return all_articles
```

#### 2.5 Reddit Sentiment Scraper
```python
# api/services/reddit_scraper.py
import praw
from textblob import TextBlob

class RedditScraper:
    def __init__(self, client_id: str, client_secret: str):
        self.reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent='StarkMatter Trading Bot'
        )

    def scrape_subreddit(self, subreddit_name: str = 'wallstreetbets'):
        """Scrape posts and analyze sentiment"""
        subreddit = self.reddit.subreddit(subreddit_name)
        posts_data = []

        for post in subreddit.hot(limit=50):
            # Extract mentioned tickers
            tickers = self.extract_tickers(post.title + ' ' + post.selftext)

            # Analyze sentiment
            sentiment = TextBlob(post.title).sentiment.polarity

            posts_data.append({
                'title': post.title,
                'score': post.score,
                'num_comments': post.num_comments,
                'tickers': tickers,
                'sentiment': sentiment,
                'created': post.created_utc
            })

        return posts_data

    def extract_tickers(self, text: str):
        """Extract stock tickers from text"""
        import re
        # Match 1-5 letter uppercase words that look like tickers
        pattern = r'\b[A-Z]{1,5}\b'
        potential_tickers = re.findall(pattern, text)

        # Filter common words
        common_words = {'I', 'A', 'THE', 'AND', 'OR', 'BUT', 'IF'}
        tickers = [t for t in potential_tickers if t not in common_words]

        return tickers
```

---

## Phase 3: Backend API Development (Week 3)
**Goal**: Build FastAPI endpoints and business logic

### Day 11-12: Market Data Endpoints

#### 3.1 Market Data Router
```python
# api/routers/market_data.py
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import date

router = APIRouter(prefix="/api/market", tags=["market"])

@router.post("/import/daily")
async def import_daily_data(symbols: List[str] = Query(default=None)):
    """Import daily market data for symbols"""
    if not symbols:
        symbols = get_default_symbols()

    # Run import services
    yahoo_data = YahooFinanceService().bulk_import(symbols)

    # Save to database
    save_to_database(yahoo_data)

    return {"status": "success", "symbols_imported": len(symbols)}

@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """Get latest quote for a symbol"""
    # Query database first
    db_quote = get_from_database(symbol)

    # If stale, fetch fresh
    if is_stale(db_quote):
        fresh_quote = YahooFinanceService().fetch_quote(symbol)
        save_quote(fresh_quote)
        return fresh_quote

    return db_quote

@router.get("/historical/{symbol}")
async def get_historical(
    symbol: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get historical price data"""
    data = query_historical_data(symbol, start_date, end_date)
    return data
```

### Day 13-14: Portfolio Management

#### 3.2 Portfolio Service
```python
# api/services/portfolio.py
from typing import List, Dict
import sqlite3

class PortfolioService:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def add_position(self, symbol: str, quantity: float, price: float):
        """Add a new position or update existing"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Check if position exists
        cursor.execute(
            "SELECT quantity, average_cost FROM positions WHERE symbol = ?",
            (symbol,)
        )
        existing = cursor.fetchone()

        if existing:
            # Update existing position
            old_qty, old_cost = existing
            new_qty = old_qty + quantity
            new_avg = ((old_qty * old_cost) + (quantity * price)) / new_qty

            cursor.execute(
                "UPDATE positions SET quantity = ?, average_cost = ? WHERE symbol = ?",
                (new_qty, new_avg, symbol)
            )
        else:
            # Insert new position
            cursor.execute(
                "INSERT INTO positions (symbol, quantity, average_cost) VALUES (?, ?, ?)",
                (symbol, quantity, price)
            )

        conn.commit()
        conn.close()

    def calculate_portfolio_value(self):
        """Calculate total portfolio value"""
        positions = self.get_all_positions()
        total_value = 0

        for position in positions:
            current_price = self.get_current_price(position['symbol'])
            position_value = position['quantity'] * current_price
            total_value += position_value

        return total_value
```

### Day 15: Technical Analysis Engine

#### 3.3 Technical Indicators Service
```python
# api/services/technical_analysis.py
import pandas as pd
import numpy as np
from ta import add_all_ta_features
from ta.utils import dropna

class TechnicalAnalysisService:
    def calculate_indicators(self, df: pd.DataFrame):
        """Calculate all technical indicators"""
        # Clean data
        df = dropna(df)

        # Add all technical indicators
        df = add_all_ta_features(
            df, open="open", high="high", low="low",
            close="close", volume="volume"
        )

        return df

    def find_signals(self, df: pd.DataFrame):
        """Find buy/sell signals"""
        signals = []

        # RSI signals
        if df['momentum_rsi'].iloc[-1] < 30:
            signals.append({'type': 'BUY', 'indicator': 'RSI_OVERSOLD'})
        elif df['momentum_rsi'].iloc[-1] > 70:
            signals.append({'type': 'SELL', 'indicator': 'RSI_OVERBOUGHT'})

        # MACD signals
        if df['trend_macd'].iloc[-1] > df['trend_macd_signal'].iloc[-1]:
            if df['trend_macd'].iloc[-2] <= df['trend_macd_signal'].iloc[-2]:
                signals.append({'type': 'BUY', 'indicator': 'MACD_CROSS'})

        return signals
```

---

## Phase 4: Frontend Development (Week 4)
**Goal**: Build React dashboard for data visualization and management

### Day 16-17: Dashboard Components

#### 4.1 Main Dashboard
```jsx
// ui/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { MarketOverview } from '../components/MarketOverview';
import { Portfolio } from '../components/Portfolio';
import { Watchlist } from '../components/Watchlist';
import { ImportStatus } from '../components/ImportStatus';

export function Dashboard() {
  const [marketData, setMarketData] = useState(null);
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const response = await fetch('http://localhost:8000/api/dashboard');
    const data = await response.json();
    setMarketData(data.market);
    setPortfolio(data.portfolio);
  };

  const runMorningImport = async () => {
    const response = await fetch('http://localhost:8000/api/import/daily', {
      method: 'POST'
    });
    const result = await response.json();
    alert(`Import complete: ${result.symbols_imported} symbols`);
    fetchDashboardData(); // Refresh
  };

  return (
    <div className="dashboard">
      <h1>StarkMatter Trading Dashboard</h1>

      <button onClick={runMorningImport}>
        Run Morning Import
      </button>

      <div className="dashboard-grid">
        <MarketOverview data={marketData} />
        <Portfolio data={portfolio} />
        <Watchlist />
        <ImportStatus />
      </div>
    </div>
  );
}
```

### Day 18-19: Data Visualization

#### 4.2 Chart Component
```jsx
// ui/src/components/StockChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';

export function StockChart({ symbol, data }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Price',
        data: data.map(d => d.close),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="stock-chart">
      <h3>{symbol} Price Chart</h3>
      <Line data={chartData} />
    </div>
  );
}
```

### Day 20: Claude Export Tools

#### 4.3 Export Component
```jsx
// ui/src/components/ClaudeExport.jsx
import React, { useState } from 'react';

export function ClaudeExport() {
  const [exportData, setExportData] = useState('');

  const generateExport = async (type) => {
    const response = await fetch(`http://localhost:8000/api/export/${type}`);
    const data = await response.json();
    setExportData(data.markdown);
  };

  return (
    <div className="claude-export">
      <h3>Export for Claude Analysis</h3>

      <div className="export-buttons">
        <button onClick={() => generateExport('market-summary')}>
          Market Summary
        </button>
        <button onClick={() => generateExport('portfolio')}>
          Portfolio Analysis
        </button>
        <button onClick={() => generateExport('technical')}>
          Technical Signals
        </button>
      </div>

      <textarea
        value={exportData}
        readOnly
        rows={20}
        placeholder="Export data will appear here..."
      />

      <button onClick={() => navigator.clipboard.writeText(exportData)}>
        Copy to Clipboard
      </button>
    </div>
  );
}
```

---

## Phase 5: Paper Trading & Analysis (Week 5)
**Goal**: Implement paper trading and Claude integration helpers

### Day 21-22: Paper Trading Engine

#### 5.1 Paper Trading Service
```python
# api/services/paper_trading.py
from datetime import datetime
from typing import Dict, List

class PaperTradingEngine:
    def __init__(self, starting_balance: float = 10000):
        self.balance = starting_balance
        self.positions = {}
        self.trades = []

    def place_order(self, symbol: str, quantity: int, order_type: str):
        """Place a paper trade order"""
        current_price = self.get_current_price(symbol)

        if order_type == 'BUY':
            cost = quantity * current_price
            if cost > self.balance:
                return {'error': 'Insufficient funds'}

            self.balance -= cost
            if symbol in self.positions:
                # Update existing position
                old_qty = self.positions[symbol]['quantity']
                old_avg = self.positions[symbol]['avg_cost']
                new_qty = old_qty + quantity
                new_avg = ((old_qty * old_avg) + cost) / new_qty

                self.positions[symbol] = {
                    'quantity': new_qty,
                    'avg_cost': new_avg
                }
            else:
                # New position
                self.positions[symbol] = {
                    'quantity': quantity,
                    'avg_cost': current_price
                }

            # Log trade
            self.trades.append({
                'timestamp': datetime.now(),
                'symbol': symbol,
                'action': 'BUY',
                'quantity': quantity,
                'price': current_price,
                'balance_after': self.balance
            })

        elif order_type == 'SELL':
            if symbol not in self.positions:
                return {'error': 'No position to sell'}

            if quantity > self.positions[symbol]['quantity']:
                return {'error': 'Insufficient shares'}

            proceeds = quantity * current_price
            self.balance += proceeds

            # Update position
            self.positions[symbol]['quantity'] -= quantity
            if self.positions[symbol]['quantity'] == 0:
                del self.positions[symbol]

            # Log trade
            self.trades.append({
                'timestamp': datetime.now(),
                'symbol': symbol,
                'action': 'SELL',
                'quantity': quantity,
                'price': current_price,
                'balance_after': self.balance
            })

        return {'status': 'success', 'trade': self.trades[-1]}

    def get_performance(self):
        """Calculate portfolio performance"""
        total_value = self.balance

        for symbol, position in self.positions.items():
            current_price = self.get_current_price(symbol)
            position_value = position['quantity'] * current_price
            total_value += position_value

        return {
            'total_value': total_value,
            'cash_balance': self.balance,
            'positions_value': total_value - self.balance,
            'return_pct': ((total_value - 10000) / 10000) * 100
        }
```

### Day 23-24: Claude Helper Scripts

#### 5.2 Claude Analysis Helpers
```python
# scripts/claude_helpers.py
import sqlite3
import pandas as pd
from datetime import datetime, timedelta

class ClaudeAnalysisHelper:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def generate_morning_summary(self):
        """Generate morning market summary for Claude"""
        conn = sqlite3.connect(self.db_path)

        # Get pre-market movers
        movers_query = """
        SELECT symbol,
               (close - lag(close) OVER (PARTITION BY symbol ORDER BY date)) / lag(close) OVER (PARTITION BY symbol ORDER BY date) * 100 as change_pct
        FROM market_data
        WHERE date = date('now', '-1 day')
        ORDER BY abs(change_pct) DESC
        LIMIT 10
        """
        movers = pd.read_sql_query(movers_query, conn)

        # Get sentiment summary
        sentiment_query = """
        SELECT symbol, AVG(sentiment_score) as avg_sentiment, COUNT(*) as mentions
        FROM reddit_mentions
        WHERE created_at > datetime('now', '-24 hours')
        GROUP BY symbol
        ORDER BY mentions DESC
        LIMIT 10
        """
        sentiment = pd.read_sql_query(sentiment_query, conn)

        # Format for Claude
        summary = f"""
# Market Analysis for {datetime.now().strftime('%Y-%m-%d')}

## Top Movers (Yesterday)
{movers.to_markdown()}

## Reddit Sentiment (Last 24h)
{sentiment.to_markdown()}

## Analysis Questions:
1. Which stocks show the strongest momentum?
2. Is sentiment aligned with price action?
3. Any contrarian opportunities?
4. Key levels to watch today?
"""

        conn.close()
        return summary

    def analyze_stock(self, symbol: str):
        """Generate comprehensive stock analysis for Claude"""
        conn = sqlite3.connect(self.db_path)

        # Get price data
        price_query = f"""
        SELECT date, open, high, low, close, volume
        FROM market_data
        WHERE symbol = '{symbol}'
        ORDER BY date DESC
        LIMIT 30
        """
        prices = pd.read_sql_query(price_query, conn)

        # Get technical indicators
        tech_query = f"""
        SELECT indicator, value
        FROM technical_indicators
        WHERE symbol = '{symbol}' AND date = date('now')
        """
        technicals = pd.read_sql_query(tech_query, conn)

        # Get news sentiment
        news_query = f"""
        SELECT title, sentiment_score, source
        FROM news
        WHERE symbols LIKE '%{symbol}%'
        ORDER BY published_at DESC
        LIMIT 5
        """
        news = pd.read_sql_query(news_query, conn)

        analysis = f"""
# {symbol} Analysis

## Price Action (Last 30 Days)
{prices.head(5).to_markdown()}

## Technical Indicators
{technicals.to_markdown()}

## Recent News Sentiment
{news.to_markdown()}

## Questions for Analysis:
1. Technical setup: Bullish or bearish?
2. Is news sentiment supportive of price action?
3. Entry and exit points?
4. Risk/reward assessment?
"""

        conn.close()
        return analysis
```

---

## Phase 6: Testing & Optimization (Week 6)
**Goal**: Test system, optimize performance, and create documentation

### Day 25-26: Integration Testing

#### 6.1 Test Suite
```python
# tests/test_integration.py
import pytest
import asyncio
from api.services.yahoo_import import YahooFinanceService
from api.services.portfolio import PortfolioService

def test_yahoo_import():
    """Test Yahoo Finance data import"""
    service = YahooFinanceService()
    data = service.fetch_historical_data('AAPL', period='5d')

    assert not data.empty
    assert 'Close' in data.columns
    assert len(data) >= 5

def test_portfolio_calculations():
    """Test portfolio value calculations"""
    portfolio = PortfolioService('test.db')

    # Add test positions
    portfolio.add_position('AAPL', 10, 150.00)
    portfolio.add_position('GOOGL', 5, 140.00)

    value = portfolio.calculate_portfolio_value()
    assert value > 0

@pytest.mark.asyncio
async def test_morning_import_workflow():
    """Test complete morning import workflow"""
    # 1. Import data
    # 2. Calculate indicators
    # 3. Generate summary
    # 4. Verify database
    pass
```

### Day 27: Performance Optimization

#### 6.2 Database Optimization
```python
# scripts/optimize_database.py
import sqlite3

def optimize_database(db_path: str):
    """Optimize database performance"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Add indexes
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_market_symbol_date ON market_data(symbol, date)",
        "CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at)",
        "CREATE INDEX IF NOT EXISTS idx_reddit_created ON reddit_mentions(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_tech_symbol_indicator ON technical_indicators(symbol, indicator)"
    ]

    for index in indexes:
        cursor.execute(index)

    # Vacuum database
    cursor.execute("VACUUM")

    # Analyze for query optimization
    cursor.execute("ANALYZE")

    conn.commit()
    conn.close()
    print("Database optimized!")
```

### Day 28-30: Documentation & Deployment

#### 6.3 User Guide
```markdown
# StarkMatter Trading Platform - User Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   npm install --prefix ui
   ```

2. **Configure API Keys**
   - Copy `.env.example` to `.env`
   - Add your free API keys

3. **Start the Application**
   ```bash
   # Terminal 1: Start backend
   python -m uvicorn api.main:app --reload

   # Terminal 2: Start frontend
   cd ui && npm run dev
   ```

4. **Daily Workflow**
   - Open http://localhost:5173
   - Click "Run Morning Import"
   - Review imported data
   - Open Claude Code in VSCode
   - Ask: "Analyze today's market data"

## Features Guide

### Data Import
- Automatic daily imports from free sources
- Manual CSV upload for custom data
- Rate limit management

### Portfolio Management
- Track positions
- Calculate P&L
- Paper trading mode

### Claude Integration
- Direct database access
- Real-time analysis
- Custom prompts

## Troubleshooting

### Common Issues
1. **Import fails**: Check API keys in .env
2. **Database locked**: Close other connections
3. **No data showing**: Run morning import first
```

#### 6.4 Deployment Script
```bash
#!/bin/bash
# scripts/deploy.sh

echo "StarkMatter Trading Platform - Local Deployment"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required. Please install it first."
    exit 1
fi

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Initialize database
python -c "from api.database import init_database; init_database()"

# Install frontend dependencies
cd ui
npm install
cd ..

# Create data directories
mkdir -p data/backups
mkdir -p logs
mkdir -p reports

echo "Setup complete! Run ./scripts/start.sh to begin trading."
```

---

## Implementation Checklist

### Week 1: Foundation ✓
- [ ] Set up Python environment
- [ ] Create SQLite database schema
- [ ] Build FastAPI skeleton
- [ ] Configure project structure
- [ ] Set up environment variables

### Week 2: Data Import ✓
- [ ] Yahoo Finance integration
- [ ] Alpha Vantage integration (rate limited)
- [ ] FRED economic data
- [ ] RSS news aggregator
- [ ] Reddit sentiment scraper

### Week 3: Backend API ✓
- [ ] Market data endpoints
- [ ] Portfolio management
- [ ] Technical analysis engine
- [ ] Data export endpoints
- [ ] WebSocket support

### Week 4: Frontend ✓
- [ ] Dashboard layout
- [ ] Data visualization
- [ ] Import controls
- [ ] Export tools
- [ ] Portfolio viewer

### Week 5: Trading & Analysis ✓
- [ ] Paper trading engine
- [ ] Claude helper scripts
- [ ] Analysis templates
- [ ] Performance tracking
- [ ] Risk management

### Week 6: Polish & Deploy ✓
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment scripts
- [ ] User guide

---

## Key Commands for Claude Code

Once implemented, you can use these commands with Claude:

```python
# Morning routine
"Run the morning data import and show me a summary"

# Analysis
"Analyze AAPL using all available data"
"Find stocks with RSI < 30 in our database"
"Show me the top Reddit mentions"

# Trading
"Set up a paper trade: Buy 100 shares of NVDA"
"Calculate position size for 2% risk on TSLA"
"Show my portfolio performance"

# Backtesting
"Backtest RSI strategy on SPY for last 30 days"
"Test moving average crossover on my watchlist"
```

---

## Success Criteria

✅ **Week 1**: Can start FastAPI server and see database tables
✅ **Week 2**: Can import data from all free sources
✅ **Week 3**: API endpoints return real data
✅ **Week 4**: Frontend displays data and charts
✅ **Week 5**: Can execute paper trades and generate Claude reports
✅ **Week 6**: Complete system working end-to-end

---

## Next Steps After Implementation

1. **Add More Indicators**: Implement additional technical indicators
2. **Improve Sentiment Analysis**: Use better NLP models
3. **Add Backtesting Framework**: More sophisticated strategy testing
4. **Mobile App**: React Native companion app
5. **Community Features**: Share strategies and analysis

---

This plan provides a complete roadmap from empty project to working trading platform in 6 weeks!