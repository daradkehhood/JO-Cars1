/**
 * AI Module Base Architecture
 *
 * Provides the abstract base for AI modules and integrates them with the
 * OpenAIProvider located in `./providers/openai.ts`.
 *
 * The provider is instantiated lazily from process.env so that AI features
 * gracefully degrade to a heuristic fallback when OPENAI_API_KEY is missing
 * (premium toggles in env still allow normal UI without crashing).
 */

import { getOpenAIProvider, OpenAIProvider, ChatOptions } from './providers/openai';

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

/**
 * Web search call result — passes alongside the response text so callers
 * can show provenance URLs (real OpenSooq / JoCars listings etc.).
 */
export interface AIWebSearchResult {
  text: string;
  citedUrls: string[];
  success: boolean;
  error?: string;
}

export interface AIModule<TInput, TOutput> {
  name: string;
  version: string;
  provider: AIProviderType;
  process(input: TInput, onProgress?: (progress: AIProgress) => void): Promise<AIResult<TOutput>>;
  validate?(input: TInput): boolean;
}

/**
 * Whether AI is enabled in the current environment.
 * AI is enabled when:
 *  - DISABLE_AI is not 'true'
 *  - OPENAI_API_KEY is set
 */
export function isAIEnabled(): boolean {
  if (process.env.DISABLE_AI === 'true') return false;
  return Boolean(process.env.OPENAI_API_KEY);
}

export abstract class BaseAIModule<TInput, TOutput> implements AIModule<TInput, TOutput> {
  abstract name: string;
  abstract version: string;
  abstract provider: AIProviderType;
  protected config: AIProviderConfig;
  protected providerInstance: OpenAIProvider;

  constructor(config: AIProviderConfig) {
    this.config = config;
    // Use the shared singleton provider (initialized from env + this config).
    this.providerInstance = getOpenAIProvider();
  }

  abstract process(input: TInput, onProgress?: (progress: AIProgress) => void): Promise<AIResult<TOutput>>;

  validate(input: TInput): boolean {
    return input !== null && input !== undefined;
  }

  /**
   * Plain text chat completion (returns assistant's text).
   * Returns '' when the provider is unavailable, so callers fall back to heuristics.
   */
  protected async callAI(prompt: string, systemPrompt?: string, opts: ChatOptions = {}): Promise<string> {
    const result = await this.providerInstance.chat(prompt, { systemPrompt, ...opts });
    if (!result.success) return '';
    return result.text;
  }

  /**
   * Vision-enabled chat — analyze a list of images.
   */
  protected async callAIWithVision(
    prompt: string,
    images: { url: string; detail?: 'auto' | 'low' | 'high' }[],
    systemPrompt?: string,
    opts: ChatOptions = {}
  ): Promise<string> {
    const result = await this.providerInstance.chatWithVision(prompt, images, { systemPrompt, ...opts });
    if (!result.success) return '';
    return result.text;
  }

  /**
   * Web search-enabled chat — actually browses the internet.
   * Returns assistant text + cited URLs (for provenance display).
   */
  protected async callAIWithWebSearch(
    prompt: string,
    systemPrompt?: string,
    opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
  ): Promise<AIWebSearchResult> {
    const result = await this.providerInstance.chatWithWebSearch(prompt, { systemPrompt, ...opts });
    if (!result.success) {
      return { text: '', citedUrls: [], success: false, error: result.error };
    }
    return { text: result.text, citedUrls: result.citedUrls, success: true };
  }

  protected fallbackResponse(_prompt: string): string {
    return '';
  }

  /**
   * Robust JSON parser tolerant of markdown fences, surrounding prose,
   * and partial content. Strips code fences, finds the first { ... }
   * balanced object, then parses.
   */
  protected parseJSON<T>(text: string): T | null {
    if (!text || typeof text !== 'string') return null;

    // 1) Strip markdown code fences: ```json ... ``` or ``` ... ```
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      const inner = fenceMatch[1].trim();
      try {
        return JSON.parse(inner) as T;
      } catch {
        // fall through to balanced extraction
      }
    }

    // 2) Try as-is
    try {
      return JSON.parse(text) as T;
    } catch {
      // fall through
    }

    // 3) Extract the first balanced { ... } block
    const start = text.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(start, i + 1);
          try {
            return JSON.parse(candidate) as T;
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }

  /**
   * True when AI is active for this module (key present, not disabled).
   */
  protected isAIReady(): boolean {
    return this.providerInstance.isEnabled();
  }
}
