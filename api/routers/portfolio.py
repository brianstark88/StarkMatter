"""
Portfolio & Trading Router
Endpoints for portfolio management and paper trading
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Optional
from pydantic import BaseModel
import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.portfolio import PortfolioService
from services.paper_trading import PaperTradingEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


# Request models
class AddPositionRequest(BaseModel):
    symbol: str
    quantity: float
    price: float


class TradeRequest(BaseModel):
    symbol: str
    quantity: int
    order_type: str  # 'BUY' or 'SELL'


# Portfolio endpoints

@router.get("/")
async def get_portfolio():
    """
    Get complete portfolio with current valuations

    Returns:
        Portfolio summary with all positions and P&L
    """
    try:
        service = PortfolioService()
        portfolio = service.calculate_portfolio_value()

        return portfolio

    except Exception as e:
        logger.error(f"Error fetching portfolio: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/positions")
async def get_positions():
    """
    Get all portfolio positions

    Returns:
        List of all positions
    """
    try:
        service = PortfolioService()
        positions = service.get_all_positions()

        return {
            "count": len(positions),
            "positions": positions
        }

    except Exception as e:
        logger.error(f"Error fetching positions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/positions/{symbol}")
async def get_position(symbol: str):
    """
    Get specific position with current valuation

    Args:
        symbol: Stock ticker symbol

    Returns:
        Position details with P&L
    """
    try:
        service = PortfolioService()
        position = service.calculate_position_value(symbol)

        if not position:
            raise HTTPException(status_code=404, detail=f"No position found for {symbol}")

        return position

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching position for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/positions")
async def add_position(request: AddPositionRequest):
    """
    Add or update a position

    Args:
        request: Position details (symbol, quantity, price)

    Returns:
        Updated position data
    """
    try:
        service = PortfolioService()
        position = service.add_position(
            request.symbol.upper(),
            request.quantity,
            request.price
        )

        return {
            "status": "success",
            "position": position
        }

    except Exception as e:
        logger.error(f"Error adding position: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/positions/{symbol}")
async def close_position(symbol: str):
    """
    Close a position completely

    Args:
        symbol: Stock ticker symbol

    Returns:
        Success confirmation
    """
    try:
        service = PortfolioService()
        position = service.get_position(symbol)

        if not position:
            raise HTTPException(status_code=404, detail=f"No position found for {symbol}")

        # Remove all shares
        service.remove_shares(symbol, position['quantity'])

        return {
            "status": "success",
            "message": f"Position in {symbol} closed"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error closing position for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Paper trading endpoints

@router.get("/paper/account")
async def get_paper_account():
    """
    Get paper trading account details

    Returns:
        Account balance and stats
    """
    try:
        engine = PaperTradingEngine()
        account = engine.get_account()

        if not account:
            raise HTTPException(status_code=404, detail="Paper trading account not found")

        return account

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching paper account: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/paper/performance")
async def get_paper_performance():
    """
    Get paper trading performance metrics

    Returns:
        Performance stats including returns
    """
    try:
        engine = PaperTradingEngine()
        performance = engine.get_performance()

        return performance

    except Exception as e:
        logger.error(f"Error fetching performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/paper/trade")
async def place_paper_trade(request: TradeRequest):
    """
    Place a paper trade

    Args:
        request: Trade details (symbol, quantity, order_type)

    Returns:
        Trade execution result
    """
    try:
        engine = PaperTradingEngine()
        result = engine.place_order(
            request.symbol.upper(),
            request.quantity,
            request.order_type.upper()
        )

        if result.get('status') == 'error':
            raise HTTPException(status_code=400, detail=result.get('message'))

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error placing paper trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/paper/trades")
async def get_trade_history(limit: int = 50):
    """
    Get paper trading history

    Args:
        limit: Maximum number of trades to return

    Returns:
        List of historical trades
    """
    try:
        engine = PaperTradingEngine()
        trades = engine.get_trade_history(limit)

        return {
            "count": len(trades),
            "trades": trades
        }

    except Exception as e:
        logger.error(f"Error fetching trade history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/paper/reset")
async def reset_paper_account(starting_balance: float = 10000.0):
    """
    Reset paper trading account

    Args:
        starting_balance: Initial account balance

    Returns:
        Reset confirmation
    """
    try:
        engine = PaperTradingEngine()
        result = engine.reset_account(starting_balance)

        if result.get('status') == 'error':
            raise HTTPException(status_code=500, detail=result.get('message'))

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting account: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Export endpoints for Claude analysis

@router.get("/export/summary")
async def export_portfolio_summary():
    """
    Export portfolio summary in markdown format for Claude analysis

    Returns:
        Markdown-formatted portfolio summary
    """
    try:
        service = PortfolioService()
        portfolio = service.calculate_portfolio_value()

        # Build markdown summary
        markdown = f"""# Portfolio Summary

## Overview
- **Total Value**: ${portfolio['total_market_value']:,.2f}
- **Cost Basis**: ${portfolio['total_cost_basis']:,.2f}
- **Total P&L**: ${portfolio['total_pl']:,.2f} ({portfolio['total_pl_pct']:.2f}%)
- **Number of Positions**: {portfolio['num_positions']}

## Positions

"""

        for pos in portfolio.get('positions', []):
            markdown += f"""### {pos['symbol']}
- Quantity: {pos['quantity']} shares
- Avg Cost: ${pos['average_cost']:.2f}
- Current Price: ${pos['current_price']:.2f}
- Market Value: ${pos['market_value']:,.2f}
- Unrealized P&L: ${pos['unrealized_pl']:,.2f} ({pos['unrealized_pl_pct']:.2f}%)

"""

        return {
            "markdown": markdown
        }

    except Exception as e:
        logger.error(f"Error exporting portfolio summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
