import type { Request, Response } from 'express';
import {
  listBeds,
  getBed,
  createBedRecord,
  toggleMaintenance,
  updateBedRecord,
  deleteBedRecord,
  getBedHistory,
  assignPatientToBed,
  transferPatient,
  dischargePatient,
} from './beds.service';

export async function listHandler(req: Request, res: Response) {
  const result = await listBeds({
    status: String(req.query.status ?? ''),
    wardId: String(req.query.wardId ?? ''),
    type: String(req.query.type ?? ''),
  });
  res.json(result);
}

export async function getHandler(req: Request, res: Response) {
  const bed = await getBed(req.params.id);
  if (!bed) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  res.json(bed);
}

export async function createHandler(req: Request, res: Response) {
  const { bed, error } = await createBedRecord(req.body ?? {});
  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(201).json(bed);
}

export async function maintenanceHandler(req: Request, res: Response) {
  const maintenance = Boolean((req.body ?? {}).maintenance);
  const { bed, error } = await toggleMaintenance(req.params.id, maintenance);

  if (error) {
    const status = error.includes('not found') ? 404 : 409;
    res.status(status).json({ message: error });
    return;
  }
  res.json(bed);
}

export async function updateHandler(req: Request, res: Response) {
  const { bed, error } = await updateBedRecord(req.params.id, req.body ?? {});
  if (error) {
    res.status(404).json({ message: error });
    return;
  }
  res.json(bed);
}

export async function deleteHandler(req: Request, res: Response) {
  const { error } = await deleteBedRecord(req.params.id);
  if (error) {
    const status = error.includes('not found') ? 404 : 409;
    res.status(status).json({ message: error });
    return;
  }
  res.status(204).end();
}

export async function historyHandler(req: Request, res: Response) {
  const { assignments, error } = await getBedHistory(req.params.id);
  if (error) {
    res.status(404).json({ message: error });
    return;
  }
  res.json(assignments);
}

export async function assignHandler(req: Request, res: Response) {
  const { bed, error } = await assignPatientToBed(req.params.id, req.body ?? {});

  if (error) {
    const status = error.includes('not found') ? 404 : error.includes('already') ? 409 : 400;
    res.status(status).json({ message: error });
    return;
  }
  res.json(bed);
}

export async function transferHandler(req: Request, res: Response) {
  const { bed, error } = await transferPatient(req.params.id, req.body ?? {});

  if (error) {
    const status = error.includes('not found') ? 404 : error.includes('not available') || error.includes('already') ? 409 : 400;
    res.status(status).json({ message: error });
    return;
  }
  res.json(bed);
}

export async function dischargeHandler(req: Request, res: Response) {
  const { notes } = (req.body ?? {}) as { notes?: string };
  const { bed, error } = await dischargePatient(req.params.id, notes);

  if (error) {
    const status = error.includes('not found') ? 404 : 422;
    res.status(status).json({ message: error });
    return;
  }
  res.json(bed);
}
