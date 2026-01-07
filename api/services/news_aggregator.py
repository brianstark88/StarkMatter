"""
News Aggregator Service
Fetches financial news from RSS feeds (free, no API key required)
"""
import feedparser
import logging
from datetime import datetime, timedelta
from typing import List, Dict
import sys
import os
import pytz
import requests
from bs4 import BeautifulSoup
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_many, execute_query

logger = logging.getLogger(__name__)

# Eastern Time timezone
EST = pytz.timezone('America/New_York')


class NewsAggregator:
    """Service for aggregating financial news from RSS feeds"""

    def __init__(self):
        # Free RSS feeds for financial news with full article access
        # These sources provide reliable full article content without paywalls
        self.feeds = {
            'CNBC': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
            'CNBC Markets': 'https://www.cnbc.com/id/10000664/device/rss/rss.html',
            'CNBC Investing': 'https://www.cnbc.com/id/15839135/device/rss/rss.html',
            'Yahoo Finance': 'https://finance.yahoo.com/news/rssindex',
            'InvestorPlace': 'https://investorplace.com/feed/',
        }

        # Comprehensive headers to avoid bot blocking
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def extract_article_content(self, url: str, source: str, timeout: int = 15) -> str:
        """
        Extract full article content from URL using BeautifulSoup with source-specific selectors

        Args:
            url: Article URL
            source: News source name
            timeout: Timeout in seconds for downloading article

        Returns:
            Full article text or empty string if extraction fails
        """
        try:
            # Add small delay to be respectful to servers
            time.sleep(0.5)

            response = requests.get(url, headers=self.headers, timeout=timeout)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Remove script and style elements
            for script in soup(["script", "style", "nav", "header", "footer", "aside"]):
                script.decompose()

            # Source-specific content extraction
            content_text = ""

            if 'cnbc' in url.lower():
                # CNBC article content
                article_body = soup.find('div', class_='ArticleBody-articleBody')
                if not article_body:
                    article_body = soup.find('div', {'itemprop': 'articleBody'})
                if not article_body:
                    article_body = soup.find('article')
                if article_body:
                    paragraphs = article_body.find_all('p')
                    content_text = '\n\n'.join([p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)])

            elif 'yahoo' in url.lower() or 'finance.yahoo' in url.lower():
                # Yahoo Finance uses caas-body class
                article_body = soup.find('div', class_='caas-body')
                if not article_body:
                    article_body = soup.find('article')
                if article_body:
                    paragraphs = article_body.find_all('p')
                    content_text = '\n\n'.join([p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 20])

            elif 'investorplace' in url.lower():
                # InvestorPlace uses entry-content class
                article_body = soup.find('div', class_='entry-content')
                if not article_body:
                    article_body = soup.find('article')
                if article_body:
                    paragraphs = article_body.find_all('p')
                    content_text = '\n\n'.join([p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 20])

            else:
                # Generic fallback - try to find article or main content
                article_body = soup.find('article') or soup.find('main') or soup.find('div', class_=lambda x: x and 'content' in x.lower() if x else False)
                if article_body:
                    paragraphs = article_body.find_all('p')
                    content_text = '\n\n'.join([p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)])

            # Only return if we got substantial content (> 500 chars for actual article content)
            if content_text and len(content_text) > 500:
                logger.info(f"Extracted {len(content_text)} characters from {source}: {url}")
                return content_text
            else:
                logger.warning(f"Extracted content too short ({len(content_text)} chars) from {source}: {url}")
                return ""

        except requests.Timeout:
            logger.warning(f"Timeout extracting content from {url}")
            return ""
        except requests.RequestException as e:
            logger.warning(f"Request failed for {url}: {e}")
            return ""
        except Exception as e:
            logger.warning(f"Failed to extract content from {url}: {e}")
            return ""

    def fetch_feed(self, source: str, url: str, limit: int = 10, days_back: int = 10) -> List[Dict]:
        """
        Fetch articles from a single RSS feed and extract full content

        Args:
            source: Name of the news source
            url: RSS feed URL
            limit: Maximum number of articles to fetch
            days_back: Number of days back to fetch articles (default 10)

        Returns:
            List of article dictionaries
        """
        try:
            feed = feedparser.parse(url)
            cutoff_date = datetime.now(pytz.UTC) - timedelta(days=days_back)

            articles = []
            for entry in feed.entries:
                # Parse publication date
                published = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published = datetime(*entry.published_parsed[:6], tzinfo=pytz.UTC)
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published = datetime(*entry.updated_parsed[:6], tzinfo=pytz.UTC)
                else:
                    published = datetime.now(pytz.UTC)

                # Skip articles older than cutoff date
                if published < cutoff_date:
                    continue

                # Stop if we've reached the limit
                if len(articles) >= limit:
                    break

                # Convert to EST
                published_est = published.astimezone(EST)

                article_url = entry.get('link', '')

                # Extract full article content
                content = self.extract_article_content(article_url, source)

                article = {
                    'title': entry.get('title', ''),
                    'source': source,
                    'url': article_url,
                    'summary': entry.get('summary', ''),
                    'content': content,
                    'published': published_est
                }

                articles.append(article)

            logger.info(f"Fetched {len(articles)} articles from {source} (last {days_back} days)")
            return articles

        except Exception as e:
            logger.error(f"Error fetching feed from {source}: {e}")
            return []

    def fetch_all_news(self, limit_per_source: int = 10, days_back: int = 10) -> List[Dict]:
        """
        Aggregate news from all configured sources

        Args:
            limit_per_source: Maximum articles per source
            days_back: Number of days back to fetch articles (default 10)

        Returns:
            List of all articles from all sources
        """
        all_articles = []

        for source, url in self.feeds.items():
            articles = self.fetch_feed(source, url, limit_per_source, days_back)
            all_articles.extend(articles)

        # Sort by publication date (newest first)
        all_articles.sort(key=lambda x: x['published'], reverse=True)

        logger.info(f"Aggregated {len(all_articles)} total articles from {len(self.feeds)} sources (last {days_back} days)")
        return all_articles

    def check_duplicate(self, title: str, url: str) -> bool:
        """
        Check if article already exists in database by title or URL

        Args:
            title: Article title
            url: Article URL

        Returns:
            True if duplicate exists, False otherwise
        """
        try:
            # Check by URL (exact match)
            url_check = execute_query(
                "SELECT COUNT(*) as count FROM news WHERE url = ?",
                (url,)
            )
            if url_check and url_check[0]['count'] > 0:
                return True

            # Check by title (case-insensitive)
            title_check = execute_query(
                "SELECT COUNT(*) as count FROM news WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))",
                (title,)
            )
            if title_check and title_check[0]['count'] > 0:
                return True

            return False

        except Exception as e:
            logger.error(f"Error checking duplicate: {e}")
            return False

    def save_to_database(self, articles: List[Dict]):
        """
        Save articles to database, skipping duplicates

        Args:
            articles: List of article dictionaries
        """
        if not articles:
            logger.warning("No articles to save")
            return

        try:
            rows = []
            skipped = 0

            for article in articles:
                # Check for duplicates before adding
                if self.check_duplicate(article['title'], article['url']):
                    skipped += 1
                    logger.debug(f"Skipping duplicate: {article['title']}")
                    continue

                rows.append((
                    article['title'],
                    article['source'],
                    article['url'],
                    article.get('summary'),
                    article.get('content'),  # Full article content
                    None,  # symbols (to be extracted later)
                    None,  # sentiment_score (to be calculated later)
                    article['published'].strftime('%Y-%m-%d %H:%M:%S')
                ))

            if rows:
                query = """
                    INSERT INTO news
                    (title, source, url, summary, content, symbols, sentiment_score, published_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                execute_many(query, rows)

                logger.info(f"Saved {len(rows)} new articles to database (skipped {skipped} duplicates)")
            else:
                logger.info(f"No new articles to save (skipped {skipped} duplicates)")

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
