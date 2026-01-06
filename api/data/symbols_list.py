"""
Predefined list of common stock symbols
"""

# S&P 500 top companies
SP500_TOP_100 = [
    "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "GOOG", "META", "TSLA", "UNH", "JNJ",
    "JPM", "V", "PG", "XOM", "HD", "CVX", "MA", "ABBV", "MRK", "PEP",
    "AVGO", "COST", "KO", "LLY", "WMT", "CSCO", "PFE", "BAC", "MCD", "CRM",
    "ACN", "TMO", "ABT", "CMCSA", "NFLX", "NKE", "WFC", "DIS", "TMUS", "VZ",
    "ADBE", "DHR", "PM", "TXN", "NEE", "UPS", "COP", "INTC", "LIN", "RTX",
    "BMY", "ORCL", "UNP", "HON", "LOW", "QCOM", "AMGN", "MS", "SPGI", "BA",
    "CAT", "IBM", "SBUX", "GS", "CVS", "DE", "INTU", "BLK", "AMD", "MDT",
    "GILD", "AXP", "NOW", "PLD", "C", "ELV", "ISRG", "SCHW", "MDLZ", "AMT",
    "ADI", "PYPL", "TJX", "BKNG", "REGN", "SYK", "ADP", "VRTX", "CI", "CB",
    "ZTS", "LRCX", "MO", "TROW", "ETN", "BSX", "BDX", "ATVI", "FISV", "CSX"
]

# Tech stocks
TECH_STOCKS = [
    "AAPL", "MSFT", "GOOGL", "META", "AMZN", "NVDA", "TSLA", "AMD", "INTC", "ORCL",
    "CRM", "ADBE", "CSCO", "IBM", "QCOM", "AVGO", "TXN", "NFLX", "PYPL", "SHOP",
    "SQ", "UBER", "LYFT", "SNAP", "PINS", "TWTR", "ROKU", "SPOT", "ZM", "DOCU",
    "OKTA", "CRWD", "NET", "DDOG", "SNOW", "PLTR", "U", "RBLX", "COIN", "HOOD"
]

# Financial stocks
FINANCIAL_STOCKS = [
    "JPM", "BAC", "WFC", "GS", "MS", "C", "USB", "PNC", "TFC", "BK",
    "AXP", "SCHW", "BLK", "SPGI", "CME", "ICE", "MCO", "MSCI", "COF", "DFS"
]

# Healthcare stocks
HEALTHCARE_STOCKS = [
    "JNJ", "UNH", "PFE", "ABBV", "TMO", "MRK", "ABT", "DHR", "CVS", "LLY",
    "BMY", "AMGN", "MDT", "GILD", "ISRG", "SYK", "BDX", "VRTX", "REGN", "ZTS"
]

# Consumer stocks
CONSUMER_STOCKS = [
    "AMZN", "HD", "WMT", "MCD", "NKE", "SBUX", "COST", "LOW", "TJX", "TGT",
    "KO", "PEP", "PG", "CL", "KMB", "GIS", "K", "MDLZ", "HSY", "MNST"
]

# Energy stocks
ENERGY_STOCKS = [
    "XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "PXD", "OXY",
    "KMI", "WMB", "ET", "EPD", "TRGP", "HAL", "BKR", "DVN", "FANG", "HES"
]

# ETFs and Indices
ETFS_INDICES = [
    "SPY", "QQQ", "DIA", "IWM", "VOO", "VTI", "EEM", "XLF", "XLK", "XLE",
    "XLV", "XLI", "XLY", "XLP", "XLB", "XLRE", "XLU", "GLD", "SLV", "TLT"
]

# Combine all unique symbols
ALL_SYMBOLS = list(set(
    SP500_TOP_100 +
    TECH_STOCKS +
    FINANCIAL_STOCKS +
    HEALTHCARE_STOCKS +
    CONSUMER_STOCKS +
    ENERGY_STOCKS +
    ETFS_INDICES
))

# Sector mapping
SYMBOL_SECTORS = {
    # Technology
    "AAPL": "Technology", "MSFT": "Technology", "GOOGL": "Technology", "GOOG": "Technology",
    "META": "Technology", "NVDA": "Technology", "AVGO": "Technology", "CSCO": "Technology",
    "ORCL": "Technology", "ADBE": "Technology", "CRM": "Technology", "INTC": "Technology",
    "AMD": "Technology", "QCOM": "Technology", "TXN": "Technology", "IBM": "Technology",
    "NFLX": "Communication", "PYPL": "Technology", "SHOP": "Technology", "SQ": "Technology",

    # Healthcare
    "JNJ": "Healthcare", "UNH": "Healthcare", "PFE": "Healthcare", "ABBV": "Healthcare",
    "MRK": "Healthcare", "TMO": "Healthcare", "ABT": "Healthcare", "DHR": "Healthcare",
    "CVS": "Healthcare", "LLY": "Healthcare", "BMY": "Healthcare", "AMGN": "Healthcare",
    "MDT": "Healthcare", "GILD": "Healthcare", "ISRG": "Healthcare", "SYK": "Healthcare",

    # Financial
    "JPM": "Financial", "V": "Financial", "MA": "Financial", "BAC": "Financial",
    "WFC": "Financial", "GS": "Financial", "MS": "Financial", "C": "Financial",
    "AXP": "Financial", "SCHW": "Financial", "BLK": "Financial", "SPGI": "Financial",

    # Consumer
    "AMZN": "Consumer Discretionary", "TSLA": "Consumer Discretionary", "HD": "Consumer Discretionary",
    "WMT": "Consumer Staples", "MCD": "Consumer Discretionary", "NKE": "Consumer Discretionary",
    "SBUX": "Consumer Discretionary", "COST": "Consumer Staples", "PG": "Consumer Staples",
    "KO": "Consumer Staples", "PEP": "Consumer Staples", "LOW": "Consumer Discretionary",

    # Energy
    "XOM": "Energy", "CVX": "Energy", "COP": "Energy", "SLB": "Energy",
    "EOG": "Energy", "MPC": "Energy", "PSX": "Energy", "VLO": "Energy",

    # Industrials
    "UNP": "Industrials", "HON": "Industrials", "CAT": "Industrials", "BA": "Industrials",
    "DE": "Industrials", "UPS": "Industrials", "RTX": "Industrials", "LMT": "Industrials",

    # Utilities
    "NEE": "Utilities", "DUK": "Utilities", "SO": "Utilities", "D": "Utilities",

    # Real Estate
    "PLD": "Real Estate", "AMT": "Real Estate", "CCI": "Real Estate", "EQIX": "Real Estate",

    # Materials
    "LIN": "Materials", "APD": "Materials", "FCX": "Materials", "NEM": "Materials",

    # Communication
    "DIS": "Communication", "CMCSA": "Communication", "VZ": "Communication", "TMUS": "Communication",
}

# Exchange mapping (simplified - most are NYSE or NASDAQ)
def get_exchange(symbol):
    """Get exchange for a symbol (simplified)"""
    # Most tech stocks are on NASDAQ
    tech_symbols = ["AAPL", "MSFT", "GOOGL", "GOOG", "META", "NVDA", "AMZN", "TSLA",
                   "INTC", "CSCO", "ADBE", "NFLX", "PYPL", "AMD", "QCOM"]
    if symbol in tech_symbols:
        return "NASDAQ"
    # ETFs can be on multiple exchanges, default to NYSE
    elif symbol in ETFS_INDICES:
        return "NYSE ARCA"
    # Default to NYSE for most large caps
    else:
        return "NYSE"