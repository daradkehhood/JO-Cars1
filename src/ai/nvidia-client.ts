/**
 * NVIDIA AI Client — centralized OpenAI-compatible client for NVIDIA API.
 * All AI modules use this client instead of local heuristics.
 * v2.0: Added retry logic, adaptive timeout, and connection pooling hints.
 */

import OpenAI from 'openai';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'z-ai/glm-5.2';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: NVIDIA_API_KEY,
      baseURL: NVIDIA_BASE_URL,
      timeout: 30000, // 30s default timeout
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
}

/**
 * Sleep helper for retry delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  const {
    temperature = 0.7,
    maxTokens = 4096,
    topP = 1,
    timeoutMs = 20000,
    retries = 2,
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const completion = await openai.chat.completions.create(
        {
          model: NVIDIA_MODEL,
          messages,
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
          stream: false,
        },
        { signal: controller.signal as any }
      );

      clearTimeout(timeout);
      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      clearTimeout(timeout);
      lastError = error;

      const isTimeout = error?.name === 'AbortError' || error?.message?.includes('abort');
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate');
      const isServerError = error?.status >= 500;

      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`[NVIDIA AI] Retry ${attempt + 1}/${retries} after ${delay}ms (timeout: ${isTimeout}, rate: ${isRateLimit}, server: ${isServerError})`);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  if (lastError?.name === 'AbortError' || lastError?.message?.includes('abort')) {
    console.error(`[NVIDIA AI] Request timed out after ${retries + 1} attempts`);
  } else {
    console.error(`[NVIDIA AI] Chat completion failed after ${retries + 1} attempts:`, lastError);
  }
  throw lastError;
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
