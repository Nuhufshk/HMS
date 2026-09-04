import type { Request, Response } from 'express';
import { listMedicalRecords, listPatientsWithRecords, createMedicalRecord } from './medical-records.service';

export async function listHandler(req: Request, res: Response) {
  const patientId = String(req.query.patientId ?? '') || undefined;
  const result = await listMedicalRecords(patientId);
  res.json(result);
}

export async function listPatientsHandler(_req: Request, res: Response) {
  const result = await listPatientsWithRecords();
  res.json(result);
}

export async function createHandler(req: Request, res: Response) {
  const { record, error } = await createMedicalRecord(req.body ?? {});

  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(201).json(record);
}
