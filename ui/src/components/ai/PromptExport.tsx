import { useState } from 'react';
import { Copy, Check, X, ExternalLink } from 'lucide-react';
import type { RenderPromptResponse } from '../../types/ai';

interface PromptExportProps {
  promptData: RenderPromptResponse | null;
  onClose: () => void;
  onContinue: () => void;
}

export default function PromptExport({ promptData, onClose, onContinue }: PromptExportProps) {
  const [copied, setCopied] = useState(false);

  if (!promptData) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptData.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard. Please select and copy manually.');
    }
  };

  const tokenCount = promptData.metadata.estimated_tokens;
  const temperature = promptData.metadata.temperature;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Prompt Ready to Copy</h2>
            <p className="text-sm text-gray-600 mt-1">
              Template: {promptData.template.category}/{promptData.template.name} v{promptData.template.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Manual Mode Instructions</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li><strong>1.</strong> Click "Copy Prompt" below</li>
            <li><strong>2.</strong> Paste into Claude Code CLI and run</li>
            <li><strong>3.</strong> Copy Claude's response</li>
            <li><strong>4.</strong> Click "Continue" to paste the response back here</li>
          </ol>
        </div>

        {/* Prompt Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800 leading-relaxed">
              {promptData.prompt}
            </pre>
          </div>

          {/* Metadata */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="font-semibold">Estimated Tokens:</span> ~{tokenCount}
            </div>
            <div>
              <span className="font-semibold">Temperature:</span> {temperature}
            </div>
            <div>
              <span className="font-semibold">Max Tokens:</span> {promptData.metadata.max_tokens}
            </div>
            <div>
              <span className="font-semibold">Generation Time:</span> {promptData.metadata.execution_time_ms}ms
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-3">
            <a
              href="https://claude.ai/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Claude Code</span>
            </a>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
            <button
              onClick={onContinue}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
