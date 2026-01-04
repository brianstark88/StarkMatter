import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, MessageSquare } from 'lucide-react';
import { marketAPI } from '../lib/api';
import { formatDateTime, getSentimentColor } from '../lib/utils';
import type { NewsArticle, RedditSentiment } from '../types';

export default function News() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [sentiment, setSentiment] = useState<RedditSentiment[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingSentiment, setLoadingSentiment] = useState(true);
  const [importingNews, setImportingNews] = useState(false);
  const [importingReddit, setImportingReddit] = useState(false);

  useEffect(() => {
    fetchNews();
    fetchSentiment();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await marketAPI.getNews(20);
      // Ensure data is always an array
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      setNews([]);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchSentiment = async () => {
    try {
      const data = await marketAPI.getSentiment();
      // Ensure data is always an array
      setSentiment(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch sentiment:', error);
      setSentiment([]);
    } finally {
      setLoadingSentiment(false);
    }
  };

  const importNews = async () => {
    setImportingNews(true);
    try {
      await marketAPI.importNews();
      await fetchNews();
    } catch (error) {
      console.error('Failed to import news:', error);
    } finally {
      setImportingNews(false);
    }
  };

  const importReddit = async () => {
    setImportingReddit(true);
    try {
      await marketAPI.importReddit(['wallstreetbets', 'stocks', 'investing']);
      await fetchSentiment();
    } catch (error) {
      console.error('Failed to import Reddit data:', error);
    } finally {
      setImportingReddit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">News & Sentiment</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Latest market news and social sentiment analysis
        </p>
      </div>

      {/* Import Actions */}
      <div className="flex gap-4">
        <button
          onClick={importNews}
          disabled={importingNews}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {importingNews ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Newspaper className="h-4 w-4 mr-2" />
          )}
          {importingNews ? 'Importing...' : 'Import Latest News'}
        </button>
        <button
          onClick={importReddit}
          disabled={importingReddit}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {importingReddit ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4 mr-2" />
          )}
          {importingReddit ? 'Importing...' : 'Import Reddit Sentiment'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* News Feed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Latest News</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
            {loadingNews ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : news.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No news available. Click "Import Latest News" to fetch articles.
              </div>
            ) : (
              news.map((article) => (
                <article key={article.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{article.source}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDateTime(article.published_at)}</span>
                      <ExternalLink className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Reddit Sentiment */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reddit Sentiment</h2>
          </div>
          <div className="p-6">
            {loadingSentiment ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : sentiment.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No sentiment data available. Click "Import Reddit Sentiment" to analyze.
              </div>
            ) : (
              <div className="space-y-4">
                {sentiment.slice(0, 10).map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {item.symbol}
                      </span>
                      <span className={`text-sm font-medium ${getSentimentColor(item.sentiment_score)}`}>
                        Score: {(item.sentiment_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Mentions:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {item.mentions}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Bullish:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {item.bullish_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Bearish:</span>
                        <span className="ml-2 font-medium text-red-600">
                          {item.bearish_count}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      r/{item.subreddit} • {formatDateTime(item.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
