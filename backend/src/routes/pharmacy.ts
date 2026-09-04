import { Router } from 'express';
import { eq, desc, and, like, sql } from 'drizzle-orm';
import { db, nextId, deriveMedicineStatus } from '../db';
import { medicines, prescriptions, patients, doctors } from '../db/schema';
import { todayISO } from '../utils/date';
import type { MedicineInput, PrescriptionInput, PrescriptionStatus } from '../types';

const router = Router();

/* -------------------------------- Medicines -------------------------------- */

/** GET /api/medicines */
router.get('/medicines', async (_req, res) => {
  const rows = await db.select().from(medicines).orderBy(medicines.name);
  // Attach daysToExpiry
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const enriched = rows.map((m) => {
    const target = new Date(`${m.expiryDate}T00:00:00`).getTime();
    const daysToExpiry = Math.round((target - now.getTime()) / 86_400_000);
    return { ...m, daysToExpiry };
  });
  res.json(enriched);
});

/** POST /api/medicines */
router.post('/medicines', async (req, res) => {
  const body = (req.body ?? {}) as MedicineInput;
  if (!body.name || !body.category || !body.expiryDate || !body.supplier) {
    res.status(400).json({ message: 'Name, category, expiry date and supplier are required.' });
    return;
  }

  const existing = await db.select({ id: medicines.id }).from(medicines);
  const id = nextId('MED-', existing);
  const quantity = Number(body.quantity) || 0;
  const reorderLevel = Number(body.reorderLevel) || 0;

  const values = {
    id,
    name: body.name,
    category: body.category,
    quantity,
    reorderLevel,
    unitPrice: Number(body.unitPrice) || 0,
    expiryDate: body.expiryDate,
    supplier: body.supplier,
    batch: body.batch?.trim() || `BT-${Math.floor(1000 + Math.random() * 9000)}`,
    status: deriveMedicineStatus({ quantity, reorderLevel, expiryDate: body.expiryDate }),
  };

  const inserted = await db.insert(medicines).values(values).returning();
  res.status(201).json(inserted[0]);
});

/** PATCH /api/medicines/:id */
router.patch('/medicines/:id', async (req, res) => {
  const { id: _id, ...patchFields } = (req.body ?? {}) as Partial<MedicineInput & { id: string }>;
  const updateData: Record<string, unknown> = {};
  const allowedKeys = ['name', 'category', 'quantity', 'reorderLevel', 'unitPrice', 'expiryDate', 'supplier', 'batch'];
  for (const key of allowedKeys) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  // Recalculate status
  const existing = await db.select().from(medicines).where(eq(medicines.id, req.params.id)).limit(1);
  if (!existing.length) {
    res.status(404).json({ message: 'Medicine not found' });
    return;
  }
  const merged = { ...existing[0], ...updateData };
  updateData.status = deriveMedicineStatus({ quantity: merged.quantity, reorderLevel: merged.reorderLevel, expiryDate: merged.expiryDate });

  const updated = await db.update(medicines)
    .set(updateData)
    .where(eq(medicines.id, req.params.id))
    .returning();

  const m = updated[0];
  const target = new Date(`${m.expiryDate}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  res.json({ ...m, daysToExpiry: Math.round((target - today.getTime()) / 86_400_000) });
});

/** PATCH /api/medicines/:id/stock { delta } — e.g. {-1} when dispensing */
router.patch('/medicines/:id/stock', async (req, res) => {
  const delta = Number((req.body ?? {}).delta);
  if (!Number.isFinite(delta)) {
    res.status(400).json({ message: 'A numeric delta is required.' });
    return;
  }

  const existing = await db.select().from(medicines).where(eq(medicines.id, req.params.id)).limit(1);
  if (!existing.length) {
    res.status(404).json({ message: 'Medicine not found' });
    return;
  }

  const newQty = Math.max(0, existing[0].quantity + delta);
  const updated = await db.update(medicines)
    .set({
      quantity: newQty,
      status: deriveMedicineStatus({ quantity: newQty, reorderLevel: existing[0].reorderLevel, expiryDate: existing[0].expiryDate }),
    })
    .where(eq(medicines.id, req.params.id))
    .returning();

  const m = updated[0];
  const target = new Date(`${m.expiryDate}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  res.json({ ...m, daysToExpiry: Math.round((target - today.getTime()) / 86_400_000) });
});

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
