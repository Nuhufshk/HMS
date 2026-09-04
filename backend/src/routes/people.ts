import { Router } from 'express';
import { db, nextId, withDoctorStats, withNurseDept } from '../store';
import { todayISO } from '../utils/date';
import type { Doctor, DoctorAvailability, DoctorStatus, Nurse, NurseStatus, Staff, StaffStatus } from '../types';

const router = Router();

/* -------------------------------- Doctors -------------------------------- */

/** GET /api/doctors?availability=&departmentId= */
router.get('/doctors', (req, res) => {
  let list = db.doctors.map(withDoctorStats);
  const availability = String(req.query.availability ?? '');
  if (availability) list = list.filter((d) => d.status === 'active' && d.availability === availability);
  const departmentId = String(req.query.departmentId ?? '');
  if (departmentId) list = list.filter((d) => d.departmentId === departmentId);
  res.json(list);
});

/** GET /api/doctors/:id */
router.get('/doctors/:id', (req, res) => {
  const doctor = db.doctors.find((d) => d.id === req.params.id);
  if (!doctor) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }
  res.json(withDoctorStats(doctor));
});

/** POST /api/doctors */
router.post('/doctors', (req, res) => {
  const body = (req.body ?? {}) as Partial<Doctor>;
  if (!body.name || !body.specialization || !body.departmentId || !body.phone) {
    res.status(400).json({ message: 'Name, specialisation, department and phone are required.' });
    return;
  }
  const doctor: Doctor = {
    ...(body as Doctor),
    id: nextId('DR-', db.doctors),
    status: (body.status as DoctorStatus) ?? 'active',
    availability: (body.availability as DoctorAvailability) ?? 'available',
    joinedDate: body.joinedDate ?? todayISO(),
    schedule: body.schedule ?? [
      { day: 'Monday', hours: '08:00 – 16:00' },
      { day: 'Tuesday', hours: '08:00 – 16:00' },
      { day: 'Wednesday', hours: '08:00 – 16:00' },
      { day: 'Thursday', hours: '08:00 – 16:00' },
      { day: 'Friday', hours: '08:00 – 16:00' },
    ],
    about: body.about ?? 'Newly added doctor.',
  };
  db.doctors.push(doctor);
  res.status(201).json(doctor);
});

/** PATCH /api/doctors/:id */
router.patch('/doctors/:id', (req, res) => {
  const idx = db.doctors.findIndex((d) => d.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }
  db.doctors[idx] = { ...db.doctors[idx], ...(req.body ?? {}), id: req.params.id };
  res.json(db.doctors[idx]);
});

/* --------------------------------- Nurses --------------------------------- */

/** GET /api/nurses */
router.get('/nurses', (_req, res) => {
  res.json(db.nurses.map(withNurseDept));
});

/** POST /api/nurses */
router.post('/nurses', (req, res) => {
  const body = (req.body ?? {}) as Partial<Nurse>;
  if (!body.name || !body.departmentId || !body.phone || !body.ward) {
    res.status(400).json({ message: 'Name, department, phone and ward are required.' });
    return;
  }
  const nurse: Nurse = {
    ...(body as Nurse),
    id: nextId('NS-', db.nurses),
    status: (body.status as NurseStatus) ?? 'active',
    shift: body.shift ?? 'Morning',
    joinedDate: body.joinedDate ?? todayISO(),
  };
  db.nurses.push(nurse);
  res.status(201).json(nurse);
});

/** PATCH /api/nurses/:id */
router.patch('/nurses/:id', (req, res) => {
  const idx = db.nurses.findIndex((n) => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Nurse not found' });
    return;
  }
  db.nurses[idx] = { ...db.nurses[idx], ...(req.body ?? {}), id: req.params.id };
  res.json(db.nurses[idx]);
});

/* ------------------------------- Departments ------------------------------ */

/** GET /api/departments */
router.get('/departments', (_req, res) => {
  res.json([...db.departments]);
});

/** GET /api/departments/:id */
router.get('/departments/:id', (req, res) => {
  const dept = db.departments.find((d) => d.id === req.params.id);
  res.json(dept ?? null);
});

/** GET /api/departments/:id/staff */
router.get('/departments/:id/staff', (req, res) => {
  res.json({
    doctors: db.doctors.filter((d) => d.departmentId === req.params.id).map((d) => d.name),
    nurses: db.nurses.filter((n) => n.departmentId === req.params.id).map((n) => n.name),
  });
});

/* ---------------------------------- Staff --------------------------------- */

/** GET /api/staff */
router.get('/staff', (_req, res) => {
  res.json([...db.staff].sort((a, b) => a.name.localeCompare(b.name)));
});

/** POST /api/staff */
router.post('/staff', (req, res) => {
  const body = (req.body ?? {}) as Partial<Staff>;
  if (!body.name || !body.role || !body.phone) {
    res.status(400).json({ message: 'Name, role and phone are required.' });
    return;
  }
  const staff: Staff = {
    ...(body as Staff),
    id: nextId('STF-', db.staff),
    status: (body.status as StaffStatus) ?? 'active',
    joinedDate: body.joinedDate ?? todayISO(),
  };
  db.staff.push(staff);
  res.status(201).json(staff);
});

/** PATCH /api/staff/:id */
router.patch('/staff/:id', (req, res) => {
  const idx = db.staff.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Staff member not found' });
    return;
  }
  db.staff[idx] = { ...db.staff[idx], ...(req.body ?? {}), id: req.params.id };
  res.json(db.staff[idx]);
});

/** PATCH /api/staff/:id/status { status } */
router.patch('/staff/:id/status', (req, res) => {
  const idx = db.staff.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Staff member not found' });
    return;
  }
  const status = (req.body ?? {}).status;
  if (status !== 'active' && status !== 'inactive') {
    res.status(400).json({ message: 'Status must be "active" or "inactive".' });
    return;
  }
  db.staff[idx] = { ...db.staff[idx], status, id: req.params.id };
  res.json(db.staff[idx]);
});

export default router;
