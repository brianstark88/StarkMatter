import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { marketAPI } from '../lib/api';
import { formatDateTime, cn } from '../lib/utils';
import type { NewsArticle } from '../types';
import ImportProgressModal from '../components/ImportProgressModal';

interface ProgressItem {
  source: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  articlesProcessed?: number;
  totalArticles?: number;
  message?: string;
}

export default function News() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [loadingNews, setLoadingNews] = useState(true);
  const [importingNews, setImportingNews] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [importProgress, setImportProgress] = useState<ProgressItem[]>([]);
  const [importComplete, setImportComplete] = useState(false);
  const [totalImported, setTotalImported] = useState(0);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await marketAPI.getNews(50);
      // Ensure data is always an array
      const articles = Array.isArray(data) ? data : [];
      setNews(articles);
      // Auto-select first article
      if (articles.length > 0 && !selectedArticle) {
        setSelectedArticle(articles[0]);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
      setNews([]);
    } finally {
      setLoadingNews(false);
    }
  };

  const importNews = async () => {
    setImportingNews(true);
    setShowProgressModal(true);
    setImportProgress([]);
    setImportComplete(false);
    setTotalImported(0);
    setMessage(null);

    let taskId: string | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      // Start the background import task
      const startResponse = await marketAPI.startNewsImport(5);
      taskId = startResponse.task_id;

      // Initialize progress items
      const sources = ['MarketWatch', 'Yahoo Finance', 'Seeking Alpha'];
      setImportProgress(sources.map(source => ({
        source,
        status: 'pending' as const
      })));

      // Poll for status updates
      pollInterval = setInterval(async () => {
        if (!taskId) return;

        try {
          const status = await marketAPI.getNewsImportStatus(taskId);

          // Update progress based on status
          if (status.sources) {
            setImportProgress(Object.entries(status.sources).map(([source, sourceData]: [string, any]) => ({
              source,
              status: sourceData.status,
              articlesProcessed: sourceData.articles_count,
              totalArticles: sourceData.articles_count,
              message: sourceData.status === 'completed'
                ? `Extracted ${sourceData.articles_count} articles`
                : sourceData.status === 'processing'
                ? 'Fetching and extracting articles...'
                : sourceData.error || ''
            })));
          }

          // Handle completion
          if (status.status === 'completed') {
            setImportComplete(true);
            setTotalImported(status.total_articles || 0);
            setMessage({ type: 'success', text: `Successfully imported ${status.total_articles} articles!` });

            if (pollInterval) clearInterval(pollInterval);

            // Refresh news list
            setTimeout(() => {
              fetchNews();
              setImportingNews(false);
            }, 1000);
          } else if (status.status === 'error') {
            setImportComplete(true);
            setMessage({ type: 'error', text: status.error || 'Import failed' });

            if (pollInterval) clearInterval(pollInterval);
            setImportingNews(false);
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 1000); // Poll every second

    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to start import';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Failed to start import:', error);
      setImportingNews(false);
      setImportComplete(true);
      if (pollInterval) clearInterval(pollInterval);
    }
  };

  return (
    <>
      <ImportProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        progress={importProgress}
        isComplete={importComplete}
        totalArticles={totalImported}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial News</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Latest market news and analysis
          </p>
        </div>

        {/* Import Actions */}
        <div className="space-y-4">
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

          {/* Message Display */}
          {message && (
            <div className={cn(
              "px-4 py-3 rounded-lg flex items-center justify-between",
              message.type === 'success' && "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800",
              message.type === 'error' && "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800",
              message.type === 'info' && "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
            )}>
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="ml-4 text-current opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* News Feed */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Articles</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[calc(100vh-300px)] overflow-y-auto">
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
                  <article
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className={cn(
                      "p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer",
                      selectedArticle?.id === article.id && "bg-indigo-50 dark:bg-indigo-900/20"
                    )}
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{article.source}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDateTime(article.published_at)}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article Details</h2>
            </div>
            <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              {!selectedArticle ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  Select an article to view details
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                      {selectedArticle.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {selectedArticle.source}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(selectedArticle.published_at)}</span>
                    </div>
                  </div>

                  {/* Article Content */}
                  {selectedArticle.content ? (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Article Content
                      </h4>
                      <div className="prose dark:prose-invert max-w-none">
                        <div className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                          {selectedArticle.content}
                        </div>
                      </div>
                    </div>
                  ) : selectedArticle.summary ? (
                    <>
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                          Summary
                        </h4>
                        <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                          {selectedArticle.summary}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Note:</strong> Full article content not available. Click the button below to read on the publisher's website.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        No content available for this article.
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow-md"
                    >
                      <span>Read Full Article on {selectedArticle.source}</span>
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
