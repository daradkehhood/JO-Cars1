/**
 * OpenAI Provider — real integration with OpenAI's API.
 *
 * Supports:
 *  - Text completions (chat.completions)
 *  - Vision (chat.completions with image_url blocks)
 *  - Web Search (responses.create with web_search tool — actually browses the internet)
 *
 * Reads OPENAI_API_KEY and OPENAI_MODEL from env.
 */

import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VisionImage {
  url: string;
  detail?: 'auto' | 'low' | 'high';
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface ChatOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface VisionChatOptions extends ChatOptions {
  images: VisionImage[];
}

export interface WebSearchOptions extends ChatOptions {
  // Force web search tool on (default true)
  webSearch?: boolean;
  // When true the model must return valid JSON only (in the output_text).
  jsonMode?: boolean;
}

export interface ProviderResult {
  text: string;
  // Raw URLs the model read while searching (for provenance display)
  citedUrls: string[];
  success: boolean;
  error?: string;
}

export class OpenAIProvider {
  private client: OpenAI;
  private model: string;
  private enabled: boolean;

  constructor(config: ProviderConfig) {
    this.model = config.model || 'gpt-4o-mini';
    this.enabled = Boolean(config.apiKey);

    if (!this.enabled) {
      console.warn(JSON.stringify({
        level: 'SECURITY',
        action: 'OPENAI_DISABLED',
        message: 'OPENAI_API_KEY env var is not set — AI features will use heuristic fallback only',
      }));
    }

    this.client = new OpenAI({
      apiKey: config.apiKey || 'missing-key',
      baseURL: config.baseUrl,
      timeout: 30_000,
      maxRetries: 1,
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Plain text chat completion.
   */
  async chat(prompt: string, opts: ChatOptions = {}): Promise<ProviderResult> {
    if (!this.enabled) {
      return { text: '', citedUrls: [], success: false, error: 'OPENAI_API_KEY not configured' };
    }

    const messages: ChatMessage[] = [];
    if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
    messages.push({ role: 'user', content: prompt });

    try {
      const resp = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 1500,
        ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      });
      const text = resp.choices?.[0]?.message?.content || '';
      return { text, citedUrls: [], success: true };
    } catch (err: any) {
      console.error('[OpenAI chat]', err?.message || err);
      return {
        text: '',
        citedUrls: [],
        success: false,
        error: err?.message || 'chat completion failed',
      };
    }
  }

  /**
   * Vision chat — analyze images (car exteriors, interiors, engine bays).
   */
  async chatWithVision(prompt: string, images: VisionImage[], opts: ChatOptions = {}): Promise<ProviderResult> {
    if (!this.enabled) {
      return { text: '', citedUrls: [], success: false, error: 'OPENAI_API_KEY not configured' };
    }
    if (!images || images.length === 0) {
      return { text: '', citedUrls: [], success: false, error: 'no images provided' };
    }
    // Cap to 5 images to control latency + cost.
    const imgs = images.slice(0, 5);

    const userContent: any[] = [
      { type: 'text', text: prompt },
      ...imgs.map((img) => ({
        type: 'image_url',
        image_url: { url: img.url, detail: img.detail || 'low' },
      })),
    ];

    const messages: any[] = [];
    if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
    messages.push({ role: 'user', content: userContent });

    try {
      const resp = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1200,
        ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      });
      const text = resp.choices?.[0]?.message?.content || '';
      return { text, citedUrls: [], success: true };
    } catch (err: any) {
      console.error('[OpenAI vision]', err?.message || err);
      return {
        text: '',
        citedUrls: [],
        success: false,
        error: err?.message || 'vision completion failed',
      };
    }
  }

  /**
   * Web-search-enabled completion via Responses API.
   * The model actually goes to the internet and reads pages.
   * Returns cited URLs so the UI can display provenance.
   */
  async chatWithWebSearch(prompt: string, opts: WebSearchOptions = {}): Promise<ProviderResult> {
    if (!this.enabled) {
      return { text: '', citedUrls: [], success: false, error: 'OPENAI_API_KEY not configured' };
    }

    const input: any[] = [];
    if (opts.systemPrompt) input.push({ role: 'system', content: opts.systemPrompt });
    input.push({ role: 'user', content: prompt });

    const tools: any[] = [{ type: 'web_search' }];

    try {
      const resp = await this.client.responses.create({
        model: this.model,
        input,
        tools,
        temperature: opts.temperature ?? 0.4,
        max_output_tokens: opts.maxTokens ?? 2000,
      });

      // Extract cited URLs from the response annotations
      const citedUrls: string[] = [];
      if (Array.isArray(resp.output)) {
        for (const item of resp.output) {
          if (item?.type === 'web_search_call' && (item as any).action?.url) {
            citedUrls.push((item as any).action.url);
          }
          if (Array.isArray((item as any)?.content)) {
            for (const c of (item as any).content) {
              if (Array.isArray(c?.annotations)) {
                for (const a of c.annotations) {
                  if (a?.type === 'url_citation' && a?.url) citedUrls.push(a.url);
                }
              }
            }
          }
        }
      }

      const text = (resp.output_text || '').trim();
      return { text, citedUrls: [...new Set(citedUrls)], success: Boolean(text) };
    } catch (err: any) {
      console.error('[OpenAI web_search]', err?.message || err);
      return {
        text: '',
        citedUrls: [],
        success: false,
        error: err?.message || 'web search completion failed',
      };
    }
  }
}

// Singleton instance — initialized lazily from env so we don't crash at import time
let _provider: OpenAIProvider | null = null;

export function getOpenAIProvider(): OpenAIProvider {
  if (_provider) return _provider;
  _provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL,
  });
  return _provider;
}
