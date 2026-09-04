import type { Request, Response } from 'express';
import { listNurses, createNurseRecord, updateNurseRecord } from './nurses.service';
import { validateCreateInput } from './nurses.validation';

export async function listHandler(_req: Request, res: Response) {
  const result = await listNurses();
  res.json(result);
}

export async function createHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const { nurse, error } = await createNurseRecord(body);

  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(201).json(nurse);
}

export async function updateHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const nurse = await updateNurseRecord(req.params.id, body);

  if (!nurse) {
    res.status(404).json({ message: 'Nurse not found' });
    return;
  }
  res.json(nurse);
}
