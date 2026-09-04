import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db, nextId } from '../db';
import { labTests, patients, doctors } from '../db/schema';
import { dateTimeFromToday, todayISO } from '../utils/date';
import type { LabResultInput, LabStatus } from '../types';

const VALID_STATUSES: LabStatus[] = ['requested', 'collected', 'processing', 'completed'];

const router = Router();

/** Enrich lab tests with patient and doctor names. */
async function enrichLab(rows: typeof labTests.$inferSelect[]) {
  return Promise.all(
    rows.map(async (t) => {
      const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
        .from(patients).where(eq(patients.id, t.patientId)).limit(1);
      const docRows = await db.select({ name: doctors.name })
        .from(doctors).where(eq(doctors.id, t.doctorId)).limit(1);
      return {
        ...t,
        patientName: patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : 'Unknown patient',
        doctorName: docRows[0]?.name ?? 'Unknown doctor',
      };
    }),
  );
}

/** GET /api/lab-tests?patientId= */
router.get('/lab-tests', async (req, res) => {
  const patientId = String(req.query.patientId ?? '');
  const whereClause = patientId ? eq(labTests.patientId, patientId) : undefined;
  const rows = await db.select().from(labTests).where(whereClause).orderBy(desc(labTests.orderedDate));
  res.json(await enrichLab(rows));
});

/** GET /api/lab-tests/:id */
router.get('/lab-tests/:id', async (req, res) => {
  const rows = await db.select().from(labTests).where(eq(labTests.id, req.params.id)).limit(1);
  if (!rows.length) {
    res.status(404).json({ message: 'Lab test not found' });
    return;
  }
  res.json((await enrichLab(rows))[0]);
});

/** POST /api/lab-tests */
router.post('/lab-tests', async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (!body.patientId || !body.doctorId || !body.testName || !body.sampleType) {
    res.status(400).json({ message: 'Patient, doctor, test name and sample type are required.' });
    return;
  }

  const existing = await db.select({ id: labTests.id }).from(labTests);
  const id = nextId('LAB-', existing);

  const values = {
    id,
    patientId: body.patientId as string,
    doctorId: body.doctorId as string,
    testName: body.testName as string,
    sampleType: body.sampleType as string,
    orderedDate: (body.orderedDate as string) ?? todayISO(),
    priority: (body.priority as 'routine' | 'urgent' | 'stat') ?? 'routine',
    status: 'requested' as const,
    result: (body.result as string) ?? null,
    unit: (body.unit as string) ?? null,
    referenceRange: (body.referenceRange as string) ?? null,
    notes: (body.notes as string) ?? null,
    abnormal: (body.abnormal as boolean) ?? null,
    collectedAt: (body.collectedAt as string) ?? null,
    completedAt: (body.completedAt as string) ?? null,
  };

  const inserted = await db.insert(labTests).values(values).returning();
  res.status(201).json(inserted[0]);
});

/** PATCH /api/lab-tests/:id/status { status } */
router.patch('/lab-tests/:id/status', async (req, res) => {
  const status = (req.body ?? {}).status;
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    return;
  }

  const now = dateTimeFromToday(0);
  const updateData: Record<string, unknown> = { status };

  if (status === 'collected' || status === 'completed') {
    const existing = await db.select().from(labTests).where(eq(labTests.id, req.params.id)).limit(1);
    if (!existing.length) {
      res.status(404).json({ message: 'Lab test not found' });
      return;
    }
    if (status === 'collected' && !existing[0].collectedAt) {
      updateData.collectedAt = now;
    }
    if (status === 'completed' && !existing[0].completedAt) {
      updateData.completedAt = now;
    }
  }

  const updated = await db.update(labTests)
    .set(updateData)
    .where(eq(labTests.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Lab test not found' });
    return;
  }
  res.json(updated[0]);
});

/** PATCH /api/lab-tests/:id/result { result, unit?, referenceRange?, notes?, abnormal? } */
router.patch('/lab-tests/:id/result', async (req, res) => {
  const body = (req.body ?? {}) as LabResultInput;
  if (!body.result || typeof body.result !== 'string' || !body.result.trim()) {
    res.status(400).json({ message: 'A result value is required.' });
    return;
  }

  const existing = await db.select().from(labTests).where(eq(labTests.id, req.params.id)).limit(1);
  if (!existing.length) {
    res.status(404).json({ message: 'Lab test not found' });
    return;
  }

  const updated = await db.update(labTests)
    .set({
      result: body.result.trim(),
      unit: body.unit?.trim() || null,
      referenceRange: body.referenceRange?.trim() || null,
      notes: body.notes?.trim() || null,
      abnormal: body.abnormal ?? false,
      status: 'completed',
      completedAt: existing[0].completedAt ?? dateTimeFromToday(0),
    })
    .where(eq(labTests.id, req.params.id))
    .returning();

  res.json(updated[0]);
});

export default router;
