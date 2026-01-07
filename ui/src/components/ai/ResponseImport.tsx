import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import type { RenderPromptResponse } from '../../types/ai';

interface ResponseImportProps {
  promptData: RenderPromptResponse | null;
  symbol?: string;
  onImport: (response: string) => void;
  onClose: () => void;
  importing?: boolean;
}

export default function ResponseImport({
  promptData,
  symbol,
  onImport,
  onClose,
  importing,
}: ResponseImportProps) {
  const [response, setResponse] = useState('');

  if (!promptData) return null;

  const handleSubmit = () => {
    if (!response.trim()) {
      alert('Please paste Claude\'s response');
      return;
    }

    onImport(response);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Import Claude Response</h2>
            <p className="text-sm text-gray-600 mt-1">
              Paste the response you received from Claude Code
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
        <div className="px-6 py-4 bg-green-50 border-b">
          <h3 className="font-semibold text-green-900 mb-2">✓ Copy Claude's Response</h3>
          <p className="text-sm text-green-800">
            Select all of Claude's response text and paste it into the box below.
            The system will parse and save the analysis automatically.
          </p>
        </div>

        {/* Response Textarea */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Claude's Response
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Paste Claude's full response here..."
              className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              disabled={importing}
            />
          </div>

          {/* Character count */}
          <div className="text-sm text-gray-600">
            {response.length > 0 && (
              <span>
                {response.length.toLocaleString()} characters
                {response.length > 100 && ' ✓'}
              </span>
            )}
          </div>

          {/* Context Info */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Analysis Context</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>
                <span className="font-semibold">Template:</span>{' '}
                {promptData.template.category}/{promptData.template.name}
              </div>
              {symbol && (
                <div>
                  <span className="font-semibold">Symbol:</span> {symbol}
                </div>
              )}
              <div>
                <span className="font-semibold">Prompt Tokens:</span> ~{promptData.metadata.estimated_tokens}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!response.trim() || importing}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Import & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
