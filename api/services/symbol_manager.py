"""
Symbol Manager Service
Handles fetching and managing stock symbols from various sources
"""
import logging
from typing import List, Dict, Optional
import pandas as pd
from datetime import datetime
import sys
import os

# Import symbol data sources
try:
    from yahoo_fin import stock_info as si
except ImportError:
    si = None

try:
    from pytickersymbols import PyTickerSymbols
except ImportError:
    PyTickerSymbols = None

try:
    from pandas_datareader import nasdaq_trader
except ImportError:
    nasdaq_trader = None

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_query, execute_many, get_connection

logger = logging.getLogger(__name__)


class SymbolManager:
    """Service for managing stock symbols database"""

    def __init__(self):
        self.pts = PyTickerSymbols() if PyTickerSymbols else None

    def get_sp500_symbols(self) -> List[Dict]:
        """Get S&P 500 symbols with metadata"""
        symbols = []

        try:
            if si:
                # Get S&P 500 tickers from yahoo_fin
                sp500_tickers = si.tickers_sp500()
                logger.info(f"Fetched {len(sp500_tickers)} S&P 500 symbols from yahoo_fin")

                # Get additional metadata from pytickersymbols if available
                if self.pts:
                    sp500_stocks = self.pts.get_stocks_by_index('S&P 500')
                    symbol_dict = {stock['symbol']: stock for stock in sp500_stocks}

                    for ticker in sp500_tickers:
                        stock_info = symbol_dict.get(ticker, {})
                        symbols.append({
                            'symbol': ticker,
                            'name': stock_info.get('name', ''),
                            'exchange': 'NYSE',  # Most S&P 500 are NYSE
                            'sector': stock_info.get('sector', ''),
                            'industry': stock_info.get('industry', ''),
                            'is_active': True
                        })
                else:
                    # Just use ticker symbols without metadata
                    for ticker in sp500_tickers:
                        symbols.append({
                            'symbol': ticker,
                            'name': '',
                            'exchange': 'NYSE',
                            'sector': '',
                            'industry': '',
                            'is_active': True
                        })

            elif self.pts:
                # Fallback to pytickersymbols
                sp500_stocks = self.pts.get_stocks_by_index('S&P 500')
                for stock in sp500_stocks:
                    symbols.append({
                        'symbol': stock['symbol'],
                        'name': stock.get('name', ''),
                        'exchange': 'NYSE',
                        'sector': stock.get('sector', ''),
                        'industry': stock.get('industry', ''),
                        'is_active': True
                    })
                logger.info(f"Fetched {len(symbols)} S&P 500 symbols from pytickersymbols")

        except Exception as e:
            logger.error(f"Error fetching S&P 500 symbols: {e}")

        return symbols

    def get_nasdaq_symbols(self) -> List[Dict]:
        """Get NASDAQ symbols with metadata"""
        symbols = []

        try:
            if si:
                # Get NASDAQ tickers from yahoo_fin
                nasdaq_tickers = si.tickers_nasdaq()
                logger.info(f"Fetched {len(nasdaq_tickers)} NASDAQ symbols from yahoo_fin")

                for ticker in nasdaq_tickers:
                    symbols.append({
                        'symbol': ticker,
                        'name': '',
                        'exchange': 'NASDAQ',
                        'sector': '',
                        'industry': '',
                        'is_active': True
                    })

            elif nasdaq_trader:
                # Use pandas_datareader nasdaq_trader
                nasdaq_df = nasdaq_trader.get_nasdaq_symbols()
                logger.info(f"Fetched {len(nasdaq_df)} symbols from nasdaq_trader")

                for symbol, row in nasdaq_df.iterrows():
                    symbols.append({
                        'symbol': symbol,
                        'name': row.get('Security Name', ''),
                        'exchange': row.get('Exchange', 'NASDAQ'),
                        'sector': row.get('Sector', ''),
                        'industry': row.get('Industry', ''),
                        'is_active': row.get('Test Issue', 'N') == 'N'
                    })

        except Exception as e:
            logger.error(f"Error fetching NASDAQ symbols: {e}")

        return symbols

    def get_dow_symbols(self) -> List[Dict]:
        """Get Dow Jones Industrial Average symbols"""
        symbols = []

        try:
            if si:
                dow_tickers = si.tickers_dow()
                logger.info(f"Fetched {len(dow_tickers)} Dow Jones symbols")

                for ticker in dow_tickers:
                    symbols.append({
                        'symbol': ticker,
                        'name': '',
                        'exchange': 'NYSE',
                        'sector': '',
                        'industry': '',
                        'is_active': True
                    })

        except Exception as e:
            logger.error(f"Error fetching Dow Jones symbols: {e}")

        return symbols

    def get_all_us_symbols(self) -> List[Dict]:
        """Get all available US stock symbols"""
        all_symbols = {}

        # Get S&P 500
        sp500 = self.get_sp500_symbols()
        for sym in sp500:
            all_symbols[sym['symbol']] = sym

        # Get NASDAQ (this includes NYSE and other exchanges)
        nasdaq = self.get_nasdaq_symbols()
        for sym in nasdaq:
            if sym['symbol'] not in all_symbols:
                all_symbols[sym['symbol']] = sym

        # Get Dow Jones (for completeness)
        dow = self.get_dow_symbols()
        for sym in dow:
            if sym['symbol'] not in all_symbols:
                all_symbols[sym['symbol']] = sym

        symbols_list = list(all_symbols.values())
        logger.info(f"Total unique symbols collected: {len(symbols_list)}")

        return symbols_list

    def save_symbols_to_db(self, symbols: List[Dict]) -> Dict:
        """Save symbols to database"""
        if not symbols:
            return {'success': 0, 'failed': 0, 'message': 'No symbols to save'}

        success_count = 0
        failed_count = 0

        try:
            conn = get_connection()
            cursor = conn.cursor()

            for symbol_data in symbols:
                try:
                    # Insert or update symbol
                    cursor.execute("""
                        INSERT OR REPLACE INTO symbols
                        (symbol, name, exchange, sector, industry, is_active, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        symbol_data['symbol'],
                        symbol_data.get('name', ''),
                        symbol_data.get('exchange', ''),
                        symbol_data.get('sector', ''),
                        symbol_data.get('industry', ''),
                        symbol_data.get('is_active', True),
                        datetime.now()
                    ))
                    success_count += 1

                except Exception as e:
                    logger.error(f"Error saving symbol {symbol_data.get('symbol', 'UNKNOWN')}: {e}")
                    failed_count += 1

            conn.commit()
            conn.close()

            logger.info(f"Saved {success_count} symbols to database, {failed_count} failed")

        except Exception as e:
            logger.error(f"Database error: {e}")
            return {'success': 0, 'failed': len(symbols), 'message': str(e)}

        return {
            'success': success_count,
            'failed': failed_count,
            'total': len(symbols),
            'message': f'Successfully saved {success_count} symbols'
        }

    def search_symbols(self, query: str, limit: int = 20) -> List[Dict]:
        """Search symbols by ticker or name"""
        try:
            results = execute_query("""
                SELECT symbol, name, exchange, sector, industry
                FROM symbols
                WHERE (symbol LIKE ? OR name LIKE ?)
                AND is_active = 1
                ORDER BY
                    CASE
                        WHEN symbol = ? THEN 0
                        WHEN symbol LIKE ? THEN 1
                        ELSE 2
                    END,
                    symbol
                LIMIT ?
            """, (
                f'%{query}%', f'%{query}%',  # For WHERE clause
                query, f'{query}%',           # For ORDER BY
                limit
            ), fetch='all')

            return results if results else []

        except Exception as e:
            logger.error(f"Error searching symbols: {e}")
            return []

    def get_symbols_by_exchange(self, exchange: str, limit: int = 100) -> List[Dict]:
        """Get symbols filtered by exchange"""
        try:
            results = execute_query("""
                SELECT symbol, name, exchange, sector, industry
                FROM symbols
                WHERE exchange = ? AND is_active = 1
                ORDER BY symbol
                LIMIT ?
            """, (exchange, limit), fetch='all')

            return results if results else []

        except Exception as e:
            logger.error(f"Error fetching symbols by exchange: {e}")
            return []

    def get_symbols_by_sector(self, sector: str, limit: int = 100) -> List[Dict]:
        """Get symbols filtered by sector"""
        try:
            results = execute_query("""
                SELECT symbol, name, exchange, sector, industry
                FROM symbols
                WHERE sector = ? AND is_active = 1
                ORDER BY symbol
                LIMIT ?
            """, (sector, limit), fetch='all')

            return results if results else []

        except Exception as e:
            logger.error(f"Error fetching symbols by sector: {e}")
            return []

    def get_all_sectors(self) -> List[str]:
        """Get list of all unique sectors"""
        try:
            results = execute_query("""
                SELECT DISTINCT sector
                FROM symbols
                WHERE sector != '' AND is_active = 1
                ORDER BY sector
            """, fetch='all')

            return [r['sector'] for r in results] if results else []

        except Exception as e:
            logger.error(f"Error fetching sectors: {e}")
            return []

    def get_all_exchanges(self) -> List[str]:
        """Get list of all unique exchanges"""
        try:
            results = execute_query("""
                SELECT DISTINCT exchange
                FROM symbols
                WHERE exchange != '' AND is_active = 1
                ORDER BY exchange
            """, fetch='all')

            return [r['exchange'] for r in results] if results else []

        except Exception as e:
            logger.error(f"Error fetching exchanges: {e}")
            return []

    def get_symbol_count(self) -> int:
        """Get total count of active symbols"""
        try:
            result = execute_query("""
                SELECT COUNT(*) as count
                FROM symbols
                WHERE is_active = 1
            """, fetch='one')

            return result['count'] if result else 0

        except Exception as e:
            logger.error(f"Error counting symbols: {e}")
            return 0