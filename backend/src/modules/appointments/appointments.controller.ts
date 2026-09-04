import type { Request, Response } from 'express';
import {
  listAppointments,
  getAppointmentTrend,
  createAppointmentRecord,
  updateAppointmentStatus,
  updateAppointmentRecord,
} from './appointments.service';
import { validateCreateInput, validateRequiredFields, validateStatusInput } from './appointments.validation';

export async function listHandler(req: Request, res: Response) {
  const result = await listAppointments({
    patientId: String(req.query.patientId ?? ''),
    doctorId: String(req.query.doctorId ?? ''),
  });
  res.json(result);
}

export async function trendHandler(_req: Request, res: Response) {
  const result = await getAppointmentTrend();
  res.json(result);
}

export async function createHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const error = validateRequiredFields(body);
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const appointment = await createAppointmentRecord(body);
  res.status(201).json(appointment);
}

export async function statusUpdateHandler(req: Request, res: Response) {
  const input = validateStatusInput(req.body);
  const { appointment, error } = await updateAppointmentStatus(req.params.id, input);

  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  if (!appointment) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }
  res.json(appointment);
}

export async function updateHandler(req: Request, res: Response) {
  const body = validateCreateInput(req.body);
  const appointment = await updateAppointmentRecord(req.params.id, body);

  if (!appointment) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }
  res.json(appointment);
}
