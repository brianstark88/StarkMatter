"""
Reddit Sentiment Scraper
Scrapes stock mentions and sentiment from trading subreddits
"""
import os
import logging
import re
from typing import List, Dict
from datetime import datetime
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_many

logger = logging.getLogger(__name__)

try:
    import praw
    from textblob import TextBlob
    PRAW_AVAILABLE = True
except ImportError:
    PRAW_AVAILABLE = False
    logger.warning("praw or textblob not installed - Reddit scraper unavailable")


class RedditScraper:
    """Service for scraping stock mentions from Reddit"""

    def __init__(self, client_id: str = None, client_secret: str = None, user_agent: str = None):
        self.client_id = client_id or os.getenv('REDDIT_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('REDDIT_CLIENT_SECRET')
        self.user_agent = user_agent or os.getenv('REDDIT_USER_AGENT', 'StarkMatter Trading Bot v1.0')

        if not PRAW_AVAILABLE:
            logger.warning("praw library not installed")
            self.reddit = None
            return

        if (not self.client_id or not self.client_secret or
            self.client_id == 'your_reddit_app_id' or
            self.client_secret == 'your_reddit_secret'):
            logger.warning("Reddit API credentials not configured")
            self.reddit = None
        else:
            try:
                self.reddit = praw.Reddit(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    user_agent=self.user_agent
                )
                logger.info("Reddit API initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Reddit API: {e}")
                self.reddit = None

        # Common words to filter out from ticker detection
        self.common_words = {
            'I', 'A', 'THE', 'AND', 'OR', 'BUT', 'IF', 'AT', 'BY', 'FOR',
            'TO', 'OF', 'IN', 'ON', 'IT', 'BE', 'ARE', 'WAS', 'SO', 'AS',
            'ALL', 'OUT', 'UP', 'GO', 'DO', 'NEW', 'NOW', 'GET', 'CAN',
            'US', 'PM', 'AM', 'CEO', 'CFO', 'IPO', 'DD', 'IMO', 'FYI',
            'TL', 'DR', 'EDIT', 'UPDATE', 'YOLO', 'HODL', 'DD', 'TA'
        }

    def extract_tickers(self, text: str) -> List[str]:
        """
        Extract stock tickers from text

        Args:
            text: Text to search for tickers

        Returns:
            List of potential ticker symbols
        """
        # Match 1-5 letter uppercase words that could be tickers
        pattern = r'\b[A-Z]{1,5}\b'
        potential_tickers = re.findall(pattern, text)

        # Filter out common words and duplicates
        tickers = list(set([
            ticker for ticker in potential_tickers
            if ticker not in self.common_words
        ]))

        return tickers

    def analyze_sentiment(self, text: str) -> float:
        """
        Analyze sentiment of text using TextBlob

        Args:
            text: Text to analyze

        Returns:
            Sentiment score between -1 (negative) and 1 (positive)
        """
        try:
            if not PRAW_AVAILABLE:
                return 0.0

            blob = TextBlob(text)
            return blob.sentiment.polarity
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return 0.0

    def scrape_subreddit(
        self,
        subreddit_name: str = 'wallstreetbets',
        limit: int = 50,
        time_filter: str = 'day'
    ) -> List[Dict]:
        """
        Scrape posts from a subreddit

        Args:
            subreddit_name: Name of subreddit to scrape
            limit: Maximum number of posts to fetch
            time_filter: Time filter (hour, day, week, month, year, all)

        Returns:
            List of post data with ticker mentions and sentiment
        """
        if not self.reddit:
            logger.warning("Reddit API not initialized - skipping scrape")
            return []

        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            posts_data = []

            for post in subreddit.hot(limit=limit):
                # Combine title and selftext for analysis
                full_text = f"{post.title} {post.selftext}"

                # Extract tickers
                tickers = self.extract_tickers(full_text)

                # Analyze sentiment
                sentiment = self.analyze_sentiment(full_text)

                # Create entry for each ticker mentioned
                for ticker in tickers:
                    posts_data.append({
                        'post_id': post.id,
                        'subreddit': subreddit_name,
                        'title': post.title,
                        'score': post.score,
                        'num_comments': post.num_comments,
                        'ticker': ticker,
                        'sentiment': sentiment,
                        'created': datetime.fromtimestamp(post.created_utc)
                    })

            logger.info(f"Scraped {len(posts_data)} ticker mentions from r/{subreddit_name}")
            return posts_data

        except Exception as e:
            logger.error(f"Error scraping r/{subreddit_name}: {e}")
            return []

    def scrape_multiple_subreddits(
        self,
        subreddits: List[str] = None,
        limit_per_sub: int = 50
    ) -> List[Dict]:
        """
        Scrape multiple subreddits

        Args:
            subreddits: List of subreddit names
            limit_per_sub: Posts to fetch per subreddit

        Returns:
            Combined list of all ticker mentions
        """
        if subreddits is None:
            subreddits = ['wallstreetbets', 'stocks', 'investing', 'stockmarket']

        all_mentions = []

        for subreddit in subreddits:
            mentions = self.scrape_subreddit(subreddit, limit_per_sub)
            all_mentions.extend(mentions)

        logger.info(f"Total ticker mentions across all subreddits: {len(all_mentions)}")
        return all_mentions

    def save_to_database(self, mentions: List[Dict]):
        """
        Save Reddit mentions to database

        Args:
            mentions: List of mention dictionaries
        """
        if not mentions:
            logger.warning("No mentions to save")
            return

        try:
            rows = []
            for mention in mentions:
                rows.append((
                    mention['post_id'],
                    mention['subreddit'],
                    mention['title'],
                    mention['score'],
                    mention['num_comments'],
                    mention['ticker'],
                    mention['sentiment'],
                    mention['created'].strftime('%Y-%m-%d %H:%M:%S')
                ))

            query = """
                INSERT OR IGNORE INTO reddit_mentions
                (post_id, subreddit, title, score, num_comments, symbol, sentiment_score, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            execute_many(query, rows)

            logger.info(f"Saved {len(rows)} Reddit mentions to database")

        except Exception as e:
            logger.error(f"Error saving Reddit mentions: {e}")

    def get_trending_tickers(self, mentions: List[Dict], min_mentions: int = 3) -> Dict[str, Dict]:
        """
        Get trending tickers based on mention count and sentiment

        Args:
            mentions: List of mention dictionaries
            min_mentions: Minimum mentions to be considered trending

        Returns:
            Dictionary of trending tickers with stats
        """
        ticker_stats = {}

        for mention in mentions:
            ticker = mention['ticker']

            if ticker not in ticker_stats:
                ticker_stats[ticker] = {
                    'count': 0,
                    'total_sentiment': 0,
                    'total_score': 0,
                    'total_comments': 0
                }

            ticker_stats[ticker]['count'] += 1
            ticker_stats[ticker]['total_sentiment'] += mention['sentiment']
            ticker_stats[ticker]['total_score'] += mention['score']
            ticker_stats[ticker]['total_comments'] += mention['num_comments']

        # Filter and calculate averages
        trending = {}
        for ticker, stats in ticker_stats.items():
            if stats['count'] >= min_mentions:
                trending[ticker] = {
                    'mentions': stats['count'],
                    'avg_sentiment': stats['total_sentiment'] / stats['count'],
                    'avg_score': stats['total_score'] / stats['count'],
                    'total_comments': stats['total_comments']
                }

        # Sort by mention count
        trending = dict(sorted(
            trending.items(),
            key=lambda x: x[1]['mentions'],
            reverse=True
        ))

        return trending


# Test function
if __name__ == "__main__":
    scraper = RedditScraper()

    if scraper.reddit:
        print("Testing Reddit Scraper...")

        # Scrape wallstreetbets
        mentions = scraper.scrape_subreddit('wallstreetbets', limit=10)
        print(f"Found {len(mentions)} ticker mentions")

        # Get trending
        trending = scraper.get_trending_tickers(mentions)
        print(f"\nTrending tickers:")
        for ticker, stats in list(trending.items())[:10]:
            print(f"{ticker}: {stats['mentions']} mentions, sentiment: {stats['avg_sentiment']:.2f}")
    else:
        print("Reddit scraper not configured")
