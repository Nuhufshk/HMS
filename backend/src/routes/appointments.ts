import { Router } from 'express';
import { appointmentTrend, db, enrichAppointments, nextId } from '../store';
import { dateTimeFromToday } from '../utils/date';
import type { Appointment, AppointmentStatus } from '../types';

const VALID_STATUSES: AppointmentStatus[] = ['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled'];

const router = Router();

/** GET /api/appointments?patientId=&doctorId= */
router.get('/', (req, res) => {
  let list = [...db.appointments];
  const patientId = String(req.query.patientId ?? '');
  if (patientId) list = list.filter((a) => a.patientId === patientId);
  const doctorId = String(req.query.doctorId ?? '');
  if (doctorId) list = list.filter((a) => a.doctorId === doctorId);
  res.json(enrichAppointments(list));
});

/** GET /api/appointments/trend — last 7 days */
router.get('/trend', (_req, res) => {
  res.json(appointmentTrend());
});

/** POST /api/appointments */
router.post('/', (req, res) => {
  const body = (req.body ?? {}) as Partial<Appointment>;
  if (!body.patientId || !body.doctorId || !body.date || !body.time) {
    res.status(400).json({ message: 'Patient, doctor, date and time are required.' });
    return;
  }
  const appointment: Appointment = {
    ...(body as Appointment),
    id: nextId('APT-', db.appointments),
    status: body.status ?? 'scheduled',
  };
  db.appointments.unshift(appointment);
  res.status(201).json(appointment);
});

/** PATCH /api/appointments/:id/status { status, notes? } */
router.patch('/:id/status', (req, res) => {
  const idx = db.appointments.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }
  const { status, notes } = (req.body ?? {}) as { status?: string; notes?: string };
  if (!status || !VALID_STATUSES.includes(status as AppointmentStatus)) {
    res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    return;
  }
  const now = dateTimeFromToday(0);
  db.appointments[idx] = {
    ...db.appointments[idx],
    status: status as AppointmentStatus,
    notes: notes ?? db.appointments[idx].notes,
    id: req.params.id,
  };
  res.json(db.appointments[idx]);
});

/** PATCH /api/appointments/:id */
router.patch('/:id', (req, res) => {
  const idx = db.appointments.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }
  db.appointments[idx] = { ...db.appointments[idx], ...(req.body ?? {}), id: req.params.id };
  res.json(db.appointments[idx]);
});

export default router;
