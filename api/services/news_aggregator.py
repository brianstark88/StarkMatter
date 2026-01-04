"""
News Aggregator Service
Fetches financial news from RSS feeds (free, no API key required)
"""
import feedparser
import logging
from datetime import datetime
from typing import List, Dict
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_many

logger = logging.getLogger(__name__)


class NewsAggregator:
    """Service for aggregating financial news from RSS feeds"""

    def __init__(self):
        # Free RSS feeds for financial news
        self.feeds = {
            'CNBC': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
            'MarketWatch': 'http://feeds.marketwatch.com/marketwatch/topstories',
            'Reuters Business': 'https://feeds.reuters.com/reuters/businessNews',
            'Yahoo Finance': 'https://feeds.finance.yahoo.com/rss/2.0/headline',
            'Seeking Alpha': 'https://seekingalpha.com/feed.xml',
            'Bloomberg': 'https://www.bloomberg.com/feed/podcast/etf-report.xml'
        }

    def fetch_feed(self, source: str, url: str, limit: int = 10) -> List[Dict]:
        """
        Fetch articles from a single RSS feed

        Args:
            source: Name of the news source
            url: RSS feed URL
            limit: Maximum number of articles to fetch

        Returns:
            List of article dictionaries
        """
        try:
            feed = feedparser.parse(url)

            articles = []
            for entry in feed.entries[:limit]:
                # Parse publication date
                published = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published = datetime(*entry.published_parsed[:6])
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published = datetime(*entry.updated_parsed[:6])
                else:
                    published = datetime.now()

                article = {
                    'title': entry.get('title', ''),
                    'source': source,
                    'url': entry.get('link', ''),
                    'summary': entry.get('summary', ''),
                    'published': published
                }

                articles.append(article)

            logger.info(f"Fetched {len(articles)} articles from {source}")
            return articles

        except Exception as e:
            logger.error(f"Error fetching feed from {source}: {e}")
            return []

    def fetch_all_news(self, limit_per_source: int = 10) -> List[Dict]:
        """
        Aggregate news from all configured sources

        Args:
            limit_per_source: Maximum articles per source

        Returns:
            List of all articles from all sources
        """
        all_articles = []

        for source, url in self.feeds.items():
            articles = self.fetch_feed(source, url, limit_per_source)
            all_articles.extend(articles)

        # Sort by publication date (newest first)
        all_articles.sort(key=lambda x: x['published'], reverse=True)

        logger.info(f"Aggregated {len(all_articles)} total articles from {len(self.feeds)} sources")
        return all_articles

    def save_to_database(self, articles: List[Dict]):
        """
        Save articles to database

        Args:
            articles: List of article dictionaries
        """
        if not articles:
            logger.warning("No articles to save")
            return

        try:
            rows = []
            for article in articles:
                rows.append((
                    article['title'],
                    article['source'],
                    article['url'],
                    article.get('summary'),
                    None,  # symbols (to be extracted later)
                    None,  # sentiment_score (to be calculated later)
                    article['published'].strftime('%Y-%m-%d %H:%M:%S')
                ))

            query = """
                INSERT OR IGNORE INTO news
                (title, source, url, summary, symbols, sentiment_score, published_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            execute_many(query, rows)

            logger.info(f"Saved {len(rows)} articles to database")

        except Exception as e:
            logger.error(f"Error saving articles: {e}")

    def fetch_and_save(self, limit_per_source: int = 10):
        """Fetch news from all sources and save to database"""
        articles = self.fetch_all_news(limit_per_source)
        self.save_to_database(articles)
        return articles


# Test function
if __name__ == "__main__":
    aggregator = NewsAggregator()

    print("Testing News Aggregator...")
    articles = aggregator.fetch_all_news(limit_per_source=5)

    print(f"\nFetched {len(articles)} total articles")
    print("\nLatest 5 headlines:")
    for article in articles[:5]:
        print(f"- [{article['source']}] {article['title']}")
