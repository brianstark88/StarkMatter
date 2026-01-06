"""
Symbols Router
Endpoints for managing and searching stock symbols
"""
from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from typing import List, Optional
import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.symbol_manager import SymbolManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/symbols", tags=["symbols"])

# Initialize symbol manager
symbol_manager = SymbolManager()


@router.post("/import/sp500")
async def import_sp500_symbols(background_tasks: BackgroundTasks):
    """
    Import all S&P 500 symbols with metadata

    Returns:
        Import status and count
    """
    try:
        # Get S&P 500 symbols
        symbols = symbol_manager.get_sp500_symbols()

        if not symbols:
            raise HTTPException(status_code=404, detail="Could not fetch S&P 500 symbols")

        # Save to database in background
        result = symbol_manager.save_symbols_to_db(symbols)

        return {
            "status": "success",
            "source": "S&P 500",
            "symbols_imported": result['success'],
            "symbols_failed": result['failed'],
            "total": result['total'],
            "message": result['message']
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing S&P 500 symbols: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/nasdaq")
async def import_nasdaq_symbols():
    """
    Import all NASDAQ symbols with metadata

    Returns:
        Import status and count
    """
    try:
        # Get NASDAQ symbols
        symbols = symbol_manager.get_nasdaq_symbols()

        if not symbols:
            raise HTTPException(status_code=404, detail="Could not fetch NASDAQ symbols")

        # Save to database
        result = symbol_manager.save_symbols_to_db(symbols)

        return {
            "status": "success",
            "source": "NASDAQ",
            "symbols_imported": result['success'],
            "symbols_failed": result['failed'],
            "total": result['total'],
            "message": result['message']
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing NASDAQ symbols: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/dow")
async def import_dow_symbols():
    """
    Import all Dow Jones Industrial Average symbols

    Returns:
        Import status and count
    """
    try:
        # Get Dow symbols
        symbols = symbol_manager.get_dow_symbols()

        if not symbols:
            raise HTTPException(status_code=404, detail="Could not fetch Dow Jones symbols")

        # Save to database
        result = symbol_manager.save_symbols_to_db(symbols)

        return {
            "status": "success",
            "source": "Dow Jones",
            "symbols_imported": result['success'],
            "symbols_failed": result['failed'],
            "total": result['total'],
            "message": result['message']
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing Dow symbols: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/all")
async def import_all_symbols(background_tasks: BackgroundTasks):
    """
    Import all available US stock symbols
    This may take several minutes due to the large number of symbols

    Returns:
        Import status and count
    """
    try:
        logger.info("Starting full symbol import...")

        # Get all available symbols
        symbols = symbol_manager.get_all_us_symbols()

        if not symbols:
            raise HTTPException(status_code=404, detail="Could not fetch symbols")

        logger.info(f"Fetched {len(symbols)} total symbols, saving to database...")

        # Save to database (this might take a while)
        result = symbol_manager.save_symbols_to_db(symbols)

        return {
            "status": "success",
            "source": "All US Markets",
            "symbols_imported": result['success'],
            "symbols_failed": result['failed'],
            "total": result['total'],
            "message": result['message']
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing all symbols: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_symbols(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(default=20, le=100, description="Maximum results")
):
    """
    Search for symbols by ticker or company name

    Args:
        q: Search query (ticker or name)
        limit: Maximum number of results

    Returns:
        List of matching symbols
    """
    try:
        results = symbol_manager.search_symbols(q, limit)

        return {
            "query": q,
            "count": len(results),
            "symbols": results
        }

    except Exception as e:
        logger.error(f"Error searching symbols: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_symbols(
    exchange: Optional[str] = Query(default=None, description="Filter by exchange"),
    sector: Optional[str] = Query(default=None, description="Filter by sector"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    limit: int = Query(default=100, le=1000, description="Maximum results")
):
    """
    Get list of symbols with optional filters

    Args:
        exchange: Filter by exchange (NYSE, NASDAQ, etc.)
        sector: Filter by sector
        offset: Pagination offset
        limit: Maximum results

    Returns:
        Paginated list of symbols
    """
    try:
        # Build query based on filters
        if exchange:
            symbols = symbol_manager.get_symbols_by_exchange(exchange, limit)
        elif sector:
            symbols = symbol_manager.get_symbols_by_sector(sector, limit)
        else:
            # Get all symbols with pagination
            from database import execute_query
            symbols = execute_query("""
                SELECT symbol, name, exchange, sector, industry
                FROM symbols
                WHERE is_active = 1
                ORDER BY symbol
                LIMIT ? OFFSET ?
            """, (limit, offset), fetch='all')

            if not symbols:
                symbols = []

        # Get total count
        total = symbol_manager.get_symbol_count()

        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "count": len(symbols),
            "symbols": symbols
        }

    except Exception as e:
        logger.error(f"Error listing symbols: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sectors")
async def get_sectors():
    """
    Get list of all available sectors

    Returns:
        List of unique sectors
    """
    try:
        sectors = symbol_manager.get_all_sectors()

        return {
            "count": len(sectors),
            "sectors": sectors
        }

    except Exception as e:
        logger.error(f"Error fetching sectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exchanges")
async def get_exchanges():
    """
    Get list of all available exchanges

    Returns:
        List of unique exchanges
    """
    try:
        exchanges = symbol_manager.get_all_exchanges()

        return {
            "count": len(exchanges),
            "exchanges": exchanges
        }

    except Exception as e:
        logger.error(f"Error fetching exchanges: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_symbol_stats():
    """
    Get statistics about symbols in database

    Returns:
        Symbol statistics
    """
    try:
        from database import execute_query

        # Get various statistics
        total = symbol_manager.get_symbol_count()

        # Count by exchange
        exchange_counts = execute_query("""
            SELECT exchange, COUNT(*) as count
            FROM symbols
            WHERE is_active = 1 AND exchange != ''
            GROUP BY exchange
            ORDER BY count DESC
        """, fetch='all')

        # Count by sector
        sector_counts = execute_query("""
            SELECT sector, COUNT(*) as count
            FROM symbols
            WHERE is_active = 1 AND sector != ''
            GROUP BY sector
            ORDER BY count DESC
            LIMIT 10
        """, fetch='all')

        return {
            "total_symbols": total,
            "by_exchange": exchange_counts if exchange_counts else [],
            "top_sectors": sector_counts if sector_counts else []
        }

    except Exception as e:
        logger.error(f"Error fetching symbol stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}")
async def get_symbol_details(symbol: str):
    """
    Get detailed information for a specific symbol

    Args:
        symbol: Stock ticker symbol

    Returns:
        Symbol details
    """
    try:
        from database import execute_query

        result = execute_query("""
            SELECT *
            FROM symbols
            WHERE symbol = ? AND is_active = 1
        """, (symbol.upper(),), fetch='one')

        if not result:
            raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching symbol details: {e}")
        raise HTTPException(status_code=500, detail=str(e))