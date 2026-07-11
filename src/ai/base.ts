/**
 * AI Module Base Architecture
 * 
 * This modular architecture allows:
 * - Easy swapping of AI models/providers
 * - Pluggable pipeline stages
 * - Async processing with progress tracking
 * - Extensibility without modifying core code
 */

export type AIProviderType = 'openai' | 'google' | 'anthropic' | 'custom';

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey: string;
  model: string;
  baseUrl?: string;
  options?: Record<string, unknown>;
}

export interface AIProgress {
  stage: string;
  progress: number; // 0-100
  message?: string;
}

export interface AIResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  processingTime?: number;
}

export interface AIModule<TInput, TOutput> {
  name: string;
  version: string;
  provider: AIProviderType;
  process(input: TInput, onProgress?: (progress: AIProgress) => void): Promise<AIResult<TOutput>>;
  validate?(input: TInput): boolean;
}

export abstract class BaseAIModule<TInput, TOutput> implements AIModule<TInput, TOutput> {
  abstract name: string;
  abstract version: string;
  abstract provider: AIProviderType;
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract process(input: TInput, onProgress?: (progress: AIProgress) => void): Promise<AIResult<TOutput>>;

  validate(input: TInput): boolean {
    return input !== null && input !== undefined;
  }

  protected async callAI(_prompt: string, _systemPrompt?: string): Promise<string> {
    return this.fallbackResponse(_prompt);
  }

  protected fallbackResponse(_prompt: string): string {
    return '';
  }

  protected parseJSON<T>(text: string): T | null {
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }
}
