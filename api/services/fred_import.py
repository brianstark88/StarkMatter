"""
FRED (Federal Reserve Economic Data) Service
Fetches economic indicators from the St. Louis Fed
Free API with registration
"""
import os
import logging
from typing import Dict, List
from datetime import datetime
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_many, execute_query

logger = logging.getLogger(__name__)

try:
    from fredapi import Fred
    FRED_AVAILABLE = True
except ImportError:
    FRED_AVAILABLE = False
    logger.warning("fredapi not installed - FRED service unavailable")


class FREDService:
    """Service for fetching economic data from FRED"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('FRED_API_KEY')

        if not FRED_AVAILABLE:
            logger.warning("fredapi library not installed")
            self.fred = None
            return

        if not self.api_key or self.api_key == 'your_free_key_here':
            logger.warning("FRED API key not configured")
            self.fred = None
        else:
            self.fred = Fred(api_key=self.api_key)

        # Economic indicator codes
        self.indicators = {
            'DGS10': '10-Year Treasury Yield',
            'DGS2': '2-Year Treasury Yield',
            'UNRATE': 'Unemployment Rate',
            'CPIAUCSL': 'CPI Inflation',
            'GDP': 'GDP Growth',
            'DEXUSEU': 'USD/EUR Exchange Rate',
            'VIXCLS': 'VIX Volatility Index',
            'FEDFUNDS': 'Federal Funds Rate',
            'T10Y2Y': '10-Year minus 2-Year Treasury Spread',
            'DCOILWTICO': 'Crude Oil Prices (WTI)',
            'GOLDAMGBD228NLBM': 'Gold Prices'
        }

    def fetch_indicator(self, series_id: str, observation_start: str = None) -> Dict:
        """
        Fetch a single economic indicator

        Args:
            series_id: FRED series ID (e.g., 'DGS10' for 10-year treasury)
            observation_start: Start date for data (YYYY-MM-DD format)

        Returns:
            Dictionary with series data
        """
        if not self.fred:
            logger.warning("FRED service not initialized - skipping fetch")
            return {}

        try:
            if observation_start:
                series = self.fred.get_series(series_id, observation_start=observation_start)
            else:
                series = self.fred.get_series_latest_release(series_id)

            logger.info(f"Fetched {len(series)} observations for {series_id}")

            return {
                'series_id': series_id,
                'data': series.to_dict(),
                'latest_value': float(series.iloc[-1]) if len(series) > 0 else None,
                'latest_date': series.index[-1].strftime('%Y-%m-%d') if len(series) > 0 else None
            }

        except Exception as e:
            logger.error(f"Error fetching FRED series {series_id}: {e}")
            return {}

    def fetch_all_indicators(self) -> Dict[str, Dict]:
        """
        Fetch all configured economic indicators

        Returns:
            Dictionary mapping indicator names to their data
        """
        if not self.fred:
            logger.warning("FRED service not initialized - skipping fetch")
            return {}

        data = {}

        for code, name in self.indicators.items():
            try:
                result = self.fetch_indicator(code)
                if result:
                    data[name] = result
            except Exception as e:
                logger.error(f"Error fetching {name} ({code}): {e}")

        logger.info(f"Fetched {len(data)} economic indicators")
        return data

    def save_to_database(self, indicators_data: Dict[str, Dict]):
        """
        Save economic indicators to database

        Args:
            indicators_data: Dictionary of indicator data from fetch_all_indicators
        """
        if not indicators_data:
            logger.warning("No indicator data to save")
            return

        try:
            rows = []

            for name, data in indicators_data.items():
                series_id = data.get('series_id')
                latest_value = data.get('latest_value')
                latest_date = data.get('latest_date')

                if latest_value and latest_date:
                    rows.append((
                        series_id,
                        name,
                        latest_value,
                        latest_date,
                        'FRED'
                    ))

            if rows:
                query = """
                    INSERT OR REPLACE INTO economic_indicators
                    (indicator_code, indicator_name, value, date, source)
                    VALUES (?, ?, ?, ?, ?)
                """
                execute_many(query, rows)

                logger.info(f"Saved {len(rows)} economic indicators to database")
        except Exception as e:
            logger.error(f"Error saving economic indicators: {e}")

    def get_latest_indicators(self) -> Dict[str, float]:
        """
        Get latest values for all indicators

        Returns:
            Dictionary mapping indicator names to their latest values
        """
        data = self.fetch_all_indicators()

        latest = {}
        for name, indicator_data in data.items():
            if indicator_data.get('latest_value'):
                latest[name] = indicator_data['latest_value']

        return latest


# Test function
if __name__ == "__main__":
    service = FREDService()

    if service.fred:
        print("Testing FRED Service...")

        # Fetch single indicator
        vix_data = service.fetch_indicator('VIXCLS')
        print(f"VIX latest: {vix_data.get('latest_value')}")

        # Fetch all
        all_data = service.fetch_all_indicators()
        print(f"Fetched {len(all_data)} indicators")

        latest = service.get_latest_indicators()
        for name, value in latest.items():
            print(f"{name}: {value}")
    else:
        print("FRED service not configured")
