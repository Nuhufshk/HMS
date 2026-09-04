import { Router } from 'express';
import { eq, desc, like, or, sql, and } from 'drizzle-orm';
import { db, nextId } from '../db';
import { patients } from '../db/schema';
import type { Patient } from '../types';

const router = Router();

/** GET /api/patients?q=&doctorId=&limit= */
router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const doctorId = String(req.query.doctorId ?? '');
  const limit = Number(req.query.limit);

  // Build conditions array
  const conditions = [];
  if (q) {
    conditions.push(
      or(
        like(sql`lower(${patients.id})`, `%${q}%`),
        like(sql`lower(${patients.firstName} || ' ' || ${patients.lastName})`, `%${q}%`),
        like(sql`replace(${patients.phone}, ' ', '')`, `%${q.replace(/\s/g, '')}%`),
      )!
    );
  }
  if (doctorId) {
    conditions.push(eq(patients.assignedDoctorId, doctorId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const query = db.select().from(patients).where(whereClause).orderBy(desc(patients.registrationDate));

  const result = Number.isFinite(limit) && limit > 0
    ? await query.limit(Math.floor(limit))
    : await query;

  res.json(result);
});

/** GET /api/patients/:id */
router.get('/:id', async (req, res) => {
  const rows = await db.select().from(patients).where(eq(patients.id, req.params.id)).limit(1);
  if (!rows.length) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }
  res.json(rows[0]);
});

/** POST /api/patients */
router.post('/', async (req, res) => {
  const body = (req.body ?? {}) as Partial<Patient>;
  if (!body.firstName || !body.lastName || !body.dateOfBirth || !body.gender || !body.phone) {
    res.status(400).json({ message: 'First name, last name, date of birth, gender and phone are required.' });
    return;
  }

  // Fetch existing patients to compute next ID
  const existing = await db.select({ id: patients.id }).from(patients);
  const id = nextId('PT-', existing);

  const values = {
    id,
    firstName: body.firstName,
    lastName: body.lastName,
    dateOfBirth: body.dateOfBirth,
    gender: body.gender as 'Male' | 'Female',
    phone: body.phone,
    email: body.email ?? '',
    address: body.address ?? '',
    city: body.city ?? '',
    nationality: body.nationality ?? '',
    bloodGroup: body.bloodGroup ?? 'O+',
    genotype: body.genotype ?? 'AA',
    allergies: body.allergies ?? [],
    conditions: body.conditions ?? [],
    emergencyContact: body.emergencyContact ?? { name: '', relationship: '', phone: '' },
    insurance: body.insurance ?? null,
    registrationDate: body.registrationDate ?? new Date().toISOString().slice(0, 10),
    assignedDoctorId: body.assignedDoctorId ?? null,
    status: (body.status as 'active' | 'inactive' | 'admitted' | 'discharged') ?? 'active',
    type: (body.type as 'new' | 'returning') ?? 'new',
  };

  const inserted = await db.insert(patients).values(values).returning();
  res.status(201).json(inserted[0]);
});

/** PATCH /api/patients/:id */
router.patch('/:id', async (req, res) => {
  const { id: _id, ...patchFields } = (req.body ?? {}) as Partial<Patient>;

  // Only update fields that were actually sent
  const updateData: Record<string, unknown> = {};
  const allowedKeys = [
    'firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'email',
    'address', 'city', 'nationality', 'bloodGroup', 'genotype', 'allergies',
    'conditions', 'emergencyContact', 'insurance', 'registrationDate',
    'assignedDoctorId', 'status', 'type',
  ];
  for (const key of allowedKeys) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ message: 'No valid fields to update.' });
    return;
  }

  const updated = await db.update(patients)
    .set(updateData)
    .where(eq(patients.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }
  res.json(updated[0]);
});

export default router;
