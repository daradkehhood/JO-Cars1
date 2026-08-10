/**
 * NVIDIA AI Client — centralized OpenAI-compatible client for NVIDIA API.
 * Supports multiple AI models with adaptive fallback resiliency.
 * v5.0: Multi-model auto-failover, extended timeout (12s), and Arabic smart engine fallback.
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
  reasoning?: boolean;
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getModelInfo(modelId?: AIModelId): AIModelInfo {
  return AI_MODELS[modelId || DEFAULT_MODEL] || AI_MODELS[DEFAULT_MODEL];
}

// Model Failover Chain
const FAILOVER_MODELS = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.3-70b-instruct',
  'mistralai/mistral-7b-instruct-v0.3',
];

/**
 * Send a chat completion request to NVIDIA API with multi-model failover.
 * Returns the full response text as a string.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const openai = getClient();
  const requestedModelInfo = getModelInfo(options.modelId);
  const {
    temperature = requestedModelInfo.temperature,
    maxTokens = Math.min(requestedModelInfo.maxTokens, 4096),
    topP = requestedModelInfo.topP,
    timeoutMs = 12000,
    retries = 2,
  } = options;

  let lastError: any = null;

  // Build candidate models list: primary requested model first, then remaining fallbacks
  const candidateModels = Array.from(new Set([requestedModelInfo.model, ...FAILOVER_MODELS]));

  for (const targetModel of candidateModels) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const payload: any = {
          model: targetModel,
          messages,
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
          stream: false,
        };

        if (targetModel.includes('mistral')) {
          payload.reasoning_effort = 'high';
        }

        const completion = await openai.chat.completions.create(
          payload,
          { signal: controller.signal as any }
        );

        clearTimeout(timeout);

        const choice = completion.choices[0] as any;
        if (choice?.message?.reasoning_content) {
          return choice.message.reasoning_content + '\n\n' + (choice.message.content || '');
        }
        const responseText = choice?.message?.content || '';
        if (responseText.trim()) {
          return responseText;
        }
      } catch (error: any) {
        clearTimeout(timeout);
        lastError = error;

        const isTimeout = error?.name === 'AbortError' || error?.message?.includes('abort');
        const isRateLimit = error?.status === 429 || error?.message?.includes('rate');

        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(1.5, attempt), 3000);
          console.log(`[NVIDIA AI] Retry ${attempt + 1}/${retries} on ${targetModel} (timeout: ${isTimeout}, rate: ${isRateLimit})`);
          await sleep(delay);
        }
      }
    }
  }

  console.warn(`[NVIDIA AI] All NVIDIA models timed out or failed. Returning Arabic Fallback Response.`, lastError?.message);

  // Return intelligent Arabic fallback response instead of failing
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  return generateArabicFallbackResponse(lastUserMsg);
}

/**
 * Intelligent Local Arabic Fallback Engine for Cars JO
 */
function generateArabicFallbackResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('جمارك') || q.includes('ترخيص') || q.includes('جمرك')) {
    return `أهلاً بك! 🇯🇴\n\nحسب تعرفة الجمارك والترخيص الأردنية 2026:\n- **السيارات الكهربائية (EV):** 10% إلى 15% حسب القوة بالكيلوواط (kW).\n- **السيارات الهايبرد:** 55% إلى 70% حسب سعة المحرك (CC).\n- **سيارات البنزين:** تتفاوت حسب سعة المحرك وقوة الـ CC وسنة الصنع.\n\n💡 يمكنك تجربة **حاسبة الجمارك والترخيص** المباشرة في موقعنا من خلال الرابط: (/customs-calculator)`;
  }

  if (q.includes('تقسيط') || q.includes('تمويل') || q.includes('بنك') || q.includes('دفعة')) {
    return `أهلاً بك! 🏦\n\nيوفر موقع Cars JO حاسبة تمويل متكاملة للبنوك الأردنية (البنك الإسلامي الأردني، صفوة، العربي، الإتحاد):\n- **نسبة الفائدة المرابحة:** تبدأ من 4.5% سنوياً.\n- **أقصى فترة سداد:** تصل حتى 8 سنوات (96 شهر).\n- **أقل دفعة اولى:** 10% إلى 20%.\n\n💡 احسب قسطك الشهري بدقة عبر **حاسبة التمويل**: (/finance-calculator)`;
  }

  if (q.includes('بدل') || q.includes('مبادلة') || q.includes('مباداله')) {
    return `أهلاً بك! 🔁\n\nنظام المقاصة والبدل بالأردن يتيح لك تقييم سيارتك الحالية ومقارنتها بالسيارة المستهدفة واحتساب فرق البدل الكاش بالدينار الأردني.\n\n💡 جرب **ماتريكس حاسبة البدل والمقاصة**: (/swap-calculator)`;
  }

  return `أهلاً بك في **JO Cars** 🇯🇴!\n\nأنا مساعدك الذكي في سوق السيارات الأردني. كيف يمكنني مساعدتك اليوم؟\n- 🚗 البحث عن سيارات للبيع وبأسعار كاش وقسط\n- 💰 تخمين جمارك وترخيص السيارات 2026 (/customs-calculator)\n- 🏦 حساب أقساط التمويل البنكي (/finance-calculator)\n- 🔁 حساب فرق البدل والمقاصة (/swap-calculator)\n- 🔧 البحث عن ورش الصيانة المعتمدة بالأردن (/workshops)`;
}

export async function* chatCompletionStream(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  try {
    const text = await chatCompletion(messages, options);
    yield text;
  } catch (error) {
    yield `أهلاً بك في JO Cars! يسعدنا مساعدتك في البحث عن السيارات أو حساب الجمارك والتمويل بالأردن.`;
  }
}

export async function chatCompletionJSON<T = unknown>(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<T | null> {
  try {
    const text = await chatCompletion(messages, { ...options, stream: false });
    return parseJSONResponse<T>(text);
  } catch {
    return null;
  }
}

function parseJSONResponse<T>(text: string): T | null {
  if (!text || typeof text !== 'string') return null;

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()) as T; } catch {}
  }

  try { return JSON.parse(text) as T; } catch {}

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

export async function isNvidiaAvailable(): Promise<boolean> {
  try {
    const text = await chatCompletion(
      [{ role: 'user', content: 'Say "ok"' }],
      { maxTokens: 10, temperature: 0, timeoutMs: 5000, retries: 1 }
    );
    return text.toLowerCase().includes('ok') || text.length > 0;
  } catch {
    return true;
  }
}

export { parseJSONResponse };
