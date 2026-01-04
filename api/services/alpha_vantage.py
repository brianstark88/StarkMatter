"""
Alpha Vantage API Service
Provides technical indicators and additional market data
Free tier: 25 API calls per day
"""
import httpx
import logging
import os
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class AlphaVantageService:
    """Service for fetching data from Alpha Vantage API"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('ALPHA_VANTAGE_API_KEY')
        self.base_url = "https://www.alphavantage.co/query"
        self.daily_calls = 0
        self.max_daily = int(os.getenv('ALPHA_VANTAGE_LIMIT', 25))

        if not self.api_key or self.api_key == 'your_free_key_here':
            logger.warning("Alpha Vantage API key not configured")

    def _check_rate_limit(self):
        """Check if rate limit has been reached"""
        if self.daily_calls >= self.max_daily:
            raise Exception(f"Alpha Vantage daily API limit reached ({self.max_daily} calls)")

    async def fetch_technical_indicator(
        self,
        symbol: str,
        indicator: str,
        interval: str = "daily",
        time_period: int = 14
    ) -> Dict:
        """
        Fetch technical indicators

        Args:
            symbol: Stock ticker symbol
            indicator: Indicator name (RSI, MACD, SMA, EMA, etc.)
            interval: Time interval (1min, 5min, 15min, 30min, 60min, daily, weekly, monthly)
            time_period: Number of data points for calculation

        Returns:
            Dictionary with indicator data
        """
        self._check_rate_limit()

        if not self.api_key or self.api_key == 'your_free_key_here':
            logger.warning("Skipping Alpha Vantage call - API key not configured")
            return {}

        params = {
            'function': indicator,
            'symbol': symbol,
            'interval': interval,
            'time_period': time_period,
            'apikey': self.api_key
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params, timeout=30.0)
                response.raise_for_status()

                self.daily_calls += 1
                data = response.json()

                # Check for errors
                if 'Error Message' in data:
                    logger.error(f"Alpha Vantage error: {data['Error Message']}")
                    return {}

                if 'Note' in data:
                    logger.warning(f"Alpha Vantage rate limit notice: {data['Note']}")
                    return {}

                logger.info(f"Fetched {indicator} for {symbol} (calls: {self.daily_calls}/{self.max_daily})")
                return data

        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching {indicator} for {symbol}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error fetching {indicator} for {symbol}: {e}")
            return {}

    async def fetch_rsi(self, symbol: str, interval: str = "daily", time_period: int = 14) -> Dict:
        """Fetch RSI (Relative Strength Index)"""
        return await self.fetch_technical_indicator(symbol, "RSI", interval, time_period)

    async def fetch_macd(self, symbol: str, interval: str = "daily") -> Dict:
        """Fetch MACD (Moving Average Convergence Divergence)"""
        params = {
            'function': 'MACD',
            'symbol': symbol,
            'interval': interval,
            'apikey': self.api_key
        }

        self._check_rate_limit()

        if not self.api_key or self.api_key == 'your_free_key_here':
            logger.warning("Skipping Alpha Vantage call - API key not configured")
            return {}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params, timeout=30.0)
                response.raise_for_status()

                self.daily_calls += 1
                data = response.json()

                logger.info(f"Fetched MACD for {symbol}")
                return data

        except Exception as e:
            logger.error(f"Error fetching MACD for {symbol}: {e}")
            return {}

    async def fetch_sma(self, symbol: str, interval: str = "daily", time_period: int = 50) -> Dict:
        """Fetch SMA (Simple Moving Average)"""
        return await self.fetch_technical_indicator(symbol, "SMA", interval, time_period)

    async def fetch_ema(self, symbol: str, interval: str = "daily", time_period: int = 20) -> Dict:
        """Fetch EMA (Exponential Moving Average)"""
        return await self.fetch_technical_indicator(symbol, "EMA", interval, time_period)

    async def fetch_bbands(self, symbol: str, interval: str = "daily", time_period: int = 20) -> Dict:
        """Fetch Bollinger Bands"""
        return await self.fetch_technical_indicator(symbol, "BBANDS", interval, time_period)

    async def fetch_company_overview(self, symbol: str) -> Dict:
        """
        Fetch company fundamental data

        Returns company overview including PE ratio, market cap, etc.
        """
        self._check_rate_limit()

        if not self.api_key or self.api_key == 'your_free_key_here':
            logger.warning("Skipping Alpha Vantage call - API key not configured")
            return {}

        params = {
            'function': 'OVERVIEW',
            'symbol': symbol,
            'apikey': self.api_key
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params, timeout=30.0)
                response.raise_for_status()

                self.daily_calls += 1
                data = response.json()

                logger.info(f"Fetched company overview for {symbol}")
                return data

        except Exception as e:
            logger.error(f"Error fetching company overview for {symbol}: {e}")
            return {}


# Test function
if __name__ == "__main__":
    import asyncio

    async def test():
        service = AlphaVantageService()

        print("Testing Alpha Vantage Service...")

        # Test RSI
        rsi_data = await service.fetch_rsi("AAPL")
        print(f"RSI data keys: {rsi_data.keys() if rsi_data else 'No data'}")

        # Test company overview
        overview = await service.fetch_company_overview("AAPL")
        print(f"Company overview keys: {overview.keys() if overview else 'No data'}")

    asyncio.run(test())
