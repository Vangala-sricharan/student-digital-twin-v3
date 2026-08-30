import type { VercelRequest, VercelResponse } from '@vercel/node';
import studentsHandler from './students.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return studentsHandler(req, res);
}
