import type { Request, Response } from 'express';
import { listActivity } from './activity.service';

export async function listHandler(req: Request, res: Response) {
  const limit = Number(req.query.limit) || 10;
  const result = await listActivity(limit);
  res.json(result);
}
