/**
 * NVIDIA AI Client — centralized OpenAI-compatible client for NVIDIA API.
 * Supports multiple AI models: GLM, MiniMax M3, Mistral Medium, GPT OSS.
 * v4.0: Multi-model support with model selector.
 */

import OpenAI from 'openai';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// ── Model Registry ──
export type AIModelId = 'glm' | 'minimax' | 'mistral' | 'gpt-oss';

export interface AIModelInfo {
  id: AIModelId;
  model: string;
  nameAr: string;
  nameEn: string;
  description: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  reasoning?: boolean; // Models that support reasoning_content
}

export const AI_MODELS: Record<AIModelId, AIModelInfo> = {
  glm: {
    id: 'glm',
    model: 'meta/llama-3.1-70b-instruct',
    nameAr: 'Llama 3.1 70B',
    nameEn: 'Llama 3.1 70B',
    description: 'نموذج ذكي وسريع جداً للمحادثات والاستشارات العامة',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
  },
  minimax: {
    id: 'minimax',
    model: 'meta/llama-3.3-70b-instruct',
    nameAr: 'Llama 3.3 70B',
    nameEn: 'Llama 3.3 70B',
    description: 'نموذج فائق القوة للتحليل المعمّق ومقارنة الأسعار',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
  },
  mistral: {
    id: 'mistral',
    model: 'mistralai/mistral-7b-instruct-v0.3',
    nameAr: 'Mistral 7B',
    nameEn: 'Mistral 7B',
    description: 'نموذج سريع ومختصر للإجابات السريعة',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
  },
  'gpt-oss': {
    id: 'gpt-oss',
    model: 'meta/llama-3.1-70b-instruct',
    nameAr: 'Llama 3.1 70B',
    nameEn: 'Llama 3.1 70B',
    description: 'النموذج الرئيسي لاستشارات السيارات والأسعار والتوصيات',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
  },
};

export const DEFAULT_MODEL: AIModelId = 'glm';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: NVIDIA_API_KEY,
      baseURL: NVIDIA_BASE_URL,
      timeout: 30000,
    });
  }
  return client;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  timeoutMs?: number;
  retries?: number;
  modelId?: AIModelId;
}

/**
 * Sleep helper for retry delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get model info by ID, defaults to GLM.
 */
function getModelInfo(modelId?: AIModelId): AIModelInfo {
  return AI_MODELS[modelId || DEFAULT_MODEL] || AI_MODELS[DEFAULT_MODEL];
}

/**
 * Send a chat completion request to NVIDIA API.
 * Returns the full response text as a string.
 * Includes adaptive timeout and retry logic (exponential backoff).
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const openai = getClient();
  const modelInfo = getModelInfo(options.modelId);
  const {
    temperature = modelInfo.temperature,
    maxTokens = Math.min(modelInfo.maxTokens, 4096),
    topP = modelInfo.topP,
    timeoutMs = 5000,
    retries = 1,
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const payload: any = {
        model: modelInfo.model,
        messages,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        stream: false,
      };

      // Mistral supports reasoning_effort
      if (modelInfo.id === 'mistral') {
        payload.reasoning_effort = 'high';
      }

      const completion = await openai.chat.completions.create(
        payload,
        { signal: controller.signal as any }
      );

      clearTimeout(timeout);

      // Handle reasoning_content for models that support it
      const choice = completion.choices[0] as any;
      if (choice?.message?.reasoning_content) {
        return choice.message.reasoning_content + '\n\n' + (choice.message.content || '');
      }
      return choice?.message?.content || '';
    } catch (error: any) {
      clearTimeout(timeout);
      lastError = error;

      const isTimeout = error?.name === 'AbortError' || error?.message?.includes('abort');
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate');
      const isServerError = error?.status >= 500;

      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`[NVIDIA AI] Retry ${attempt + 1}/${retries} after ${delay}ms (model: ${modelInfo.model}, timeout: ${isTimeout}, rate: ${isRateLimit}, server: ${isServerError})`);
        await sleep(delay);
      }
    }
  }

  if (lastError?.name === 'AbortError' || lastError?.message?.includes('abort')) {
    console.error(`[NVIDIA AI] Request timed out after ${retries + 1} attempts (model: ${getModelInfo(options.modelId).model})`);
  } else {
    console.error(`[NVIDIA AI] Chat completion failed after ${retries + 1} attempts:`, lastError);
  }
  throw lastError;
}

/**
 * Send a streaming chat completion request to NVIDIA API.
 * Returns an async iterator that yields text chunks as they arrive.
 * Used for SSE (Server-Sent Events) streaming to the frontend.
 */
export async function* chatCompletionStream(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const openai = getClient();
  const modelInfo = getModelInfo(options.modelId);
  const {
    temperature = modelInfo.temperature,
    maxTokens = Math.min(modelInfo.maxTokens, 4096),
    topP = modelInfo.topP,
    timeoutMs = 30000,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: any = {
      model: modelInfo.model,
      messages,
      temperature,
      top_p: topP,
      max_tokens: maxTokens,
      stream: true,
    };

    // Mistral supports reasoning_effort
    if (modelInfo.id === 'mistral') {
      payload.reasoning_effort = 'high';
    }

    const stream = await openai.chat.completions.create(
      payload,
      { signal: controller.signal as any }
    );

    for await (const chunk of stream as any) {
      const delta = chunk.choices[0]?.delta as any;
      // Handle reasoning_content chunks
      if (delta?.reasoning_content) {
        yield delta.reasoning_content;
      }
      if (delta?.content) {
        yield delta.content;
      }
    }
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('abort')) {
      console.error(`[NVIDIA AI] Stream timed out after ${timeoutMs}ms (model: ${modelInfo.model})`);
    } else {
      console.error(`[NVIDIA AI] Stream error (model: ${modelInfo.model}):`, error);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Send a chat completion request and parse the response as JSON.
 * Falls back to extracting JSON from the response text if needed.
 */
export async function chatCompletionJSON<T = unknown>(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<T | null> {
  const text = await chatCompletion(messages, { ...options, stream: false });
  return parseJSONResponse<T>(text);
}

/**
 * Robust JSON parser — handles markdown fences, surrounding text, etc.
 */
function parseJSONResponse<T>(text: string): T | null {
  if (!text || typeof text !== 'string') return null;

  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()) as T; } catch {}
  }

  // Try direct parse
  try { return JSON.parse(text) as T; } catch {}

  // Extract first balanced { ... } block
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
        try { return JSON.parse(text.slice(start, i + 1)) as T; } catch { return null; }
      }
    }
  }
  return null;
}

/**
 * Check if NVIDIA API is configured and reachable.
 */
export async function isNvidiaAvailable(): Promise<boolean> {
  try {
    const text = await chatCompletion(
      [{ role: 'user', content: 'Say "ok"' }],
      { maxTokens: 10, temperature: 0, timeoutMs: 10000, retries: 1 }
    );
    return text.toLowerCase().includes('ok');
  } catch {
    return false;
  }
}

export { parseJSONResponse };
