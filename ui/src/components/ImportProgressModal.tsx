import React from 'react';
import { X, CheckCircle, Loader, AlertCircle } from 'lucide-react';

interface ProgressItem {
  source: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  articlesProcessed?: number;
  totalArticles?: number;
  message?: string;
}

interface ImportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ProgressItem[];
  isComplete: boolean;
  totalArticles: number;
}

const ImportProgressModal: React.FC<ImportProgressModalProps> = ({
  isOpen,
  onClose,
  progress,
  isComplete,
  totalArticles
}) => {
  if (!isOpen) return null;

  const getStatusIcon = (status: ProgressItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const totalSources = progress.length;
  const progressPercentage = totalSources > 0 ? (completedCount / totalSources) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={isComplete ? onClose : undefined} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Importing News Articles
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Overall Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Overall Progress</span>
                <span>{completedCount} / {totalSources} sources</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Progress List */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {progress.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.source}
                      </p>
                      {item.articlesProcessed !== undefined && item.totalArticles !== undefined && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.articlesProcessed}/{item.totalArticles}
                        </span>
                      )}
                    </div>
                    {item.message && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {isComplete ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Import Complete! {totalArticles} articles imported.
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Extracting article content from sources...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportProgressModal;
