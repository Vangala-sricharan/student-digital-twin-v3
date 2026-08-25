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
export async function callGeminiWithRetry(params: GeminiCallParams, maxRetries = 3): Promise<any> {
  const ai = getGeminiClient();
  const fallbackModels = [
    params.model || 'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const currentModel = fallbackModels[(attempt - 1) % fallbackModels.length];
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: params.contents,
        config: params.config,
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

      console.warn(`[Gemini Serverless API] Attempt ${attempt}/${maxRetries} with ${currentModel} failed:`, err?.message || err);

      if (isTransient && attempt < maxRetries) {
        // Exponential backoff with jitter
        const delayMs = attempt * 1000 + Math.floor(Math.random() * 400);
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
      'Gemini is temporarily unavailable. Your data was collected successfully, but the AI evaluation could not be completed. Please try again.'
    );
    error.status = 503;
    error.code = 'GEMINI_UNAVAILABLE';
    error.isTransient = true;
    error.userMessage = 'Gemini is temporarily unavailable. Your data was collected successfully, but the AI evaluation could not be completed. Please try again.';
    throw error;
  }

  throw lastError;
}

// Utility: clean JSON from markdown fences if any
export function cleanAndParseJSON(rawText: string): any {
  if (!rawText) throw new Error('Empty response from AI engine');
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
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
