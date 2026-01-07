import { useState, useEffect } from 'react';
import { Brain, History, ChevronDown } from 'lucide-react';
import QuickAnalysis from '../components/ai/QuickAnalysis';
import PromptExport from '../components/ai/PromptExport';
import ResponseImport from '../components/ai/ResponseImport';
import AnalysisPanel from '../components/ai/AnalysisPanel';
import aiAPI from '../lib/aiApi';
import type { RenderPromptResponse, Analysis } from '../types/ai';

export default function AIInsights() {
  // State
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Modal states
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Data states
  const [currentPrompt, setCurrentPrompt] = useState<RenderPromptResponse | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<Analysis[]>([]);

  // Fetch symbols on mount
  useEffect(() => {
    fetchSymbols();
    fetchHistory();
  }, []);

  const fetchSymbols = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/symbols/list?limit=100');
      const data = await response.json();
      setSymbols(data.symbols.map((s: any) => s.symbol)); // All returned
    } catch (error) {
      console.error('Failed to fetch symbols:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await aiAPI.getHistory();
      setAnalysisHistory(data.analyses);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleAnalyze = async (category: string, template: string, symbolOrConcept?: string) => {
    setLoading(true);
    try {
      // Determine if this is a symbol-based or concept-based analysis
      const isEducational = category === 'educational';
      const symbol = isEducational ? undefined : (symbolOrConcept || selectedSymbol);
      const concept = isEducational ? symbolOrConcept : undefined;

      const parameters: any = {};
      if (concept) {
        parameters.concept = concept;
      }

      const promptData = await aiAPI.renderPrompt({
        category,
        template_name: template,
        symbol,
        parameters,
      });

      setCurrentPrompt(promptData);
      setShowPromptModal(true);
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      alert('Failed to generate prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToImport = () => {
    setShowPromptModal(false);
    setShowImportModal(true);
  };

  const handleImportResponse = async (response: string) => {
    if (!currentPrompt) return;

    setImporting(true);
    try {
      const analysis = await aiAPI.importResponse({
        category: currentPrompt.template.category,
        template_name: currentPrompt.template.name,
        symbol: currentPrompt.parameters.symbol,
        rendered_prompt: currentPrompt.prompt,
        response,
        parameters: currentPrompt.parameters,
      });

      setCurrentAnalysis(analysis);
      setShowImportModal(false);
      fetchHistory(); // Refresh history
      alert('Analysis imported successfully!');
    } catch (error) {
      console.error('Failed to import response:', error);
      alert('Failed to import response. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteAnalysis = async (id: number) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
      await aiAPI.deleteAnalysis(id);

      // Clear current analysis if it's the one being deleted
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(null);
      }

      fetchHistory();
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      alert('Failed to delete analysis.');
    }
  };

  const handleSelectHistoryItem = (analysis: Analysis) => {
    setCurrentAnalysis(analysis);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">AI Insights</h1>
          </div>
          <p className="text-gray-600">
            AI-powered analysis using Claude. Generate prompts, run them manually, and import results.
          </p>
        </div>

        {/* Symbol Selector */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Symbol (optional for some analyses)
          </label>
          <div className="relative inline-block w-64">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Choose Symbol --</option>
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Quick Analysis */}
        <div className="mb-8">
          <QuickAnalysis
            symbol={selectedSymbol}
            onAnalyze={handleAnalyze}
            loading={loading}
          />
        </div>

        {/* Results and History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analysis Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[600px]">
              <AnalysisPanel
                analysis={currentAnalysis}
                onDelete={handleDeleteAnalysis}
              />
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 h-[600px] flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                <History className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold">Recent Analyses</h3>
                <span className="text-sm text-gray-500">({analysisHistory.length})</span>
              </div>

              <div className="flex-1 overflow-auto space-y-2">
                {analysisHistory.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-sm">No analyses yet</p>
                    <p className="text-xs mt-1">Run an analysis to get started</p>
                  </div>
                ) : (
                  analysisHistory.map((analysis) => (
                    <button
                      key={analysis.id}
                      onClick={() => handleSelectHistoryItem(analysis)}
                      className={`
                        w-full text-left p-3 rounded-lg border transition-all
                        ${
                          currentAnalysis?.id === analysis.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="font-medium text-sm truncate">
                        {analysis.symbol && `${analysis.symbol} - `}
                        {analysis.template_name.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(analysis.created_at).toLocaleDateString()} •{' '}
                        <span className="capitalize">{analysis.template_category}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPromptModal && (
        <PromptExport
          promptData={currentPrompt}
          onClose={() => setShowPromptModal(false)}
          onContinue={handleContinueToImport}
        />
      )}

      {showImportModal && (
        <ResponseImport
          promptData={currentPrompt}
          symbol={selectedSymbol}
          onImport={handleImportResponse}
          onClose={() => setShowImportModal(false)}
          importing={importing}
        />
      )}
    </div>
  );
}
