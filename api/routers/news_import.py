"""
News Import Router with Background Task Support
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import logging
import json
import sys
import os
import uuid
from typing import Dict, Any
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.news_aggregator import NewsAggregator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/news", tags=["news"])

# In-memory task storage
task_status: Dict[str, Dict[str, Any]] = {}


def run_news_import(task_id: str, limit_per_source: int = 5, days_back: int = 10):
    """
    Background task that imports news and updates task status

    Args:
        task_id: Unique task identifier
        limit_per_source: Maximum articles per source
        days_back: Number of days back to fetch articles (default 10)
    """
    try:
        aggregator = NewsAggregator()
        sources = list(aggregator.feeds.keys())
        total_sources = len(sources)
        all_articles = []

        # Update initial status
        task_status[task_id] = {
            'status': 'processing',
            'total_sources': total_sources,
            'current_source': 0,
            'sources': {},
            'total_articles': 0,
            'new_articles': 0,
            'duplicates_skipped': 0,
            'started_at': datetime.now().isoformat()
        }

        # Process each source
        for idx, (source, url) in enumerate(aggregator.feeds.items(), 1):
            # Update processing status
            task_status[task_id]['current_source'] = idx
            task_status[task_id]['sources'][source] = {
                'status': 'processing',
                'articles_count': 0
            }

            try:
                # Fetch articles from this source (last 10 days)
                articles = aggregator.fetch_feed(source, url, limit_per_source, days_back)
                all_articles.extend(articles)

                # Update completed status
                task_status[task_id]['sources'][source] = {
                    'status': 'completed',
                    'articles_count': len(articles)
                }

            except Exception as e:
                logger.error(f"Error fetching from {source}: {e}")
                task_status[task_id]['sources'][source] = {
                    'status': 'error',
                    'error': str(e),
                    'articles_count': 0
                }

        # Save all articles to database (with duplicate detection)
        task_status[task_id]['status'] = 'saving'

        # Count new vs duplicates
        new_count = 0
        dup_count = 0
        for article in all_articles:
            if not aggregator.check_duplicate(article['title'], article['url']):
                new_count += 1
            else:
                dup_count += 1

        aggregator.save_to_database(all_articles)

        # Mark complete
        task_status[task_id]['status'] = 'completed'
        task_status[task_id]['total_articles'] = len(all_articles)
        task_status[task_id]['new_articles'] = new_count
        task_status[task_id]['duplicates_skipped'] = dup_count
        task_status[task_id]['completed_at'] = datetime.now().isoformat()

    except Exception as e:
        logger.error(f"Error in news import: {e}")
        task_status[task_id]['status'] = 'error'
        task_status[task_id]['error'] = str(e)


@router.post("/import/start")
async def start_news_import(background_tasks: BackgroundTasks, limit_per_source: int = 5, days_back: int = 10):
    """
    Start a background news import task

    Args:
        limit_per_source: Number of articles per source (default 5)
        days_back: Number of days back to fetch articles (default 10)

    Returns:
        JSONResponse with task_id
    """
    task_id = str(uuid.uuid4())

    # Initialize task status
    task_status[task_id] = {
        'status': 'starting',
        'total_sources': 0,
        'current_source': 0,
        'sources': {},
        'total_articles': 0,
        'new_articles': 0,
        'duplicates_skipped': 0
    }

    # Start background task
    background_tasks.add_task(run_news_import, task_id, limit_per_source, days_back)

    return JSONResponse({
        'task_id': task_id,
        'status': 'started'
    })


@router.get("/import/status/{task_id}")
async def get_import_status(task_id: str):
    """
    Get the status of a news import task

    Args:
        task_id: The UUID of the import task

    Returns:
        JSONResponse with current task status
    """
    if task_id not in task_status:
        raise HTTPException(status_code=404, detail="Task not found")

    return JSONResponse(task_status[task_id])
