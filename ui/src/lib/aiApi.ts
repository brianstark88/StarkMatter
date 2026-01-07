/**
 * AI Analysis API Client
 */

import axios from 'axios';
import type {
  TemplateList,
  TemplateInfo,
  RenderPromptRequest,
  RenderPromptResponse,
  ImportResponseRequest,
  Analysis,
  AnalysisHistory,
  AIHealthStatus,
} from '../types/ai';

const API_BASE_URL = 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/ai`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * AI Analysis API
 */
export const aiAPI = {
  /**
   * List all available templates
   */
  listTemplates: async (category?: string): Promise<TemplateList> => {
    const response = await aiClient.get('/templates', {
      params: category ? { category } : {},
    });
    return response.data;
  },

  /**
   * Get detailed template information
   */
  getTemplate: async (category: string, name: string): Promise<TemplateInfo> => {
    const response = await aiClient.get(`/templates/${category}/${name}`);
    return response.data;
  },

  /**
   * Render a prompt template with data (for manual mode)
   */
  renderPrompt: async (request: RenderPromptRequest): Promise<RenderPromptResponse> => {
    const response = await aiClient.post('/render-prompt', request);
    return response.data;
  },

  /**
   * Import a Claude response after manual execution
   */
  importResponse: async (request: ImportResponseRequest): Promise<Analysis> => {
    const response = await aiClient.post('/import-response', request);
    return response.data;
  },

  /**
   * Get analysis history
   */
  getHistory: async (
    symbol?: string,
    category?: string,
    limit: number = 20
  ): Promise<AnalysisHistory> => {
    const response = await aiClient.get('/history', {
      params: { symbol, category, limit },
    });
    return response.data;
  },

  /**
   * Get a specific analysis by ID
   */
  getAnalysis: async (analysisId: number): Promise<Analysis> => {
    const response = await aiClient.get(`/history/${analysisId}`);
    return response.data;
  },

  /**
   * Delete an analysis
   */
  deleteAnalysis: async (analysisId: number): Promise<{ success: boolean; message: string }> => {
    const response = await aiClient.delete(`/history/${analysisId}`);
    return response.data;
  },

  /**
   * Get AI service health status
   */
  healthCheck: async (): Promise<AIHealthStatus> => {
    const response = await aiClient.get('/health');
    return response.data;
  },

  /**
   * Quick analysis helpers - convenience methods for common analyses
   */
  quickTechnicalAnalysis: async (symbol: string): Promise<RenderPromptResponse> => {
    return aiAPI.renderPrompt({
      category: 'technical',
      template_name: 'chart_analysis',
      symbol,
      parameters: {
        timeframe: 'daily',
      },
    });
  },

  quickNewsSentiment: async (symbol: string): Promise<RenderPromptResponse> => {
    return aiAPI.renderPrompt({
      category: 'sentiment',
      template_name: 'news_sentiment',
      symbol,
    });
  },

  quickTradeIdea: async (symbol: string): Promise<RenderPromptResponse> => {
    return aiAPI.renderPrompt({
      category: 'signals',
      template_name: 'multi_factor_trade',
      symbol,
    });
  },

  quickPortfolioCheck: async (): Promise<RenderPromptResponse> => {
    return aiAPI.renderPrompt({
      category: 'portfolio',
      template_name: 'diversification',
    });
  },

  explainConcept: async (concept: string, detailLevel: string = 'intermediate'): Promise<RenderPromptResponse> => {
    return aiAPI.renderPrompt({
      category: 'educational',
      template_name: 'concept_explainer',
      parameters: {
        concept,
        detail_level: detailLevel,
      },
    });
  },
};

export default aiAPI;
