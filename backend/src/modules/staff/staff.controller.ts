import type { Request, Response } from 'express';
import { listStaff, createStaffRecord, updateStaffRecord, updateStaffStatus } from './staff.service';
import { validateCreateInput } from './staff.validation';

export async function listHandler(_req: Request, res: Response) {
  const result = await listStaff();
  res.json(result);
}

export async function createHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const { staff, error } = await createStaffRecord(body);

  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(201).json(staff);
}

export async function updateHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const s = await updateStaffRecord(req.params.id, body);

  if (!s) {
    res.status(404).json({ message: 'Staff member not found' });
    return;
  }
  res.json(s);
}

export async function statusUpdateHandler(req: Request, res: Response) {
  const status = (req.body ?? {}).status;
  const { staff, error } = await updateStaffStatus(req.params.id, status);

  if (error) {
    const status_code = error.includes('not found') ? 404 : 400;
    res.status(status_code).json({ message: error });
    return;
  }
  res.json(staff);
}
