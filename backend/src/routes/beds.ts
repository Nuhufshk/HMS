import { Router } from 'express';
import { db, enrichBedAssignments, enrichBeds, nextId, wardStats } from '../store';
import { dateTimeFromToday } from '../utils/date';
import type { Bed, BedInput, BedStatus, BedType, WardInput } from '../types';

const router = Router();

const VALID_STATUSES: BedStatus[] = ['available', 'occupied', 'maintenance'];
const VALID_TYPES: BedType[] = ['General', 'Private', 'ICU', 'Maternity', 'Surgical', 'Paediatric', 'Emergency'];

/** Resolve the active (open) assignment for a bed, if any. */
function activeAssignment(bedId: string) {
  return db.bedAssignments.find((a) => a.bedId === bedId && a.releasedAt === null);
}

/** GET /api/beds?status=&wardId=&type= */
router.get('/', (req, res) => {
  let list = [...db.beds];
  const status = String(req.query.status ?? '');
  if (status && VALID_STATUSES.includes(status as BedStatus)) list = list.filter((b) => b.status === status);
  const wardId = String(req.query.wardId ?? '');
  if (wardId) list = list.filter((b) => b.wardId === wardId);
  const type = String(req.query.type ?? '');
  if (type) list = list.filter((b) => b.type === type);
  res.json(enrichBeds(list));
});

/** GET /api/beds/wards — per-ward stats for the ward map. */
router.get('/wards', (_req, res) => {
  res.json(wardStats(db.wards));
});

/** POST /api/beds/wards — create a ward together with its beds. */
router.post('/wards', (req, res) => {
  const body = (req.body ?? {}) as WardInput;
  if (!body.name || !body.departmentId) {
    res.status(400).json({ message: 'Ward name and department are required.' });
    return;
  }
  const count = Math.max(1, Math.floor(Number(body.totalBeds) || 1));
  const ward = {
    id: nextId('W-', db.wards),
    name: body.name.trim(),
    location: body.location?.trim() || 'Not specified',
    departmentId: body.departmentId,
  };
  db.wards.push(ward);
  // Create `count` beds for the new ward.
  const existing = db.beds.filter((b) => b.wardId === ward.id);
  const start = db.beds.length + 1;
  const prefix = ward.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 2) || 'BD';
  for (let i = 0; i < count; i++) {
    db.beds.push({
      id: nextId('BD-', db.beds),
      number: `${prefix}-${String(start + existing.length + i).padStart(2, '0')}`,
      wardId: ward.id,
      type: 'General',
      status: 'available',
      ratePerDay: 200,
    });
  }
  const stats = wardStats([ward])[0];
  res.status(201).json(stats);
});

/** POST /api/beds — create a single bed (optional; ward creation is the main path). */
router.post('/', (req, res) => {
  const body = (req.body ?? {}) as BedInput;
  if (!body.number || !body.wardId) {
    res.status(400).json({ message: 'Bed number and ward are required.' });
    return;
  }
  const bed: Bed = {
    number: body.number.trim(),
    wardId: body.wardId,
    type: body.type ?? 'General',
    status: body.status ?? 'available',
    ratePerDay: Number(body.ratePerDay) || 0,
    id: nextId('BD-', db.beds),
  };
  db.beds.push(bed);
  res.status(201).json(enrichBeds([bed])[0]);
});

/** PATCH /api/beds/:id/maintenance { maintenance: boolean } */
router.patch('/:id/maintenance', (req, res) => {
  const idx = db.beds.findIndex((b) => b.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  const maintenance = Boolean((req.body ?? {}).maintenance);
  if (maintenance && db.beds[idx].status === 'occupied') {
    res.status(409).json({ message: 'An occupied bed cannot be taken out of service. Discharge the patient first.' });
    return;
  }
  db.beds[idx] = { ...db.beds[idx], status: maintenance ? 'maintenance' : 'available', id: req.params.id };
  res.json(enrichBeds([db.beds[idx]])[0]);
});

/** PATCH /api/beds/:id — generic update (number, ward, type, rate). */
router.patch('/:id', (req, res) => {
  const idx = db.beds.findIndex((b) => b.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  const patch = (req.body ?? {}) as Partial<BedInput>;
  let merged = { ...db.beds[idx], ...patch, id: req.params.id };
  if ('status' in patch && patch.status !== 'occupied' && db.beds[idx].status === 'occupied') {
    merged = { ...merged, status: 'occupied' };
  }
  if ('ratePerDay' in merged) merged.ratePerDay = Number(merged.ratePerDay) || 0;
  db.beds[idx] = merged;
  res.json(enrichBeds([merged])[0]);
});

/** DELETE /api/beds/:id */
router.delete('/:id', (req, res) => {
  const idx = db.beds.findIndex((b) => b.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  if (db.beds[idx].status === 'occupied') {
    res.status(409).json({ message: 'Cannot delete an occupied bed. Discharge the patient first.' });
    return;
  }
  const [removed] = db.beds.splice(idx, 1);
  db.bedAssignments = db.bedAssignments.filter((a) => a.bedId !== removed.id);
  res.status(204).end();
});

/** GET /api/beds/:id — single bed detail. */
router.get('/:id', (req, res) => {
  const bed = db.beds.find((b) => b.id === req.params.id);
  if (!bed) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  res.json(enrichBeds([bed])[0]);
});

/** GET /api/beds/:id/history — assignment ledger for a bed. */
router.get('/:id/history', (req, res) => {
  const bed = db.beds.find((b) => b.id === req.params.id);
  if (!bed) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  res.json(enrichBedAssignments(db.bedAssignments.filter((a) => a.bedId === bed.id)));
});

/** POST /api/beds/:id/assign { patientId, notes? } */
router.post('/:id/assign', (req, res) => {
  const idx = db.beds.findIndex((b) => b.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  const { patientId, notes } = (req.body ?? {}) as { patientId?: string; notes?: string };
  if (!patientId) {
    res.status(400).json({ message: 'A patient is required.' });
    return;
  }
  const patient = db.patients.find((p) => p.id === patientId);
  if (!patient) {
    res.status(400).json({ message: 'Patient not found.' });
    return;
  }
  if (db.beds[idx].status === 'occupied') {
    res.status(409).json({ message: 'This bed is already occupied.' });
    return;
  }
  if (db.beds[idx].status === 'maintenance') {
    res.status(409).json({ message: 'A bed under maintenance cannot be assigned.' });
    return;
  }
  const existing = db.bedAssignments.find((a) => a.patientId === patientId && a.releasedAt === null);
  if (existing) {
    const otherBed = db.beds.find((b) => b.id === existing.bedId);
    res.status(409).json({ message: `${patient.firstName} ${patient.lastName} is already on ${otherBed?.number ?? 'a bed'}.` });
    return;
  }
  db.bedAssignments.unshift({
    id: nextId('BA-', db.bedAssignments),
    bedId: db.beds[idx].id,
    patientId,
    assignedAt: dateTimeFromToday(0, new Date().getHours(), new Date().getMinutes()),
    releasedAt: null,
    notes: notes?.trim() || undefined,
  });
  db.beds[idx] = { ...db.beds[idx], status: 'occupied' };
  const pIdx = db.patients.findIndex((p) => p.id === patientId);
  if (pIdx !== -1) db.patients[pIdx] = { ...db.patients[pIdx], status: 'admitted' };
  res.json(enrichBeds([db.beds[idx]])[0]);
});

/** POST /api/beds/:id/transfer { toBedId, notes? } — move the patient to another bed. */
router.post('/:id/transfer', (req, res) => {
  const idx = db.beds.findIndex((b) => b.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  const { toBedId, notes } = (req.body ?? {}) as { toBedId?: string; notes?: string };
  const from = db.beds[idx];
  if (from.status !== 'occupied') {
    res.status(422).json({ message: 'Only an occupied bed can be transferred.' });
    return;
  }
  if (!toBedId || toBedId === from.id) {
    res.status(400).json({ message: 'Select a different target bed.' });
    return;
  }
  const toIdx = db.beds.findIndex((b) => b.id === toBedId);
  if (toIdx === -1) {
    res.status(404).json({ message: 'Target bed not found.' });
    return;
  }
  if (db.beds[toIdx].status !== 'available') {
    res.status(409).json({ message: 'The target bed is not available.' });
    return;
  }
  // Release the source and open a new assignment on the target.
  const activeIdx = db.bedAssignments.findIndex((a) => a.bedId === from.id && a.releasedAt === null);
  if (activeIdx === -1) {
    res.status(422).json({ message: 'No active patient found on the source bed.' });
    return;
  }
  const patientId = db.bedAssignments[activeIdx].patientId;
  const now = dateTimeFromToday(0, new Date().getHours(), new Date().getMinutes());
  db.bedAssignments[activeIdx] = { ...db.bedAssignments[activeIdx], releasedAt: now };
  db.bedAssignments.unshift({
    id: nextId('BA-', db.bedAssignments),
    bedId: toBedId,
    patientId,
    assignedAt: now,
    releasedAt: null,
    notes: notes?.trim() || 'Transferred from another ward.',
  });
  db.beds[idx] = { ...from, status: 'available' };
  db.beds[toIdx] = { ...db.beds[toIdx], status: 'occupied' };
  res.json(enrichBeds([db.beds[toIdx]])[0]);
});

/** POST /api/beds/:id/discharge { notes? } */
router.post('/:id/discharge', (req, res) => {
  const idx = db.beds.findIndex((b) => b.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Bed not found' });
    return;
  }
  const { notes } = (req.body ?? {}) as { notes?: string };
  const activeIdx = db.bedAssignments.findIndex((a) => a.bedId === db.beds[idx].id && a.releasedAt === null);
  if (activeIdx === -1) {
    res.status(422).json({ message: 'This bed has no active patient to discharge.' });
    return;
  }
  const patientId = db.bedAssignments[activeIdx].patientId;
  db.bedAssignments[activeIdx] = {
    ...db.bedAssignments[activeIdx],
    releasedAt: dateTimeFromToday(0, new Date().getHours(), new Date().getMinutes()),
    notes: notes?.trim() || db.bedAssignments[activeIdx].notes,
  };
  db.beds[idx] = { ...db.beds[idx], status: 'available' };
  const pIdx = db.patients.findIndex((p) => p.id === patientId);
  if (pIdx !== -1 && db.patients[pIdx].status === 'admitted') {
    db.patients[pIdx] = { ...db.patients[pIdx], status: 'discharged' };
  }
  res.json(enrichBeds([db.beds[idx]])[0]);
});

export { VALID_STATUSES, VALID_TYPES, activeAssignment };
export default router;
