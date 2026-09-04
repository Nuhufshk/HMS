import { Router } from 'express';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, nextId } from '../db';
import { beds, wards, bedAssignments, patients } from '../db/schema';
import { dateTimeFromToday } from '../utils/date';
import type { BedInput, BedStatus, BedType, WardInput } from '../types';

const router = Router();

const VALID_STATUSES: BedStatus[] = ['available', 'occupied', 'maintenance'];
const VALID_TYPES: BedType[] = ['General', 'Private', 'ICU', 'Maternity', 'Surgical', 'Paediatric', 'Emergency'];

/** Enrich a bed with ward name and current patient info. */
async function enrichBedsList(rows: typeof beds.$inferSelect[]) {
  return Promise.all(
    rows.map(async (bed) => {
      const wardRows = await db.select({ name: wards.name }).from(wards).where(eq(wards.id, bed.wardId)).limit(1);
      const activeRows = await db.select().from(bedAssignments)
        .where(and(eq(bedAssignments.bedId, bed.id), eq(bedAssignments.releasedAt, sql`null`)))
        .limit(1);
      let patientName: string | null = null;
      let assignedPatientId: string | null = null;
      let occupiedSince: string | null = null;
      if (activeRows.length) {
        assignedPatientId = activeRows[0].patientId;
        occupiedSince = activeRows[0].assignedAt;
        const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
          .from(patients).where(eq(patients.id, assignedPatientId)).limit(1);
        patientName = patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : null;
      }
      return {
        ...bed,
        wardName: wardRows[0]?.name ?? '—',
        patientId: assignedPatientId,
        patientName,
        occupiedSince,
      };
    }),
  );
}

/** Enrich bed assignments with bed number, ward name, and patient name. */
async function enrichAssignments(rows: typeof bedAssignments.$inferSelect[]) {
  return Promise.all(
    rows.map(async (a) => {
      const bedRows = await db.select({ number: beds.number, wardId: beds.wardId }).from(beds).where(eq(beds.id, a.bedId)).limit(1);
      let wardName = '—';
      if (bedRows[0]) {
        const wRows = await db.select({ name: wards.name }).from(wards).where(eq(wards.id, bedRows[0].wardId)).limit(1);
        wardName = wRows[0]?.name ?? '—';
      }
      const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
        .from(patients).where(eq(patients.id, a.patientId)).limit(1);
      return {
        ...a,
        bedNumber: bedRows[0]?.number ?? '—',
        wardName,
        patientName: patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : 'Unknown patient',
      };
    }),
  );
}

/** Compute ward stats (total beds, occupied, occupancy rate). */
async function wardStatsList() {
  const allWards = await db.select().from(wards);
  return Promise.all(
    allWards.map(async (ward) => {
      const wardBeds = await db.select().from(beds).where(eq(beds.wardId, ward.id));
      const occupied = wardBeds.filter((b) => b.status === 'occupied').length;
      return {
        ...ward,
        totalBeds: wardBeds.length,
        occupied,
        occupancyRate: wardBeds.length ? Math.round((occupied / wardBeds.length) * 100) : 0,
      };
    }),
  );
}

/** GET /api/beds?status=&wardId=&type= */
router.get('/', async (req, res) => {
  const status = String(req.query.status ?? '');
  const wardId = String(req.query.wardId ?? '');
  const type = String(req.query.type ?? '');

  const conditions = [];
  if (status && VALID_STATUSES.includes(status as BedStatus)) conditions.push(eq(beds.status, status as BedStatus));
  if (wardId) conditions.push(eq(beds.wardId, wardId));
  if (type) conditions.push(eq(beds.type, type as BedType));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select().from(beds).where(whereClause);
  res.json(await enrichBedsList(rows));
});

/** GET /api/beds/wards — per-ward stats for the ward map. */
router.get('/wards', async (_req, res) => {
  res.json(await wardStatsList());
});

/** POST /api/beds/wards — create a ward together with its beds. */
router.post('/wards', async (req, res) => {
  const body = (req.body ?? {}) as WardInput;
  if (!body.name || !body.departmentId) {
    res.status(400).json({ message: 'Ward name and department are required.' });
    return;
  }

  const existingWards = await db.select({ id: wards.id }).from(wards);
  const wardId = nextId('W-', existingWards);
  const count = Math.max(1, Math.floor(Number(body.totalBeds) || 1));

  const wardRow = await db.insert(wards).values({
    id: wardId,
    name: body.name.trim(),
    location: body.location?.trim() || 'Not specified',
    departmentId: body.departmentId,
  }).returning();

  // Create beds for the new ward
  const existingBeds = await db.select({ id: beds.id }).from(beds);
  const start = existingBeds.length + 1;
  const prefix = body.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 2) || 'BD';

  for (let i = 0; i < count; i++) {
    await db.insert(beds).values({
      id: nextId('BD-', [...existingBeds, { id: `BD-${start + i}` }]),
      number: `${prefix}-${String(start + i).padStart(2, '0')}`,
      wardId,
      type: 'General',
      status: 'available',
      ratePerDay: 200,
    });
  }

  const stats = (await wardStatsList()).find((w) => w.id === wardId);
  res.status(201).json(stats);
});

/** POST /api/beds — create a single bed */
router.post('/', async (req, res) => {
  const body = (req.body ?? {}) as BedInput;
  if (!body.number || !body.wardId) {
    res.status(400).json({ message: 'Bed number and ward are required.' });
    return;
  }

  const existing = await db.select({ id: beds.id }).from(beds);
  const id = nextId('BD-', existing);

  const values = {
    id,
    number: body.number.trim(),
    wardId: body.wardId,
    type: (body.type as BedType) ?? 'General',
    status: (body.status as BedStatus) ?? 'available',
    ratePerDay: Number(body.ratePerDay) || 0,
  };

  const inserted = await db.insert(beds).values(values).returning();
  res.status(201).json((await enrichBedsList([inserted[0]]))[0]);
});

/** PATCH /api/beds/:id/maintenance { maintenance: boolean } */
router.patch('/:id/maintenance', async (req, res) => {
  const maintenance = Boolean((req.body ?? {}).maintenance);
  const existing = await db.select().from(beds).where(eq(beds.id, req.params.id)).limit(1);
  if (!existing.length) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  if (maintenance && existing[0].status === 'occupied') {
    res.status(409).json({ message: 'An occupied bed cannot be taken out of service. Discharge the patient first.' });
    return;
  }

  const updated = await db.update(beds)
    .set({ status: maintenance ? 'maintenance' : 'available' })
    .where(eq(beds.id, req.params.id))
    .returning();

  res.json((await enrichBedsList([updated[0]]))[0]);
});

/** PATCH /api/beds/:id — generic update */
router.patch('/:id', async (req, res) => {
  const patch = (req.body ?? {}) as Partial<BedInput>;
  const existing = await db.select().from(beds).where(eq(beds.id, req.params.id)).limit(1);
  if (!existing.length) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if ('number' in patch) updateData.number = patch.number;
  if ('wardId' in patch) updateData.wardId = patch.wardId;
  if ('type' in patch) updateData.type = patch.type;
  if ('ratePerDay' in patch) updateData.ratePerDay = Number(patch.ratePerDay) || 0;
  // Don't allow changing status away from occupied via generic update
  if ('status' in patch && patch.status !== 'occupied' && existing[0].status === 'occupied') {
    updateData.status = 'occupied'; // keep occupied
  } else if ('status' in patch) {
    updateData.status = patch.status;
  }

  const updated = await db.update(beds)
    .set(updateData)
    .where(eq(beds.id, req.params.id))
    .returning();

  res.json((await enrichBedsList([updated[0]]))[0]);
});

/** DELETE /api/beds/:id */
router.delete('/:id', async (req, res) => {
  const existing = await db.select().from(beds).where(eq(beds.id, req.params.id)).limit(1);
  if (!existing.length) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  if (existing[0].status === 'occupied') {
    res.status(409).json({ message: 'Cannot delete an occupied bed. Discharge the patient first.' });
    return;
  }

  await db.delete(bedAssignments).where(eq(bedAssignments.bedId, req.params.id));
  await db.delete(beds).where(eq(beds.id, req.params.id));
  res.status(204).end();
});

/** GET /api/beds/:id — single bed detail. */
router.get('/:id', async (req, res) => {
  const rows = await db.select().from(beds).where(eq(beds.id, req.params.id)).limit(1);
  if (!rows.length) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  res.json((await enrichBedsList([rows[0]]))[0]);
});

/** GET /api/beds/:id/history — assignment ledger for a bed. */
router.get('/:id/history', async (req, res) => {
  const bedRows = await db.select().from(beds).where(eq(beds.id, req.params.id)).limit(1);
  if (!bedRows.length) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  const assigns = await db.select().from(bedAssignments)
    .where(eq(bedAssignments.bedId, req.params.id))
    .orderBy(desc(bedAssignments.assignedAt));
  res.json(await enrichAssignments(assigns));
});

/** POST /api/beds/:id/assign { patientId, notes? } */
router.post('/:id/assign', async (req, res) => {
  const bedRows = await db.select().from(beds).where(eq(beds.id, req.params.id)).limit(1);
  if (!bedRows.length) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }

  const bed = bedRows[0];
  const { patientId, notes } = (req.body ?? {}) as { patientId?: string; notes?: string };
  if (!patientId) {
    res.status(400).json({ message: 'A patient is required.' });
    return;
  }

  const patRows = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  if (!patRows.length) {
    res.status(400).json({ message: 'Patient not found.' });
    return;
  }

  if (bed.status === 'occupied') {
    res.status(409).json({ message: 'This bed is already occupied.' });
    return;
  }
  if (bed.status === 'maintenance') {
    res.status(409).json({ message: 'A bed under maintenance cannot be assigned.' });
    return;
  }

  // Check if patient is already in another bed
  const existingAssign = await db.select().from(bedAssignments)
    .where(and(eq(bedAssignments.patientId, patientId), eq(bedAssignments.releasedAt, sql`null`)))
    .limit(1);
  if (existingAssign.length) {
    const otherBedRows = await db.select({ number: beds.number }).from(beds)
      .where(eq(beds.id, existingAssign[0].bedId)).limit(1);
    res.status(409).json({ message: `${patRows[0].firstName} ${patRows[0].lastName} is already on ${otherBedRows[0]?.number ?? 'a bed'}.` });
    return;
  }

  const now = dateTimeFromToday(0, new Date().getHours(), new Date().getMinutes());
  const existingBA = await db.select({ id: bedAssignments.id }).from(bedAssignments);
  await db.insert(bedAssignments).values({
    id: nextId('BA-', existingBA),
    bedId: bed.id,
    patientId,
    assignedAt: now,
    releasedAt: null,
    notes: notes?.trim() || null,
  });

  await db.update(beds).set({ status: 'occupied' }).where(eq(beds.id, bed.id));
  await db.update(patients).set({ status: 'admitted' }).where(eq(patients.id, patientId));

  const updated = await db.select().from(beds).where(eq(beds.id, bed.id)).limit(1);
  res.json((await enrichBedsList([updated[0]]))[0]);
});

/** POST /api/beds/:id/transfer { toBedId, notes? } */
router.post('/:id/transfer', async (req, res) => {
  const fromRows = await db.select().from(beds).where(eq(beds.id, req.params.id)).limit(1);
  if (!fromRows.length) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }

  const from = fromRows[0];
  const { toBedId, notes } = (req.body ?? {}) as { toBedId?: string; notes?: string };
  if (from.status !== 'occupied') {
    res.status(422).json({ message: 'Only an occupied bed can be transferred.' });
    return;
  }
  if (!toBedId || toBedId === from.id) {
    res.status(400).json({ message: 'Select a different target bed.' });
    return;
  }

  const toRows = await db.select().from(beds).where(eq(beds.id, toBedId)).limit(1);
  if (!toRows.length) {
    res.status(404).json({ message: 'Target bed not found.' });
    return;
  }
  if (toRows[0].status !== 'available') {
    res.status(409).json({ message: 'The target bed is not available.' });
    return;
  }

  const activeRows = await db.select().from(bedAssignments)
    .where(and(eq(bedAssignments.bedId, from.id), eq(bedAssignments.releasedAt, sql`null`)))
    .limit(1);
  if (!activeRows.length) {
    res.status(422).json({ message: 'No active patient found on the source bed.' });
    return;
  }

  const patientId = activeRows[0].patientId;
  const now = dateTimeFromToday(0, new Date().getHours(), new Date().getMinutes());

  // Release source bed
  await db.update(bedAssignments)
    .set({ releasedAt: now })
    .where(eq(bedAssignments.id, activeRows[0].id));

  // Create new assignment on target bed
  const existingBA = await db.select({ id: bedAssignments.id }).from(bedAssignments);
  await db.insert(bedAssignments).values({
    id: nextId('BA-', existingBA),
    bedId: toBedId,
    patientId,
    assignedAt: now,
    releasedAt: null,
    notes: notes?.trim() || 'Transferred from another ward.',
  });

  await db.update(beds).set({ status: 'available' }).where(eq(beds.id, from.id));
  await db.update(beds).set({ status: 'occupied' }).where(eq(beds.id, toBedId));

  const updated = await db.select().from(beds).where(eq(beds.id, toBedId)).limit(1);
  res.json((await enrichBedsList([updated[0]]))[0]);
});

/** POST /api/beds/:id/discharge { notes? } */
router.post('/:id/discharge', async (req, res) => {
  const bedRows = await db.select().from(beds).where(eq(beds.id, req.params.id)).limit(1);
  if (!bedRows.length) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }

  const activeRows = await db.select().from(bedAssignments)
    .where(and(eq(bedAssignments.bedId, req.params.id), eq(bedAssignments.releasedAt, sql`null`)))
    .limit(1);
  if (!activeRows.length) {
    res.status(422).json({ message: 'This bed has no active patient to discharge.' });
    return;
  }

  const { notes } = (req.body ?? {}) as { notes?: string };
  const now = dateTimeFromToday(0, new Date().getHours(), new Date().getMinutes());

  await db.update(bedAssignments)
    .set({
      releasedAt: now,
      notes: notes?.trim() || activeRows[0].notes,
    })
    .where(eq(bedAssignments.id, activeRows[0].id));

  await db.update(beds).set({ status: 'available' }).where(eq(beds.id, req.params.id));

  // Update patient status
  const patRows = await db.select().from(patients).where(eq(patients.id, activeRows[0].patientId)).limit(1);
  if (patRows.length && patRows[0].status === 'admitted') {
    await db.update(patients).set({ status: 'discharged' }).where(eq(patients.id, activeRows[0].patientId));
  }

  const updated = await db.select().from(beds).where(eq(beds.id, req.params.id)).limit(1);
  res.json((await enrichBedsList([updated[0]]))[0]);
});

export { VALID_STATUSES, VALID_TYPES };
export default router;
