import { Router } from 'express';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db, nextId } from '../db';
import { appointments, patients, doctors, departments } from '../db/schema';
import { dateFromToday, weekdayShort, monthShort, dateTimeFromToday } from '../utils/date';
import type { Appointment, AppointmentStatus } from '../types';

const VALID_STATUSES: AppointmentStatus[] = ['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled'];

const router = Router();

/** Enrich appointments with patient, doctor, and department names via JOINs. */
async function enrichAppts(rows: typeof appointments.$inferSelect[]) {
  return Promise.all(
    rows.map(async (a) => {
      const patientRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
        .from(patients).where(eq(patients.id, a.patientId)).limit(1);
      const doctorRows = await db.select({ name: doctors.name })
        .from(doctors).where(eq(doctors.id, a.doctorId)).limit(1);
      const deptRows = await db.select({ name: departments.name })
        .from(departments).where(eq(departments.id, a.departmentId)).limit(1);
      return {
        ...a,
        patientName: patientRows[0] ? `${patientRows[0].firstName} ${patientRows[0].lastName}` : 'Unknown patient',
        doctorName: doctorRows[0]?.name ?? 'Unassigned',
        departmentName: deptRows[0]?.name ?? '—',
      };
    }),
  );
}

/** GET /api/appointments?patientId=&doctorId= */
router.get('/', async (req, res) => {
  const patientId = String(req.query.patientId ?? '');
  const doctorId = String(req.query.doctorId ?? '');

  const conditions = [];
  if (patientId) conditions.push(eq(appointments.patientId, patientId));
  if (doctorId) conditions.push(eq(appointments.doctorId, doctorId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db.select().from(appointments)
    .where(whereClause)
    .orderBy(desc(sql`${appointments.date} || ${appointments.time}`));

  const enriched = await enrichAppts(rows);
  res.json(enriched);
});

/** GET /api/appointments/trend — last 7 days */
router.get('/trend', async (_req, res) => {
  const days: Array<{ day: string; label: string; scheduled: number; completed: number; cancelled: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const date = dateFromToday(-i);
    const rows = await db.select().from(appointments).where(eq(appointments.date, date));
    days.push({
      day: date,
      label: `${weekdayShort(date)} ${monthShort(date).replace('.', '')}`,
      scheduled: rows.filter((a) => a.status === 'scheduled' || a.status === 'waiting' || a.status === 'in_progress').length,
      completed: rows.filter((a) => a.status === 'completed').length,
      cancelled: rows.filter((a) => a.status === 'cancelled').length,
    });
  }
  res.json(days);
});

/** POST /api/appointments */
router.post('/', async (req, res) => {
  const body = (req.body ?? {}) as Partial<Appointment>;
  if (!body.patientId || !body.doctorId || !body.date || !body.time) {
    res.status(400).json({ message: 'Patient, doctor, date and time are required.' });
    return;
  }

  const existing = await db.select({ id: appointments.id }).from(appointments);
  const id = nextId('APT-', existing);

  const values = {
    id,
    patientId: body.patientId,
    doctorId: body.doctorId,
    departmentId: body.departmentId ?? '',
    date: body.date,
    time: body.time,
    reason: body.reason ?? '',
    type: (body.type as Appointment['type']) ?? 'Consultation',
    status: (body.status as AppointmentStatus) ?? 'scheduled',
    notes: body.notes ?? null,
  };

  const inserted = await db.insert(appointments).values(values).returning();
  res.status(201).json(inserted[0]);
});

/** PATCH /api/appointments/:id/status { status, notes? } */
router.patch('/:id/status', async (req, res) => {
  const { status, notes } = (req.body ?? {}) as { status?: string; notes?: string };
  if (!status || !VALID_STATUSES.includes(status as AppointmentStatus)) {
    res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    return;
  }

  const updateData: Record<string, unknown> = { status };
  if (notes !== undefined) updateData.notes = notes;

  const updated = await db.update(appointments)
    .set(updateData)
    .where(eq(appointments.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }
  res.json(updated[0]);
});

/** PATCH /api/appointments/:id */
router.patch('/:id', async (req, res) => {
  const { id: _id, ...patchFields } = (req.body ?? {}) as Partial<Appointment>;
  const updateData: Record<string, unknown> = {};
  const allowedKeys = ['patientId', 'doctorId', 'departmentId', 'date', 'time', 'reason', 'type', 'status', 'notes'];
  for (const key of allowedKeys) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  const updated = await db.update(appointments)
    .set(updateData)
    .where(eq(appointments.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }
  res.json(updated[0]);
});

export default router;
