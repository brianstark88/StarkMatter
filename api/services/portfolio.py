"""
Portfolio Management Service
Tracks positions, calculates P&L, and manages watchlist
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_connection, execute_query

logger = logging.getLogger(__name__)


class PortfolioService:
    """Service for managing portfolio positions and calculations"""

    def __init__(self):
        pass

    def get_all_positions(self) -> List[Dict]:
        """Get all current positions"""
        query = "SELECT * FROM positions ORDER BY symbol"
        results = execute_query(query, fetch='all')
        return results if results else []

    def get_position(self, symbol: str) -> Optional[Dict]:
        """Get a specific position"""
        query = "SELECT * FROM positions WHERE symbol = ?"
        return execute_query(query, (symbol,), fetch='one')

    def add_position(self, symbol: str, quantity: float, price: float) -> Dict:
        """
        Add a new position or update existing

        Args:
            symbol: Stock ticker
            quantity: Number of shares
            price: Purchase price

        Returns:
            Updated position data
        """
        try:
            existing = self.get_position(symbol)

            if existing:
                # Update existing position (average cost)
                old_qty = existing['quantity']
                old_cost = existing['average_cost']

                new_qty = old_qty + quantity
                new_avg = ((old_qty * old_cost) + (quantity * price)) / new_qty

                query = """
                    UPDATE positions
                    SET quantity = ?, average_cost = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE symbol = ?
                """
                execute_query(query, (new_qty, new_avg, symbol))

                logger.info(f"Updated position for {symbol}: {new_qty} shares at avg ${new_avg:.2f}")
                return self.get_position(symbol)
            else:
                # Insert new position
                query = """
                    INSERT INTO positions (symbol, quantity, average_cost)
                    VALUES (?, ?, ?)
                """
                execute_query(query, (symbol, quantity, price))

                logger.info(f"Created new position: {symbol} - {quantity} shares at ${price:.2f}")
                return self.get_position(symbol)

        except Exception as e:
            logger.error(f"Error adding position for {symbol}: {e}")
            raise

    def remove_shares(self, symbol: str, quantity: float) -> Dict:
        """
        Remove shares from a position

        Args:
            symbol: Stock ticker
            quantity: Number of shares to remove

        Returns:
            Updated position data or None if position closed
        """
        try:
            position = self.get_position(symbol)

            if not position:
                raise ValueError(f"No position found for {symbol}")

            if quantity > position['quantity']:
                raise ValueError(f"Insufficient shares. Have {position['quantity']}, trying to remove {quantity}")

            new_qty = position['quantity'] - quantity

            if new_qty == 0:
                # Close position
                query = "DELETE FROM positions WHERE symbol = ?"
                execute_query(query, (symbol,))
                logger.info(f"Closed position for {symbol}")
                return None
            else:
                # Update quantity
                query = """
                    UPDATE positions
                    SET quantity = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE symbol = ?
                """
                execute_query(query, (new_qty, symbol))
                logger.info(f"Reduced position for {symbol} to {new_qty} shares")
                return self.get_position(symbol)

        except Exception as e:
            logger.error(f"Error removing shares for {symbol}: {e}")
            raise

    def get_current_price(self, symbol: str) -> Optional[float]:
        """Get latest price from market_data table"""
        query = """
            SELECT close FROM market_data
            WHERE symbol = ?
            ORDER BY date DESC
            LIMIT 1
        """
        result = execute_query(query, (symbol,), fetch='one')
        return result['close'] if result else None

    def calculate_position_value(self, symbol: str) -> Dict:
        """
        Calculate current value and P&L for a position

        Args:
            symbol: Stock ticker

        Returns:
            Dictionary with position stats
        """
        position = self.get_position(symbol)
        if not position:
            return {}

        current_price = self.get_current_price(symbol)
        if not current_price:
            logger.warning(f"No current price available for {symbol}")
            current_price = position['average_cost']  # Fallback to cost basis

        market_value = position['quantity'] * current_price
        cost_basis = position['quantity'] * position['average_cost']
        unrealized_pl = market_value - cost_basis
        unrealized_pl_pct = (unrealized_pl / cost_basis) * 100 if cost_basis > 0 else 0

        return {
            'symbol': symbol,
            'quantity': position['quantity'],
            'average_cost': position['average_cost'],
            'current_price': current_price,
            'cost_basis': cost_basis,
            'market_value': market_value,
            'unrealized_pl': unrealized_pl,
            'unrealized_pl_pct': unrealized_pl_pct
        }

    def calculate_portfolio_value(self) -> Dict:
        """
        Calculate total portfolio value and performance

        Returns:
            Dictionary with portfolio stats
        """
        positions = self.get_all_positions()

        total_market_value = 0
        total_cost_basis = 0
        positions_detail = []

        for position in positions:
            stats = self.calculate_position_value(position['symbol'])
            if stats:
                total_market_value += stats['market_value']
                total_cost_basis += stats['cost_basis']
                positions_detail.append(stats)

        total_pl = total_market_value - total_cost_basis
        total_pl_pct = (total_pl / total_cost_basis) * 100 if total_cost_basis > 0 else 0

        return {
            'total_market_value': total_market_value,
            'total_cost_basis': total_cost_basis,
            'total_pl': total_pl,
            'total_pl_pct': total_pl_pct,
            'num_positions': len(positions),
            'positions': positions_detail
        }

    # Watchlist methods

    def get_watchlist(self) -> List[Dict]:
        """Get all symbols in watchlist"""
        query = "SELECT * FROM watchlist ORDER BY symbol"
        results = execute_query(query, fetch='all')
        return results if results else []

    def add_to_watchlist(self, symbol: str, notes: str = None):
        """Add symbol to watchlist"""
        try:
            query = """
                INSERT OR IGNORE INTO watchlist (symbol, notes)
                VALUES (?, ?)
            """
            execute_query(query, (symbol, notes))
            logger.info(f"Added {symbol} to watchlist")
        except Exception as e:
            logger.error(f"Error adding {symbol} to watchlist: {e}")
            raise

    def remove_from_watchlist(self, symbol: str):
        """Remove symbol from watchlist"""
        try:
            query = "DELETE FROM watchlist WHERE symbol = ?"
            execute_query(query, (symbol,))
            logger.info(f"Removed {symbol} from watchlist")
        except Exception as e:
            logger.error(f"Error removing {symbol} from watchlist: {e}")
            raise


# Test function
if __name__ == "__main__":
    service = PortfolioService()

    print("Testing Portfolio Service...")

    # Add positions
    service.add_position("AAPL", 10, 150.00)
    service.add_position("GOOGL", 5, 140.00)

    # Calculate portfolio
    portfolio = service.calculate_portfolio_value()
    print(f"\nPortfolio Value: ${portfolio['total_market_value']:.2f}")
    print(f"Cost Basis: ${portfolio['total_cost_basis']:.2f}")
    print(f"P&L: ${portfolio['total_pl']:.2f} ({portfolio['total_pl_pct']:.2f}%)")

    # Show positions
    print(f"\nPositions:")
    for pos in portfolio['positions']:
        print(f"  {pos['symbol']}: {pos['quantity']} shares @ ${pos['current_price']:.2f}")
