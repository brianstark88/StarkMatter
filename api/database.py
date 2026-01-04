"""
Database module for StarkMatter Trading Platform
Handles SQLite database connection and initialization
"""
import sqlite3
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Database path
DB_PATH = Path(__file__).parent.parent / "data" / "trading.db"


def get_connection():
    """Get a database connection"""
    DB_PATH.parent.mkdir(exist_ok=True, parents=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn


def init_database():
    """Initialize SQLite database with schema"""
    logger.info(f"Initializing database at {DB_PATH}")

    # Create data directory if it doesn't exist
    DB_PATH.parent.mkdir(exist_ok=True, parents=True)

    # Create connection
    conn = sqlite3.connect(str(DB_PATH))

    # Read and execute schema
    schema_path = Path(__file__).parent / "schema.sql"
    with open(schema_path, 'r') as f:
        schema_sql = f.read()
        conn.executescript(schema_sql)

    conn.commit()
    conn.close()

    logger.info("Database initialized successfully")


def execute_query(query: str, params: tuple = None, fetch: str = None):
    """
    Execute a SQL query

    Args:
        query: SQL query string
        params: Query parameters
        fetch: 'one', 'all', or None

    Returns:
        Query results or None
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        conn.commit()

        if fetch == 'one':
            result = cursor.fetchone()
            return dict(result) if result else None
        elif fetch == 'all':
            results = cursor.fetchall()
            return [dict(row) for row in results]
        else:
            return None
    finally:
        conn.close()


def execute_many(query: str, params_list: list):
    """Execute a query with multiple parameter sets"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.executemany(query, params_list)
        conn.commit()
    finally:
        conn.close()
