"""
Technical Analysis Service
Calculates technical indicators and generates buy/sell signals
"""
import pandas as pd
import numpy as np
import logging
from typing import Dict, List
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_query, execute_many

logger = logging.getLogger(__name__)

try:
    from ta import add_all_ta_features
    from ta.utils import dropna
    from ta.momentum import RSIIndicator
    from ta.trend import MACD, EMAIndicator, SMAIndicator
    from ta.volatility import BollingerBands
    TA_AVAILABLE = True
except ImportError:
    TA_AVAILABLE = False
    logger.warning("ta library not installed - technical analysis limited")


class TechnicalAnalysisService:
    """Service for calculating technical indicators and signals"""

    def __init__(self):
        self.ta_available = TA_AVAILABLE

    def get_market_data(self, symbol: str, days: int = 100) -> pd.DataFrame:
        """
        Fetch market data from database for analysis

        Args:
            symbol: Stock ticker
            days: Number of days of historical data

        Returns:
            DataFrame with OHLCV data
        """
        query = """
            SELECT date, open, high, low, close, volume
            FROM market_data
            WHERE symbol = ?
            ORDER BY date DESC
            LIMIT ?
        """

        results = execute_query(query, (symbol, days), fetch='all')

        if not results:
            logger.warning(f"No market data found for {symbol}")
            return pd.DataFrame()

        df = pd.DataFrame(results)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df = df.set_index('date')

        return df

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all technical indicators

        Args:
            df: DataFrame with OHLCV data

        Returns:
            DataFrame with indicators added
        """
        if df.empty:
            return df

        try:
            if self.ta_available:
                # Clean data
                df = dropna(df)

                # Add all technical indicators using ta library
                df = add_all_ta_features(
                    df,
                    open="open",
                    high="high",
                    low="low",
                    close="close",
                    volume="volume",
                    fillna=True
                )
            else:
                # Fallback: calculate basic indicators manually
                df = self._calculate_basic_indicators(df)

            logger.info(f"Calculated technical indicators for {len(df)} rows")
            return df

        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            return df

    def _calculate_basic_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate basic indicators without ta library"""
        try:
            # Simple Moving Averages
            df['sma_20'] = df['close'].rolling(window=20).mean()
            df['sma_50'] = df['close'].rolling(window=50).mean()

            # Exponential Moving Averages
            df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()
            df['ema_26'] = df['close'].ewm(span=26, adjust=False).mean()

            # MACD
            df['macd'] = df['ema_12'] - df['ema_26']
            df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
            df['macd_diff'] = df['macd'] - df['macd_signal']

            # RSI
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df['rsi'] = 100 - (100 / (1 + rs))

            # Bollinger Bands
            df['bb_middle'] = df['close'].rolling(window=20).mean()
            df['bb_std'] = df['close'].rolling(window=20).std()
            df['bb_upper'] = df['bb_middle'] + (df['bb_std'] * 2)
            df['bb_lower'] = df['bb_middle'] - (df['bb_std'] * 2)

            logger.info("Calculated basic indicators manually")
            return df

        except Exception as e:
            logger.error(f"Error calculating basic indicators: {e}")
            return df

    def find_signals(self, symbol: str) -> List[Dict]:
        """
        Find buy/sell signals based on technical indicators

        Args:
            symbol: Stock ticker

        Returns:
            List of signal dictionaries
        """
        df = self.get_market_data(symbol, days=100)

        if df.empty:
            return []

        df = self.calculate_indicators(df)
        signals = []

        try:
            # Get the latest values
            latest = df.iloc[-1]
            previous = df.iloc[-2] if len(df) > 1 else None

            # RSI signals
            if 'rsi' in df.columns or 'momentum_rsi' in df.columns:
                rsi = latest.get('momentum_rsi', latest.get('rsi'))

                if rsi and rsi < 30:
                    signals.append({
                        'type': 'BUY',
                        'indicator': 'RSI_OVERSOLD',
                        'strength': (30 - rsi) / 30 * 100,
                        'value': rsi
                    })
                elif rsi and rsi > 70:
                    signals.append({
                        'type': 'SELL',
                        'indicator': 'RSI_OVERBOUGHT',
                        'strength': (rsi - 70) / 30 * 100,
                        'value': rsi
                    })

            # MACD signals
            if previous is not None:
                macd_col = 'trend_macd' if 'trend_macd' in df.columns else 'macd'
                signal_col = 'trend_macd_signal' if 'trend_macd_signal' in df.columns else 'macd_signal'

                if macd_col in df.columns and signal_col in df.columns:
                    macd_current = latest.get(macd_col)
                    signal_current = latest.get(signal_col)
                    macd_prev = previous.get(macd_col)
                    signal_prev = previous.get(signal_col)

                    # Bullish crossover
                    if macd_current and signal_current and macd_prev and signal_prev:
                        if macd_current > signal_current and macd_prev <= signal_prev:
                            signals.append({
                                'type': 'BUY',
                                'indicator': 'MACD_CROSS_BULLISH',
                                'strength': 75,
                                'value': macd_current - signal_current
                            })

                        # Bearish crossover
                        elif macd_current < signal_current and macd_prev >= signal_prev:
                            signals.append({
                                'type': 'SELL',
                                'indicator': 'MACD_CROSS_BEARISH',
                                'strength': 75,
                                'value': signal_current - macd_current
                            })

            # Moving Average crossovers
            if 'sma_20' in df.columns and 'sma_50' in df.columns and previous is not None:
                sma20_current = latest['sma_20']
                sma50_current = latest['sma_50']
                sma20_prev = previous['sma_20']
                sma50_prev = previous['sma_50']

                if sma20_current and sma50_current and sma20_prev and sma50_prev:
                    # Golden cross
                    if sma20_current > sma50_current and sma20_prev <= sma50_prev:
                        signals.append({
                            'type': 'BUY',
                            'indicator': 'MA_GOLDEN_CROSS',
                            'strength': 80,
                            'value': sma20_current - sma50_current
                        })

                    # Death cross
                    elif sma20_current < sma50_current and sma20_prev >= sma50_prev:
                        signals.append({
                            'type': 'SELL',
                            'indicator': 'MA_DEATH_CROSS',
                            'strength': 80,
                            'value': sma50_current - sma20_current
                        })

            # Bollinger Bands
            bb_upper = latest.get('volatility_bbh', latest.get('bb_upper'))
            bb_lower = latest.get('volatility_bbl', latest.get('bb_lower'))
            close = latest['close']

            if bb_upper and bb_lower:
                # Price near lower band (oversold)
                if close <= bb_lower * 1.01:  # Within 1% of lower band
                    signals.append({
                        'type': 'BUY',
                        'indicator': 'BB_OVERSOLD',
                        'strength': 65,
                        'value': (bb_lower - close) / bb_lower * 100
                    })

                # Price near upper band (overbought)
                elif close >= bb_upper * 0.99:  # Within 1% of upper band
                    signals.append({
                        'type': 'SELL',
                        'indicator': 'BB_OVERBOUGHT',
                        'strength': 65,
                        'value': (close - bb_upper) / bb_upper * 100
                    })

            logger.info(f"Found {len(signals)} signals for {symbol}")
            return signals

        except Exception as e:
            logger.error(f"Error finding signals: {e}")
            return []

    def save_signals(self, symbol: str, signals: List[Dict]):
        """Save signals to database"""
        if not signals:
            return

        try:
            rows = []
            for signal in signals:
                rows.append((
                    symbol,
                    signal['type'],
                    signal['indicator'],
                    signal['strength'],
                    pd.Timestamp.now().strftime('%Y-%m-%d')
                ))

            query = """
                INSERT INTO signals (symbol, signal_type, indicator, strength, date)
                VALUES (?, ?, ?, ?, ?)
            """
            execute_many(query, rows)

            logger.info(f"Saved {len(rows)} signals for {symbol}")

        except Exception as e:
            logger.error(f"Error saving signals: {e}")


# Test function
if __name__ == "__main__":
    service = TechnicalAnalysisService()

    print("Testing Technical Analysis Service...")

    # Get market data
    df = service.get_market_data("AAPL", days=50)
    print(f"Fetched {len(df)} days of market data")

    if not df.empty:
        # Calculate indicators
        df = service.calculate_indicators(df)
        print(f"Calculated indicators. Columns: {list(df.columns)[:10]}...")

        # Find signals
        signals = service.find_signals("AAPL")
        print(f"\nFound {len(signals)} signals:")
        for signal in signals:
            print(f"  {signal['type']}: {signal['indicator']} (strength: {signal['strength']:.1f})")
