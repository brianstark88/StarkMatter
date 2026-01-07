#!/usr/bin/env python3
"""
Bulk Import Market Data
Fetches historical data for all symbols in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.yahoo_import import YahooFinanceService
from database import execute_query
import logging
import time
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def bulk_import_all_symbols(period: str = "1mo", batch_size: int = 10, delay: float = 1.0):
    """
    Import market data for all symbols in the database

    Args:
        period: Time period to fetch (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
        batch_size: Number of symbols to process before pausing
        delay: Delay in seconds between batches to avoid rate limiting

    Returns:
        Dictionary with import results
    """
    logger.info("=" * 80)
    logger.info("Starting bulk market data import")
    logger.info("=" * 80)

    # Get all symbols from database
    try:
        all_symbols = execute_query(
            "SELECT symbol FROM symbols WHERE is_active = 1 ORDER BY symbol",
            fetch='all'
        )
    except Exception as e:
        logger.error(f"Error fetching symbols from database: {e}")
        return

    if not all_symbols:
        logger.error("No symbols found in database. Run load_symbols.py first.")
        return

    symbols_list = [s['symbol'] for s in all_symbols]
    total = len(symbols_list)

    logger.info(f"Found {total} symbols to import")
    logger.info(f"Period: {period}")
    logger.info(f"Batch size: {batch_size}")
    logger.info(f"Delay between batches: {delay}s")
    logger.info("-" * 80)

    # Initialize service
    yahoo_service = YahooFinanceService()

    # Track results
    overall_results = {
        'success': [],
        'failed': [],
        'total_rows': 0,
        'start_time': datetime.now()
    }

    # Process in batches
    for i in range(0, total, batch_size):
        batch = symbols_list[i:i+batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total + batch_size - 1) // batch_size

        logger.info(f"\nBatch {batch_num}/{total_batches}: Processing {len(batch)} symbols")
        logger.info(f"Symbols: {', '.join(batch)}")

        # Import batch
        results = yahoo_service.bulk_import(batch, period=period)

        # Aggregate results
        overall_results['success'].extend(results['success'])
        overall_results['failed'].extend(results['failed'])
        overall_results['total_rows'] += results['total_rows']

        logger.info(f"Batch complete: {len(results['success'])} succeeded, {len(results['failed'])} failed")

        # Delay between batches (except for last batch)
        if i + batch_size < total:
            logger.info(f"Waiting {delay}s before next batch...")
            time.sleep(delay)

    # Calculate statistics
    overall_results['end_time'] = datetime.now()
    overall_results['duration'] = (overall_results['end_time'] - overall_results['start_time']).total_seconds()
    overall_results['success_rate'] = (len(overall_results['success']) / total * 100) if total > 0 else 0

    # Print summary
    logger.info("\n" + "=" * 80)
    logger.info("IMPORT SUMMARY")
    logger.info("=" * 80)
    logger.info(f"Total symbols processed: {total}")
    logger.info(f"Successful imports: {len(overall_results['success'])}")
    logger.info(f"Failed imports: {len(overall_results['failed'])}")
    logger.info(f"Success rate: {overall_results['success_rate']:.1f}%")
    logger.info(f"Total data rows: {overall_results['total_rows']}")
    logger.info(f"Duration: {overall_results['duration']:.1f}s")
    logger.info(f"Average: {overall_results['duration']/total:.2f}s per symbol")

    if overall_results['failed']:
        logger.warning(f"\nFailed symbols ({len(overall_results['failed'])}):")
        for symbol in overall_results['failed']:
            logger.warning(f"  - {symbol}")

    logger.info("=" * 80)

    return overall_results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Bulk import market data for all symbols')
    parser.add_argument(
        '--period',
        type=str,
        default='1mo',
        choices=['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'max'],
        help='Time period to fetch (default: 1mo)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=10,
        help='Number of symbols per batch (default: 10)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=1.0,
        help='Delay in seconds between batches (default: 1.0)'
    )

    args = parser.parse_args()

    # Run import
    results = bulk_import_all_symbols(
        period=args.period,
        batch_size=args.batch_size,
        delay=args.delay
    )

    # Exit with appropriate code
    if results and len(results['failed']) == 0:
        logger.info("✓ All symbols imported successfully!")
        sys.exit(0)
    elif results and len(results['success']) > 0:
        logger.warning(f"⚠ Partial success: {len(results['success'])}/{len(results['success']) + len(results['failed'])} symbols imported")
        sys.exit(1)
    else:
        logger.error("✗ Import failed")
        sys.exit(1)
