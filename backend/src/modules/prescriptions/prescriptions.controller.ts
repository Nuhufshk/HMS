import type { Request, Response } from 'express';
import {
  listPrescriptions,
  getPrescription,
  createPrescriptionRecord,
  updatePrescriptionStatus,
  dispensePrescription,
} from './prescriptions.service';
import { validateCreateInput } from './prescriptions.validation';

export async function listHandler(req: Request, res: Response) {
  const patientId = String(req.query.patientId ?? '') || undefined;
  const result = await listPrescriptions(patientId);
  res.json(result);
}

export async function getHandler(req: Request, res: Response) {
  const prescription = await getPrescription(req.params.id);
  if (!prescription) {
    res.status(404).json({ message: 'Prescription not found' });
    return;
  }
  res.json(prescription);
}

export async function createHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const { prescription, error } = await createPrescriptionRecord(body);

  if (error) {
    const status = error.includes('medication') ? 422 : 400;
    res.status(status).json({ message: error });
    return;
  }
  res.status(201).json(prescription);
}

export async function statusUpdateHandler(req: Request, res: Response) {
  const status = (req.body ?? {}).status;
  const { prescription, error } = await updatePrescriptionStatus(req.params.id, status);

  if (error) {
    const status_code = error.includes('not found') ? 404 : 400;
    res.status(status_code).json({ message: error });
    return;
  }
  res.json(prescription);
}

export async function dispenseHandler(req: Request, res: Response) {
  const { prescription, error } = await dispensePrescription(req.params.id);

  if (error) {
    const status = error.includes('not found') ? 404 : 422;
    res.status(status).json({ message: error });
    return;
  }
  res.json(prescription);
}
