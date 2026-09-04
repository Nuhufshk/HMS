import type { Request, Response } from 'express';
import { listWardsWithStats, createWardWithBeds } from './wards.service';

export async function listHandler(_req: Request, res: Response) {
  const result = await listWardsWithStats();
  res.json(result);
}

export async function createHandler(req: Request, res: Response) {
  const { ward, error } = await createWardWithBeds(req.body ?? {});

  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(201).json(ward);
}
