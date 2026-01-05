"""WebSocket endpoints for real-time data streaming."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Set
import asyncio
import json
import logging
from datetime import datetime
import random

from services.yahoo_import import YahooFinanceService

logger = logging.getLogger(__name__)
router = APIRouter()

# Connected clients
connected_clients: Set[WebSocket] = set()

# Symbols being tracked
tracked_symbols: List[str] = ["AAPL", "GOOGL", "MSFT", "NVDA", "TSLA", "SPY", "QQQ", "META", "AMZN", "AMD"]

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

async def generate_mock_quote(symbol: str) -> dict:
    """Generate mock quote data for testing."""
    # Use deterministic seed for consistent prices
    seed = sum(ord(c) for c in symbol)
    base_price = 100 + (seed * 2.5) % 400

    # Add small random variation
    variation = random.uniform(-2, 2)
    current_price = base_price + variation

    # Calculate change from base
    change = current_price - base_price
    change_percent = (change / base_price) * 100

    return {
        "symbol": symbol,
        "price": round(current_price, 2),
        "change": round(change, 2),
        "changePercent": round(change_percent, 2),
        "volume": random.randint(10000000, 100000000),
        "bid": round(current_price - 0.01, 2),
        "ask": round(current_price + 0.01, 2),
        "high": round(current_price + random.uniform(1, 5), 2),
        "low": round(current_price - random.uniform(1, 5), 2),
        "timestamp": datetime.now().isoformat()
    }

async def stream_quotes():
    """Stream quote updates to all connected clients."""
    market_service = YahooFinanceService()

    while True:
        try:
            quotes = []
            for symbol in tracked_symbols:
                try:
                    # Try to get real quote data
                    quote_data = market_service.fetch_quote(symbol)
                    if quote_data:
                        quotes.append({
                            "symbol": symbol,
                            "price": quote_data.get("regularMarketPrice", 0),
                            "change": quote_data.get("regularMarketChange", 0),
                            "changePercent": quote_data.get("regularMarketChangePercent", 0),
                            "volume": quote_data.get("regularMarketVolume", 0),
                            "bid": quote_data.get("bid", 0),
                            "ask": quote_data.get("ask", 0),
                            "high": quote_data.get("regularMarketDayHigh", 0),
                            "low": quote_data.get("regularMarketDayLow", 0),
                            "timestamp": datetime.now().isoformat()
                        })
                    else:
                        # Fallback to mock data if real data unavailable
                        quotes.append(await generate_mock_quote(symbol))
                except Exception as e:
                    # Use mock data on error (silently, since this is expected initially)
                    quotes.append(await generate_mock_quote(symbol))

            # Broadcast quotes to all connected clients
            if manager.active_connections and quotes:
                message = json.dumps({
                    "type": "quotes",
                    "data": quotes,
                    "timestamp": datetime.now().isoformat()
                })
                await manager.broadcast(message)

            # Wait before next update (2 seconds for real-time feel)
            await asyncio.sleep(2)

        except Exception as e:
            logger.error(f"Error in quote streaming: {e}")
            await asyncio.sleep(5)  # Wait longer on error

@router.websocket("/ws/quotes")
async def websocket_quotes(websocket: WebSocket):
    """WebSocket endpoint for real-time quote streaming."""
    await manager.connect(websocket)

    # Start streaming task if it's the first connection
    if len(manager.active_connections) == 1:
        asyncio.create_task(stream_quotes())

    try:
        # Send initial quotes immediately
        initial_quotes = []
        for symbol in tracked_symbols:
            initial_quotes.append(await generate_mock_quote(symbol))

        await websocket.send_text(json.dumps({
            "type": "initial",
            "data": initial_quotes,
            "timestamp": datetime.now().isoformat()
        }))

        # Keep connection alive
        while True:
            # Wait for any message from client (ping/pong)
            data = await websocket.receive_text()

            # Handle subscription changes
            if data:
                try:
                    message = json.loads(data)
                    if message.get("type") == "subscribe":
                        symbols = message.get("symbols", [])
                        if symbols:
                            tracked_symbols.clear()
                            tracked_symbols.extend(symbols)
                            await websocket.send_text(json.dumps({
                                "type": "subscribed",
                                "symbols": tracked_symbols
                            }))
                except json.JSONDecodeError:
                    pass

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@router.websocket("/ws/trades/{symbol}")
async def websocket_trades(websocket: WebSocket, symbol: str):
    """WebSocket endpoint for real-time trade updates for a specific symbol."""
    await websocket.accept()

    try:
        while True:
            # Generate mock trade data
            trade = {
                "type": "trade",
                "symbol": symbol,
                "price": round(100 + random.uniform(-50, 50), 2),
                "size": random.randint(100, 10000),
                "time": datetime.now().isoformat(),
                "side": random.choice(["buy", "sell"])
            }

            await websocket.send_text(json.dumps(trade))
            await asyncio.sleep(random.uniform(0.5, 3))  # Random interval for realistic feel

    except WebSocketDisconnect:
        logger.info(f"Trade WebSocket disconnected for {symbol}")
    except Exception as e:
        logger.error(f"Trade WebSocket error for {symbol}: {e}")