import type { Request, Response } from 'express';
import { listDoctors, getDoctor, createDoctorRecord, updateDoctorRecord } from './doctors.service';
import { validateCreateInput } from './doctors.validation';

export async function listHandler(req: Request, res: Response) {
  const result = await listDoctors({
    availability: String(req.query.availability ?? ''),
    departmentId: String(req.query.departmentId ?? ''),
  });
  res.json(result);
}

export async function getHandler(req: Request, res: Response) {
  const doctor = await getDoctor(req.params.id);
  if (!doctor) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }
  res.json(doctor);
}

export async function createHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const { doctor, error } = await createDoctorRecord(body);

  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(201).json(doctor);
}

export async function updateHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const doctor = await updateDoctorRecord(req.params.id, body);

  if (!doctor) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }
  res.json(doctor);
}
