import { Router } from 'express';
import { eq, desc, like, sql } from 'drizzle-orm';
import { db, nextId, deriveMedicineStatus } from '../db';
import { medicines, prescriptions, patients, doctors } from '../db/schema';
import { todayISO } from '../utils/date';
import type { PrescriptionInput, PrescriptionStatus } from '../types';

const router = Router();

/* ------------------------------- Prescriptions ------------------------------ */

/** Enrich a prescription with patient and doctor names. */
async function enrichRx(rows: typeof prescriptions.$inferSelect[]) {
  return Promise.all(
    rows.map(async (p) => {
      const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
        .from(patients).where(eq(patients.id, p.patientId)).limit(1);
      const docRows = await db.select({ name: doctors.name })
        .from(doctors).where(eq(doctors.id, p.doctorId)).limit(1);
      return {
        ...p,
        patientName: patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : 'Unknown patient',
        doctorName: docRows[0]?.name ?? 'Unknown doctor',
      };
    }),
  );
}

/** GET /api/prescriptions?patientId= */
router.get('/prescriptions', async (req, res) => {
  const patientId = String(req.query.patientId ?? '');
  const whereClause = patientId ? eq(prescriptions.patientId, patientId) : undefined;
  const rows = await db.select().from(prescriptions).where(whereClause).orderBy(desc(prescriptions.date));
  res.json(await enrichRx(rows));
});

/** GET /api/prescriptions/:id */
router.get('/prescriptions/:id', async (req, res) => {
  const rows = await db.select().from(prescriptions).where(eq(prescriptions.id, req.params.id)).limit(1);
  if (!rows.length) {
    res.status(404).json({ message: 'Prescription not found' });
    return;
  }
  res.json((await enrichRx(rows))[0]);
});

/** POST /api/prescriptions */
router.post('/prescriptions', async (req, res) => {
  const body = (req.body ?? {}) as PrescriptionInput;
  if (!body.patientId || !body.doctorId || !body.diagnosis) {
    res.status(400).json({ message: 'Patient, doctor and diagnosis are required.' });
    return;
  }
  if (!body.medications || body.medications.length === 0) {
    res.status(422).json({ message: 'A prescription must contain at least one medication' });
    return;
  }

  const existing = await db.select({ id: prescriptions.id }).from(prescriptions);
  const id = nextId('RX-', existing);

  const values = {
    id,
    patientId: body.patientId,
    doctorId: body.doctorId,
    date: body.date ?? todayISO(),
    diagnosis: body.diagnosis,
    medications: body.medications,
    status: (body.status as PrescriptionStatus) ?? 'active',
    notes: body.notes ?? null,
  };

  const inserted = await db.insert(prescriptions).values(values).returning();
  res.status(201).json(inserted[0]);
});

/** PATCH /api/prescriptions/:id/status { status } */
router.patch('/prescriptions/:id/status', async (req, res) => {
  const status = (req.body ?? {}).status;
  if (!['active', 'dispensed', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ message: 'Status must be active, dispensed, completed or cancelled.' });
    return;
  }

  const updated = await db.update(prescriptions)
    .set({ status })
    .where(eq(prescriptions.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Prescription not found' });
    return;
  }
  res.json(updated[0]);
});

/** POST /api/prescriptions/:id/dispense — also decrements medicine stock. */
router.post('/prescriptions/:id/dispense', async (req, res) => {
  const rxRows = await db.select().from(prescriptions).where(eq(prescriptions.id, req.params.id)).limit(1);
  if (!rxRows.length) {
    res.status(404).json({ message: 'Prescription not found' });
    return;
  }
  const rx = rxRows[0];
  if (rx.status === 'dispensed') {
    res.status(422).json({ message: 'Prescription already dispensed' });
    return;
  }

  // Decrement stock for each medication line (best-effort name match)
  for (const med of rx.medications) {
    const matchRows = await db.select().from(medicines)
      .where(like(sql`lower(${medicines.name})`, `${med.name.toLowerCase().slice(0, 12)}%`))
      .limit(1);
    if (matchRows.length) {
      const match = matchRows[0];
      const newQty = Math.max(0, match.quantity - 1);
      await db.update(medicines)
        .set({
          quantity: newQty,
          status: deriveMedicineStatus({ quantity: newQty, reorderLevel: match.reorderLevel, expiryDate: match.expiryDate }),
        })
        .where(eq(medicines.id, match.id));
    }
  }

  const updated = await db.update(prescriptions)
    .set({ status: 'dispensed' })
    .where(eq(prescriptions.id, req.params.id))
    .returning();

  res.json(updated[0]);
});

export default router;
