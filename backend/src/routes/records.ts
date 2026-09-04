import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db, nextId } from '../db';
import { medicalRecords, patients, doctors } from '../db/schema';
import { dateTimeFromToday } from '../utils/date';
import type { MedicalRecordInput } from '../types';

const router = Router();

/** Enrich medical records with doctor name. */
async function enrichRecords(rows: typeof medicalRecords.$inferSelect[]) {
  return Promise.all(
    rows.map(async (r) => {
      const docRows = await db.select({ name: doctors.name })
        .from(doctors).where(eq(doctors.id, r.doctorId)).limit(1);
      return { ...r, doctorName: docRows[0]?.name ?? 'Unknown doctor' };
    }),
  );
}

/** GET /api/medical-records?patientId= */
router.get('/medical-records', async (req, res) => {
  const patientId = String(req.query.patientId ?? '');
  const whereClause = patientId ? eq(medicalRecords.patientId, patientId) : undefined;
  const rows = await db.select().from(medicalRecords).where(whereClause).orderBy(desc(medicalRecords.date));
  res.json(await enrichRecords(rows));
});

/** GET /api/medical-records/patients — patients that have records */
router.get('/medical-records/patients', async (_req, res) => {
  const rows = await db.selectDistinct({ patientId: medicalRecords.patientId }).from(medicalRecords);
  const result = await Promise.all(
    rows.map(async (r) => {
      const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
        .from(patients).where(eq(patients.id, r.patientId)).limit(1);
      return {
        patientId: r.patientId,
        patientName: patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : r.patientId,
      };
    }),
  );
  res.json(result.sort((a, b) => a.patientName.localeCompare(b.patientName)));
});

/** POST /api/medical-records */
router.post('/medical-records', async (req, res) => {
  const body = (req.body ?? {}) as MedicalRecordInput;
  if (!body.patientId || !body.doctorId || !body.title || !body.description) {
    res.status(400).json({ message: 'Patient, doctor, title and description are required.' });
    return;
  }

  const existing = await db.select({ id: medicalRecords.id }).from(medicalRecords);
  const id = nextId('REC-', existing);

  const values = {
    id,
    patientId: body.patientId,
    doctorId: body.doctorId,
    date: body.date ?? dateTimeFromToday(0),
    type: (body.type as MedicalRecordInput['type']) ?? 'note',
    title: body.title,
    description: body.description,
    diagnosis: body.diagnosis ?? null,
    symptoms: body.symptoms ?? null,
    treatmentPlan: body.treatmentPlan ?? null,
    vitals: body.vitals ?? null,
    notes: body.notes ?? null,
  };

  const inserted = await db.insert(medicalRecords).values(values).returning();
  res.status(201).json(inserted[0]);
});

export default router;
