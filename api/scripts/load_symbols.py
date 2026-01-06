#!/usr/bin/env python3
"""
Script to load predefined symbols into the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.symbols_list import ALL_SYMBOLS, SYMBOL_SECTORS, get_exchange
from services.symbol_manager import SymbolManager
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_predefined_symbols():
    """Load predefined symbols into the database"""
    symbol_manager = SymbolManager()

    symbols_data = []
    for symbol in ALL_SYMBOLS:
        symbol_data = {
            'symbol': symbol,
            'name': f'{symbol} Corporation',  # Placeholder name
            'exchange': get_exchange(symbol),
            'sector': SYMBOL_SECTORS.get(symbol, 'Other'),
            'industry': '',
            'is_active': True
        }
        symbols_data.append(symbol_data)

    logger.info(f"Loading {len(symbols_data)} symbols into database...")
    result = symbol_manager.save_symbols_to_db(symbols_data)

    logger.info(f"Successfully loaded {result['success']} symbols")
    logger.info(f"Failed: {result['failed']}")

    # Show statistics
    total_count = symbol_manager.get_symbol_count()
    sectors = symbol_manager.get_all_sectors()
    exchanges = symbol_manager.get_all_exchanges()

    logger.info(f"\nDatabase Statistics:")
    logger.info(f"Total symbols: {total_count}")
    logger.info(f"Sectors: {', '.join(sectors)}")
    logger.info(f"Exchanges: {', '.join(exchanges)}")

    return result

if __name__ == "__main__":
    load_predefined_symbols()