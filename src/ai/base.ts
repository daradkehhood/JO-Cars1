/**
 * AI Module Base Architecture — LOCAL, dependency-free AI engine.
 *
 * This module provides the abstract base for all "AI" features. Instead of
 * calling external LLMs, each module implements its own heuristics tailored
 * to the Jordanian car market. The result is:
 *  - Zero external API dependencies (no OpenAI billing)
 *  - Deterministic, fast, fully offline
 *  - Transparent and auditable logic
 *
 * The architecture is preserved (AIProviderType, BaseAIModule, parseJSON,
 * isAIReady) so existing route handlers and components keep working.
 */

export type AIProviderType = 'local' | 'custom';

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  model?: string;
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

/**
 * AI is always enabled in local mode — no key required.
 * Set DISABLE_AI="true" in env to force modules into "off" mode
 * (they still return data, but with reduced confidence and a flag).
 */
export function isAIEnabled(): boolean {
  return process.env.DISABLE_AI !== 'true';
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

  /**
   * Local AI is always ready. Kept for API compatibility with callers.
   */
  protected isAIReady(): boolean {
    return isAIEnabled();
  }

  /**
   * Robust JSON parser tolerant of markdown fences and surrounding prose.
   * Modules that build JSON strings internally call this when needed.
   */
  protected parseJSON<T>(text: string): T | null {
    if (!text || typeof text !== 'string') return null;

    // Strip markdown code fences: ```json ... ``` or ``` ... ```
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim()) as T;
      } catch {}
    }

    try {
      return JSON.parse(text) as T;
    } catch {}

    // Extract the first balanced { ... } block
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
          try {
            return JSON.parse(text.slice(start, i + 1)) as T;
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }

  /**
   * Syntactic helper — clamp a number into a min/max range.
   */
  protected clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }

  /**
   * Confidence factor between 0 and 100 based on how many of the
   * expected input fields are present. More complete inputs ⇒ higher confidence.
   */
  protected confidenceFromFields(filled: number, total: number, base = 50, bonus = 0): number {
    const completeness = total > 0 ? filled / total : 0;
    const score = base + Math.round(completeness * (90 - base)) + bonus;
    return this.clamp(score, 0, 95);
  }
}
