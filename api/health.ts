import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.status(200).json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
