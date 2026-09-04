import { Router } from 'express';
import { db, nextId } from '../store';
import type { Patient } from '../types';

const router = Router();

/** GET /api/patients?q=&doctorId=&limit= */
router.get('/', (req, res) => {
  let list = [...db.patients].sort((a, b) => b.registrationDate.localeCompare(a.registrationDate));
  const q = String(req.query.q ?? '').trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')),
    );
  }
  const doctorId = String(req.query.doctorId ?? '');
  if (doctorId) list = list.filter((p) => p.assignedDoctorId === doctorId);
  const limit = Number(req.query.limit);
  if (Number.isFinite(limit) && limit > 0) list = list.slice(0, Math.floor(limit));
  res.json(list);
});

/** GET /api/patients/:id */
router.get('/:id', (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }
  res.json(patient);
});

/** POST /api/patients */
router.post('/', (req, res) => {
  const body = (req.body ?? {}) as Partial<Patient>;
  if (!body.firstName || !body.lastName || !body.dateOfBirth || !body.gender || !body.phone) {
    res.status(400).json({ message: 'First name, last name, date of birth, gender and phone are required.' });
    return;
  }
  const patient: Patient = {
    ...(body as Patient),
    id: nextId('PT-', db.patients),
    status: body.status ?? 'active',
    type: body.type ?? 'new',
    allergies: body.allergies ?? [],
    conditions: body.conditions ?? [],
    insurance: body.insurance ?? null,
    emergencyContact: body.emergencyContact ?? { name: '', relationship: '', phone: '' },
  };
  db.patients.unshift(patient);
  res.status(201).json(patient);
});

/** PATCH /api/patients/:id */
router.patch('/:id', (req, res) => {
  const idx = db.patients.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }
  db.patients[idx] = { ...db.patients[idx], ...(req.body ?? {}), id: req.params.id };
  res.json(db.patients[idx]);
});

export default router;
