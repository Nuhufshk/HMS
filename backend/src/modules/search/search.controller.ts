import type { Request, Response } from 'express';
import { globalSearch } from './search.service';

export async function searchHandler(req: Request, res: Response) {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const result = await globalSearch(q);
  res.json(result);
}
