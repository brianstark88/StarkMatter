"""
StarkMatter Trading Platform - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime
from database import init_database

# Import routers
from routers import market_data, portfolio, websocket, symbols, ai_analysis, system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="StarkMatter Trading API",
    description="Local-first, AI-powered trading platform using free data sources",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(market_data.router)
app.include_router(portfolio.router)
app.include_router(websocket.router)
app.include_router(symbols.router)
app.include_router(ai_analysis.router)
app.include_router(system.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Starting StarkMatter Trading API...")
    try:
        init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "StarkMatter Trading API",
        "version": "0.1.0",
        "status": "running",
        "description": "Local-first trading platform with free data sources",
        "endpoints": {
            "docs": "/docs",
            "market_data": "/api/market",
            "portfolio": "/api/portfolio"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/dashboard")
async def get_dashboard():
    """
    Get dashboard summary data

    Returns:
        Combined market and portfolio data for dashboard
    """
    from services.portfolio import PortfolioService
    from services.paper_trading import PaperTradingEngine
    from database import execute_query

    try:
        # Get portfolio data
        portfolio_service = PortfolioService()
        portfolio = portfolio_service.calculate_portfolio_value()

        # Get paper trading performance
        paper_engine = PaperTradingEngine()
        paper_performance = paper_engine.get_performance()

        # Get recent news
        news_query = "SELECT * FROM news ORDER BY published_at DESC LIMIT 5"
        recent_news = execute_query(news_query, fetch='all')

        # Get watchlist
        watchlist_query = "SELECT * FROM watchlist ORDER BY symbol"
        watchlist = execute_query(watchlist_query, fetch='all')

        return {
            "portfolio": portfolio,
            "paper_trading": paper_performance,
            "recent_news": recent_news if recent_news else [],
            "watchlist": watchlist if watchlist else []
        }

    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        return {
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
