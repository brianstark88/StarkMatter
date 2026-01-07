-- StarkMatter Trading Platform Database Schema
-- SQLite Database

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

CREATE INDEX IF NOT EXISTS idx_market_symbol_date ON market_data(symbol, date);
CREATE INDEX IF NOT EXISTS idx_market_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_date ON market_data(date);

-- Portfolio positions
CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    quantity REAL NOT NULL,
    average_cost REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades history
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL, -- 'BUY' or 'SELL'
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    balance_after REAL,
    paper_trade BOOLEAN DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);

-- Technical indicators
CREATE TABLE IF NOT EXISTS technical_indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    indicator TEXT NOT NULL,
    value REAL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, indicator, date)
);

CREATE INDEX IF NOT EXISTS idx_tech_symbol_indicator ON technical_indicators(symbol, indicator);
CREATE INDEX IF NOT EXISTS idx_tech_date ON technical_indicators(date);

-- News articles
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    source TEXT,
    url TEXT UNIQUE,
    summary TEXT,
    symbols TEXT, -- JSON array of symbols
    sentiment_score REAL,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_news_symbols ON news(symbols);

-- Reddit mentions
CREATE TABLE IF NOT EXISTS reddit_mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT UNIQUE,
    subreddit TEXT,
    title TEXT,
    score INTEGER,
    num_comments INTEGER,
    symbol TEXT,
    sentiment_score REAL,
    created_at TIMESTAMP,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reddit_symbol ON reddit_mentions(symbol);
CREATE INDEX IF NOT EXISTS idx_reddit_created ON reddit_mentions(created_at);

-- Economic indicators
CREATE TABLE IF NOT EXISTS economic_indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_code TEXT NOT NULL,
    indicator_name TEXT,
    value REAL,
    date DATE NOT NULL,
    source TEXT DEFAULT 'FRED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(indicator_code, date)
);

CREATE INDEX IF NOT EXISTS idx_econ_indicator_date ON economic_indicators(indicator_code, date);

-- Master symbols table
CREATE TABLE IF NOT EXISTS symbols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    exchange TEXT, -- NYSE, NASDAQ, AMEX, etc.
    market_cap REAL,
    sector TEXT,
    industry TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_updated TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_symbols_symbol ON symbols(symbol);
CREATE INDEX IF NOT EXISTS idx_symbols_exchange ON symbols(exchange);
CREATE INDEX IF NOT EXISTS idx_symbols_sector ON symbols(sector);
CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Paper trading account
CREATE TABLE IF NOT EXISTS paper_account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance REAL NOT NULL,
    starting_balance REAL NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial paper trading account
INSERT OR IGNORE INTO paper_account (id, balance, starting_balance) VALUES (1, 10000.0, 10000.0);

-- Signals table for storing buy/sell signals
CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL, -- 'BUY' or 'SELL'
    indicator TEXT NOT NULL,
    strength REAL, -- 0-100
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signals_symbol_date ON signals(symbol, date);

-- AI analysis history
CREATE TABLE IF NOT EXISTS ai_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_category TEXT NOT NULL,
    template_name TEXT NOT NULL,
    symbol TEXT,
    input_data TEXT,          -- JSON of all input parameters
    rendered_prompt TEXT,     -- Full prompt that was sent
    response TEXT,            -- Raw AI response
    structured_data TEXT,     -- Parsed structured data (JSON)
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    model TEXT,
    execution_mode TEXT DEFAULT 'manual',      -- 'api' or 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_symbol ON ai_analyses(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_template ON ai_analyses(template_category, template_name);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created ON ai_analyses(created_at DESC);

-- User feedback on analyses
CREATE TABLE IF NOT EXISTS ai_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    feedback TEXT,
    helpful BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id)
);
