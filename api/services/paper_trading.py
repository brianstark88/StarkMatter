"""
Paper Trading Engine
Simulates trading without real money
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_query, get_connection

logger = logging.getLogger(__name__)


class PaperTradingEngine:
    """Service for paper trading (simulated trades)"""

    def __init__(self):
        self.account_id = 1  # Single paper trading account

    def get_account(self) -> Dict:
        """Get paper trading account details"""
        query = "SELECT * FROM paper_account WHERE id = ?"
        account = execute_query(query, (self.account_id,), fetch='one')
        return account if account else {}

    def get_balance(self) -> float:
        """Get current cash balance"""
        account = self.get_account()
        return account.get('balance', 0.0) if account else 0.0

    def update_balance(self, new_balance: float):
        """Update account balance"""
        query = """
            UPDATE paper_account
            SET balance = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """
        execute_query(query, (new_balance, self.account_id))

    def get_current_price(self, symbol: str) -> Optional[float]:
        """Get latest price from market data"""
        query = """
            SELECT close FROM market_data
            WHERE symbol = ?
            ORDER BY date DESC
            LIMIT 1
        """
        result = execute_query(query, (symbol,), fetch='one')
        return result['close'] if result else None

    def get_position(self, symbol: str) -> Optional[Dict]:
        """Get position for a symbol"""
        query = "SELECT * FROM positions WHERE symbol = ?"
        return execute_query(query, (symbol,), fetch='one')

    def place_order(self, symbol: str, quantity: int, order_type: str) -> Dict:
        """
        Place a paper trade order

        Args:
            symbol: Stock ticker
            quantity: Number of shares
            order_type: 'BUY' or 'SELL'

        Returns:
            Dictionary with order result
        """
        try:
            current_price = self.get_current_price(symbol)

            if not current_price:
                return {
                    'status': 'error',
                    'message': f'No price data available for {symbol}'
                }

            balance = self.get_balance()

            if order_type.upper() == 'BUY':
                return self._execute_buy(symbol, quantity, current_price, balance)
            elif order_type.upper() == 'SELL':
                return self._execute_sell(symbol, quantity, current_price, balance)
            else:
                return {
                    'status': 'error',
                    'message': f'Invalid order type: {order_type}'
                }

        except Exception as e:
            logger.error(f"Error placing order: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def _execute_buy(self, symbol: str, quantity: int, price: float, balance: float) -> Dict:
        """Execute a buy order"""
        cost = quantity * price

        if cost > balance:
            return {
                'status': 'error',
                'message': f'Insufficient funds. Need ${cost:.2f}, have ${balance:.2f}'
            }

        # Update balance
        new_balance = balance - cost
        self.update_balance(new_balance)

        # Update or create position
        position = self.get_position(symbol)

        if position:
            # Update existing position
            old_qty = position['quantity']
            old_avg = position['average_cost']
            new_qty = old_qty + quantity
            new_avg = ((old_qty * old_avg) + cost) / new_qty

            query = """
                UPDATE positions
                SET quantity = ?, average_cost = ?, updated_at = CURRENT_TIMESTAMP
                WHERE symbol = ?
            """
            execute_query(query, (new_qty, new_avg, symbol))
        else:
            # Create new position
            query = """
                INSERT INTO positions (symbol, quantity, average_cost)
                VALUES (?, ?, ?)
            """
            execute_query(query, (symbol, quantity, price))

        # Log trade
        self._log_trade(symbol, 'BUY', quantity, price, new_balance)

        return {
            'status': 'success',
            'order_type': 'BUY',
            'symbol': symbol,
            'quantity': quantity,
            'price': price,
            'total_cost': cost,
            'balance_after': new_balance
        }

    def _execute_sell(self, symbol: str, quantity: int, price: float, balance: float) -> Dict:
        """Execute a sell order"""
        position = self.get_position(symbol)

        if not position:
            return {
                'status': 'error',
                'message': f'No position in {symbol} to sell'
            }

        if quantity > position['quantity']:
            return {
                'status': 'error',
                'message': f'Insufficient shares. Have {position["quantity"]}, trying to sell {quantity}'
            }

        # Calculate proceeds
        proceeds = quantity * price

        # Update balance
        new_balance = balance + proceeds
        self.update_balance(new_balance)

        # Update position
        new_qty = position['quantity'] - quantity

        if new_qty == 0:
            # Close position
            query = "DELETE FROM positions WHERE symbol = ?"
            execute_query(query, (symbol,))
        else:
            # Reduce position
            query = """
                UPDATE positions
                SET quantity = ?, updated_at = CURRENT_TIMESTAMP
                WHERE symbol = ?
            """
            execute_query(query, (new_qty, symbol))

        # Log trade
        self._log_trade(symbol, 'SELL', quantity, price, new_balance)

        # Calculate P&L for this trade
        cost_basis = quantity * position['average_cost']
        realized_pl = proceeds - cost_basis
        realized_pl_pct = (realized_pl / cost_basis) * 100 if cost_basis > 0 else 0

        return {
            'status': 'success',
            'order_type': 'SELL',
            'symbol': symbol,
            'quantity': quantity,
            'price': price,
            'total_proceeds': proceeds,
            'balance_after': new_balance,
            'realized_pl': realized_pl,
            'realized_pl_pct': realized_pl_pct
        }

    def _log_trade(self, symbol: str, action: str, quantity: int, price: float, balance_after: float):
        """Log trade to database"""
        query = """
            INSERT INTO trades (symbol, action, quantity, price, balance_after, paper_trade)
            VALUES (?, ?, ?, ?, ?, 1)
        """
        execute_query(query, (symbol, action, quantity, price, balance_after))

    def get_trade_history(self, limit: int = 50) -> List[Dict]:
        """Get trade history"""
        query = """
            SELECT * FROM trades
            WHERE paper_trade = 1
            ORDER BY timestamp DESC
            LIMIT ?
        """
        results = execute_query(query, (limit,), fetch='all')
        return results if results else []

    def get_performance(self) -> Dict:
        """
        Calculate overall performance

        Returns:
            Dictionary with performance stats
        """
        account = self.get_account()

        if not account:
            return {}

        # Get all positions
        query = "SELECT * FROM positions"
        positions = execute_query(query, fetch='all')

        cash_balance = account['balance']
        starting_balance = account['starting_balance']
        positions_value = 0

        if positions:
            for position in positions:
                current_price = self.get_current_price(position['symbol'])
                if current_price:
                    positions_value += position['quantity'] * current_price

        total_value = cash_balance + positions_value
        total_return = total_value - starting_balance
        return_pct = (total_return / starting_balance) * 100 if starting_balance > 0 else 0

        return {
            'starting_balance': starting_balance,
            'cash_balance': cash_balance,
            'positions_value': positions_value,
            'total_value': total_value,
            'total_return': total_return,
            'return_pct': return_pct,
            'num_positions': len(positions) if positions else 0
        }

    def reset_account(self, starting_balance: float = 10000.0):
        """Reset paper trading account"""
        try:
            # Clear positions
            execute_query("DELETE FROM positions")

            # Clear trades
            execute_query("DELETE FROM trades WHERE paper_trade = 1")

            # Reset account
            query = """
                UPDATE paper_account
                SET balance = ?, starting_balance = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """
            execute_query(query, (starting_balance, starting_balance, self.account_id))

            logger.info(f"Paper trading account reset to ${starting_balance}")

            return {
                'status': 'success',
                'message': f'Account reset to ${starting_balance}'
            }

        except Exception as e:
            logger.error(f"Error resetting account: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }


# Test function
if __name__ == "__main__":
    engine = PaperTradingEngine()

    print("Testing Paper Trading Engine...")

    # Get account
    account = engine.get_account()
    print(f"Account balance: ${account.get('balance', 0):.2f}")

    # Get performance
    perf = engine.get_performance()
    print(f"\nPerformance:")
    print(f"  Total Value: ${perf.get('total_value', 0):.2f}")
    print(f"  Return: ${perf.get('total_return', 0):.2f} ({perf.get('return_pct', 0):.2f}%)")
