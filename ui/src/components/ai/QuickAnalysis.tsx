import { useState } from 'react';
import { TrendingUp, Newspaper, Lightbulb, PieChart, BookOpen } from 'lucide-react';
import type { QuickAnalysisCard } from '../../types/ai';

interface QuickAnalysisProps {
  symbol?: string;
  onAnalyze: (category: string, template: string, symbol?: string) => void;
  loading?: boolean;
}

const QUICK_ANALYSIS_CARDS: QuickAnalysisCard[] = [
  {
    id: 'technical',
    title: 'Technical Analysis',
    description: 'Chart patterns, indicators, and trade setups',
    icon: 'trending-up',
    category: 'technical',
    template: 'chart_analysis',
    requiredData: ['symbol'],
  },
  {
    id: 'sentiment',
    title: 'News Sentiment',
    description: 'Analyze recent news and market sentiment',
    icon: 'newspaper',
    category: 'sentiment',
    template: 'news_sentiment',
    requiredData: ['symbol'],
  },
  {
    id: 'trade',
    title: 'Trade Idea',
    description: 'Multi-factor analysis for trade opportunities',
    icon: 'lightbulb',
    category: 'signals',
    template: 'multi_factor_trade',
    requiredData: ['symbol'],
  },
  {
    id: 'portfolio',
    title: 'Portfolio Check',
    description: 'Diversification and risk analysis',
    icon: 'pie-chart',
    category: 'portfolio',
    template: 'diversification',
    requiredData: [],
  },
  {
    id: 'learn',
    title: 'Learn Concepts',
    description: 'Understand trading terms and strategies',
    icon: 'book-open',
    category: 'educational',
    template: 'concept_explainer',
    requiredData: [],
  },
];

const iconMap = {
  'trending-up': TrendingUp,
  'newspaper': Newspaper,
  'lightbulb': Lightbulb,
  'pie-chart': PieChart,
  'book-open': BookOpen,
};

export default function QuickAnalysis({ symbol, onAnalyze, loading }: QuickAnalysisProps) {
  const [learningConcept, setLearningConcept] = useState('');

  const handleAnalyze = (card: QuickAnalysisCard) => {
    // For educational, we need a concept input
    if (card.id === 'learn') {
      if (!learningConcept.trim()) {
        alert('Please enter a concept to learn about');
        return;
      }
      onAnalyze(card.category, card.template, learningConcept);
      return;
    }

    // For analyses requiring a symbol
    if (card.requiredData.includes('symbol') && !symbol) {
      alert('Please select a symbol first');
      return;
    }

    onAnalyze(card.category, card.template, symbol);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quick Analysis</h2>
        {symbol && (
          <div className="text-sm text-gray-600">
            Selected: <span className="font-semibold text-blue-600">{symbol}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_ANALYSIS_CARDS.map((card) => {
          const Icon = iconMap[card.icon as keyof typeof iconMap];
          const requiresSymbol = card.requiredData.includes('symbol');
          const isDisabled = loading || (requiresSymbol && !symbol);

          return (
            <div key={card.id} className="relative">
              <button
                onClick={() => handleAnalyze(card)}
                disabled={isDisabled}
                className={`
                  w-full p-6 border-2 rounded-lg text-left transition-all
                  ${
                    isDisabled
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                      : 'border-gray-300 hover:border-blue-500 hover:shadow-md bg-white'
                  }
                `}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${isDisabled ? 'bg-gray-200' : 'bg-blue-100'}`}>
                    <Icon className={`w-6 h-6 ${isDisabled ? 'text-gray-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                    {requiresSymbol && !symbol && (
                      <p className="text-xs text-orange-600 mt-2">⚠ Requires symbol</p>
                    )}
                  </div>
                </div>
              </button>

              {/* Special input for Learn Concepts */}
              {card.id === 'learn' && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="e.g., RSI divergence, MACD..."
                    value={learningConcept}
                    onChange={(e) => setLearningConcept(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAnalyze(card);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating analysis...</span>
        </div>
      )}
    </div>
  );
}
