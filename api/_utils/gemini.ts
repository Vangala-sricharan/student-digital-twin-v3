import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-serverless',
        },
      },
    });
  }
  return aiClient;
}

export interface GeminiCallParams {
  model?: string;
  contents: any;
  config?: any;
}

// Robust Gemini invoker with exponential backoff and model fallbacks for 503 UNAVAILABLE / High Demand / Quota
export async function callGeminiWithRetry(params: GeminiCallParams, maxRetries = 4): Promise<any> {
  const ai = getGeminiClient();
  const fallbackModels = [
    params.model || 'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.7-flash',
  ];
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const currentModel = fallbackModels[(attempt - 1) % fallbackModels.length];
    
    // Construct config specific to model capabilities
    const currentConfig: any = { ...params.config };
    if (currentModel === 'gemini-3.7-flash') {
      if (!currentConfig.thinkingConfig) {
        currentConfig.thinkingConfig = { thinkingBudget: 0 };
      }
    } else {
      delete currentConfig.thinkingConfig;
    }

    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: params.contents,
        config: currentConfig,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || String(err)).toLowerCase();
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('unavailable') ||
        errMsg.includes('high demand') ||
        errMsg.includes('resource has been exhausted') ||
        errMsg.includes('quota') ||
        errMsg.includes('429') ||
        errMsg.includes('overloaded') ||
        errMsg.includes('econnreset') ||
        errMsg.includes('etimedout') ||
        errMsg.includes('rate limit');

      if (attempt < maxRetries) {
        // If it's a 503 on the current model, immediately switch to the next fallback model without delay
        const delayMs = errMsg.includes('503') || errMsg.includes('high demand')
          ? 100
          : Math.min(attempt * 400 + Math.floor(Math.random() * 200), 1200);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      if (!isTransient) {
        break;
      }
    }
  }

  const errMsg = (lastError?.message || String(lastError)).toLowerCase();
  if (
    errMsg.includes('503') ||
    errMsg.includes('unavailable') ||
    errMsg.includes('high demand') ||
    errMsg.includes('overloaded') ||
    errMsg.includes('quota') ||
    errMsg.includes('resource has been exhausted') ||
    errMsg.includes('429')
  ) {
    const error: any = new Error(
      'Gemini is temporarily experiencing high demand. Please retry in a few moments.'
    );
    error.status = 503;
    error.code = 'GEMINI_UNAVAILABLE';
    error.isTransient = true;
    error.userMessage = 'Gemini is temporarily experiencing high demand. Please retry in a few moments.';
    throw error;
  }

  throw lastError;
}

// Streaming Gemini invoker with fallback support
export async function callGeminiStreamWithRetry(params: GeminiCallParams, maxRetries = 3): Promise<AsyncIterable<any>> {
  const ai = getGeminiClient();
  const fallbackModels = [
    params.model || 'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ];
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const currentModel = fallbackModels[(attempt - 1) % fallbackModels.length];
    const currentConfig: any = { ...params.config };
    if (currentModel === 'gemini-3.7-flash') {
      if (!currentConfig.thinkingConfig) {
        currentConfig.thinkingConfig = { thinkingBudget: 0 };
      }
    } else {
      delete currentConfig.thinkingConfig;
    }

    try {
      const stream = await ai.models.generateContentStream({
        model: currentModel,
        contents: params.contents,
        config: currentConfig,
      });
      return stream;
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || String(err)).toLowerCase();
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('unavailable') ||
        errMsg.includes('high demand') ||
        errMsg.includes('resource has been exhausted') ||
        errMsg.includes('quota') ||
        errMsg.includes('429') ||
        errMsg.includes('overloaded');

      if (attempt < maxRetries) {
        const delayMs = errMsg.includes('503') || errMsg.includes('high demand') ? 100 : 400;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      if (!isTransient) {
        break;
      }
    }
  }

  throw lastError;
}

// Utility: clean JSON from markdown fences if any
export function cleanAndParseJSON(rawText: string): any {
  if (!rawText) throw new Error('Empty response from AI engine');
  let cleaned = rawText.trim();

  // 1. Extract markdown fence if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  } else if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  }

  // 2. Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // 3. Fallback: Extract between first '{' and last '}' or '[' and ']'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const jsonCandidate = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonCandidate);
      } catch {}
    }

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        const jsonCandidate = cleaned.substring(firstBracket, lastBracket + 1);
        return JSON.parse(jsonCandidate);
      } catch {}
    }

    throw err;
  }
}

// Standardized error responder for Vercel Serverless Functions
export function handleApiError(res: VercelResponse, error: any, defaultMessage: string, extraData?: Record<string, any>) {
  console.error(`[API Error]:`, error);
  const isTransient =
    error.isTransient ||
    error.status === 503 ||
    error.message?.includes('503') ||
    error.message?.includes('unavailable') ||
    error.message?.includes('high demand');
  const statusCode = isTransient ? 503 : (error.status && error.status >= 400 && error.status < 600 ? error.status : 500);
  const userMessage = isTransient
    ? (error.userMessage || 'Gemini is temporarily unavailable. Your data was collected successfully, but the AI evaluation could not be completed. Please retry.')
    : (error.message || defaultMessage);

  return res.status(statusCode).json({
    error: userMessage,
    code: error.code || (isTransient ? 'GEMINI_UNAVAILABLE' : 'SERVER_ERROR'),
    isTransient: Boolean(isTransient),
    ...extraData,
  });
}
