/**
 * NVIDIA AI Client — centralized OpenAI-compatible client for NVIDIA API.
 * All AI modules use this client instead of local heuristics.
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
}

/**
 * Send a chat completion request to NVIDIA API.
 * Returns the full response text as a string.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const openai = getClient();
  const { temperature = 0.7, maxTokens = 4096, topP = 1 } = options;

  try {
    const completion = await openai.chat.completions.create({
      model: NVIDIA_MODEL,
      messages,
      temperature,
      top_p: topP,
      max_tokens: maxTokens,
      stream: false,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[NVIDIA AI] Chat completion error:', error);
    throw error;
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
      { maxTokens: 10, temperature: 0 }
    );
    return text.toLowerCase().includes('ok');
  } catch {
    return false;
  }
}

export { parseJSONResponse };
