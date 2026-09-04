import type { Request, Response } from 'express';
import { listPatients, getPatient, createPatientRecord, updatePatientRecord } from './patients.service';
import { validateCreateInput, validateRequiredFields } from './patients.validation';

export async function listHandler(req: Request, res: Response) {
  const result = await listPatients({
    q: String(req.query.q ?? ''),
    doctorId: String(req.query.doctorId ?? ''),
    limit: Number(req.query.limit),
  });
  res.json(result);
}

export async function getHandler(req: Request, res: Response) {
  const patient = await getPatient(req.params.id);
  if (!patient) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }
  res.json(patient);
}

export async function createHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const error = validateRequiredFields(body);
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const patient = await createPatientRecord(body);
  res.status(201).json(patient);
}

export async function updateHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const { patient, empty } = await updatePatientRecord(req.params.id, body);

  if (empty) {
    res.status(400).json({ message: 'No valid fields to update.' });
    return;
  }
  if (!patient) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }
  res.json(patient);
}
