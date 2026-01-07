import { Calendar, Clock, Copy, Check, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Analysis } from '../../types/ai';

interface AnalysisPanelProps {
  analysis: Analysis | null;
  onDelete?: (id: number) => void;
}

export default function AnalysisPanel({ analysis, onDelete }: AnalysisPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium">No Analysis Selected</p>
        <p className="text-sm">Run an analysis to see results here</p>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysis.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {analysis.symbol ? `${analysis.symbol} - ` : ''}
              {analysis.template_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(analysis.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{analysis.execution_time_ms || 0}ms</span>
              </div>
              <div>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {analysis.execution_mode}
                </span>
              </div>
              <div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {analysis.template_category}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy response"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(analysis.id)}
                className="p-2 hover:bg-red-100 rounded-md transition-colors"
                title="Delete analysis"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                // Custom rendering for better styling
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mb-4 text-gray-900">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-800">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 my-3">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 my-3">{children}</ol>
                ),
                p: ({ children }) => (
                  <p className="my-3 leading-relaxed text-gray-700">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2 bg-gray-50 text-left text-sm font-semibold text-gray-700">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2 border-t border-gray-200 text-sm text-gray-600">
                    {children}
                  </td>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-red-600">
                      {children}
                    </code>
                  ) : (
                    <code className="block p-4 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
                      {children}
                    </code>
                  );
                },
              }}
            >
              {analysis.response}
            </ReactMarkdown>
          </div>
        </div>

        {/* Structured Data (if available) */}
        {analysis.structured_data && Object.keys(analysis.structured_data).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Parsed Data</h3>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm font-mono">
                {JSON.stringify(analysis.structured_data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
