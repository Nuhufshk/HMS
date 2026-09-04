import type { Request, Response } from 'express';
import { listMedicines, createMedicineRecord, updateMedicineRecord, adjustStock } from './medicines.service';
import { validateCreateInput } from './medicines.validation';

export async function listHandler(_req: Request, res: Response) {
  const result = await listMedicines();
  res.json(result);
}

export async function createHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const { medicine, error } = await createMedicineRecord(body);

  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(201).json(medicine);
}

export async function updateHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const { medicine, error } = await updateMedicineRecord(req.params.id, body);

  if (error) {
    const status = error === 'Medicine not found' ? 404 : 400;
    res.status(status).json({ message: error });
    return;
  }
  res.json(medicine);
}

export async function stockHandler(req: Request, res: Response) {
  const delta = Number((req.body ?? {}).delta);
  if (!Number.isFinite(delta)) {
    res.status(400).json({ message: 'A numeric delta is required.' });
    return;
  }

  const { medicine, error } = await adjustStock(req.params.id, delta);
  if (error) {
    res.status(404).json({ message: error });
    return;
  }
  res.json(medicine);
}
