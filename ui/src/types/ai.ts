/**
 * TypeScript types for AI Analysis features
 */

export interface TemplateMetadata {
  temperature?: number;
  max_tokens?: number;
  estimated_cost?: string;
  recommended_use_cases?: string[];
  typical_runtime?: string;
  data_freshness_required?: string;
  skill_level?: 'beginner' | 'intermediate' | 'advanced';
  requires_chain_of_thought?: boolean;
}

export interface Placeholder {
  name: string;
  type: 'string' | 'number' | 'data';
  required?: boolean;
  example?: string;
  default?: any;
  options?: string[];
  validation?: string;
  source?: string;
  days?: number;
  limit?: number;
  token_budget?: number;
}

export interface TemplateInfo {
  name: string;
  category: string;
  version: string;
  description: string;
  metadata?: TemplateMetadata;
  placeholders?: Placeholder[];
  output_format?: {
    type: string;
    required_sections?: string[];
    structured_fields?: any[];
  };
}

export interface TemplateSummary {
  category: string;
  name: string;
  version: string;
  description: string;
  metadata?: TemplateMetadata;
}

export interface RenderPromptRequest {
  category: string;
  template_name: string;
  symbol?: string;
  parameters?: Record<string, any>;
}

export interface RenderPromptResponse {
  prompt: string;
  template: {
    category: string;
    name: string;
    version: string;
  };
  metadata: {
    execution_time_ms: number;
    estimated_tokens: number;
    temperature: number;
    max_tokens: number;
  };
  parameters: Record<string, any>;
}

export interface ImportResponseRequest {
  category: string;
  template_name: string;
  symbol?: string;
  rendered_prompt: string;
  response: string;
  parameters?: Record<string, any>;
}

export interface ParsedResponse {
  raw: string;
  structured?: Record<string, any>;
  sections?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface Analysis {
  id: number;
  template_category: string;
  template_name: string;
  symbol?: string;
  input_data?: Record<string, any>;
  rendered_prompt?: string;
  response: string;
  structured_data?: ParsedResponse;
  execution_time_ms?: number;
  tokens_used?: number;
  model?: string;
  execution_mode: 'manual' | 'api';
  created_at: string;
}

export interface AnalysisHistory {
  analyses: Analysis[];
  count: number;
}

export interface TemplateList {
  templates: TemplateSummary[];
  count: number;
}

export interface AIHealthStatus {
  status: 'healthy' | 'unhealthy';
  templates_loaded: number;
  total_analyses: number;
  last_analysis?: string;
  services?: {
    prompt_manager: string;
    data_formatter: string;
    response_parser: string;
  };
  error?: string;
}

// UI State types
export type AnalysisTab = 'quick' | 'library' | 'history' | 'settings';

export interface QuickAnalysisCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  template: string;
  requiredData: string[];
}
