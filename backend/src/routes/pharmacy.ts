import { Router } from 'express';
import { db, deriveMedicineStatus, enrichPrescriptions, medicineDetail, nextId } from '../store';
import { todayISO } from '../utils/date';
import type { Medicine, MedicineInput, Prescription, PrescriptionInput, PrescriptionStatus } from '../types';

const router = Router();

/* -------------------------------- Medicines -------------------------------- */

/** GET /api/medicines */
router.get('/medicines', (_req, res) => {
  res.json(db.medicines.map(medicineDetail).sort((a, b) => a.name.localeCompare(b.name)));
});

/** POST /api/medicines */
router.post('/medicines', (req, res) => {
  const body = (req.body ?? {}) as MedicineInput;
  if (!body.name || !body.category || !body.expiryDate || !body.supplier) {
    res.status(400).json({ message: 'Name, category, expiry date and supplier are required.' });
    return;
  }
  const medicine: Medicine = {
    ...body,
    id: nextId('MED-', db.medicines),
    batch: body.batch?.trim() || `BT-${Math.floor(1000 + Math.random() * 9000)}`,
    status: deriveMedicineStatus({ quantity: Number(body.quantity) || 0, reorderLevel: Number(body.reorderLevel) || 0, expiryDate: body.expiryDate }),
  };
  db.medicines.push(medicine);
  res.status(201).json(medicine);
});

/** PATCH /api/medicines/:id */
router.patch('/medicines/:id', (req, res) => {
  const idx = db.medicines.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Medicine not found' });
    return;
  }
  const merged = { ...db.medicines[idx], ...(req.body ?? {}), id: req.params.id };
  merged.status = deriveMedicineStatus(merged);
  db.medicines[idx] = merged;
  res.json(medicineDetail(merged));
});

/** PATCH /api/medicines/:id/stock { delta } — e.g. {-1} when dispensing */
router.patch('/medicines/:id/stock', (req, res) => {
  const idx = db.medicines.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Medicine not found' });
    return;
  }
  const delta = Number((req.body ?? {}).delta);
  if (!Number.isFinite(delta)) {
    res.status(400).json({ message: 'A numeric delta is required.' });
    return;
  }
  const merged = { ...db.medicines[idx], quantity: Math.max(0, db.medicines[idx].quantity + delta), id: req.params.id };
  merged.status = deriveMedicineStatus(merged);
  db.medicines[idx] = merged;
  res.json(medicineDetail(merged));
});

/* ------------------------------- Prescriptions ------------------------------ */

/** GET /api/prescriptions?patientId= */
router.get('/prescriptions', (req, res) => {
  let list = [...db.prescriptions];
  const patientId = String(req.query.patientId ?? '');
  if (patientId) list = list.filter((p) => p.patientId === patientId);
  res.json(enrichPrescriptions(list));
});

/** GET /api/prescriptions/:id */
router.get('/prescriptions/:id', (req, res) => {
  const found = db.prescriptions.find((p) => p.id === req.params.id);
  if (!found) {
    res.status(404).json({ message: 'Prescription not found' });
    return;
  }
  res.json(enrichPrescriptions([found])[0]);
});

/** POST /api/prescriptions */
router.post('/prescriptions', (req, res) => {
  const body = (req.body ?? {}) as PrescriptionInput;
  if (!body.patientId || !body.doctorId || !body.diagnosis) {
    res.status(400).json({ message: 'Patient, doctor and diagnosis are required.' });
    return;
  }
  if (!body.medications || body.medications.length === 0) {
    res.status(422).json({ message: 'A prescription must contain at least one medication' });
    return;
  }
  const prescription: Prescription = {
    ...body,
    id: nextId('RX-', db.prescriptions),
    date: body.date ?? todayISO(),
    status: (body.status as PrescriptionStatus) ?? 'active',
  };
  db.prescriptions.unshift(prescription);
  res.status(201).json(prescription);
});

/** PATCH /api/prescriptions/:id/status { status } */
router.patch('/prescriptions/:id/status', (req, res) => {
  const idx = db.prescriptions.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Prescription not found' });
    return;
  }
  const status = (req.body ?? {}).status;
  if (!['active', 'dispensed', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ message: 'Status must be active, dispensed, completed or cancelled.' });
    return;
  }
  db.prescriptions[idx] = { ...db.prescriptions[idx], status, id: req.params.id };
  res.json(db.prescriptions[idx]);
});

/** POST /api/prescriptions/:id/dispense — also decrements medicine stock. */
router.post('/prescriptions/:id/dispense', (req, res) => {
  const idx = db.prescriptions.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Prescription not found' });
    return;
  }
  if (db.prescriptions[idx].status === 'dispensed') {
    res.status(422).json({ message: 'Prescription already dispensed' });
    return;
  }
  // Decrement stock for each medication line (best-effort name match).
  for (const med of db.prescriptions[idx].medications) {
    const match = db.medicines.find((m) => med.name.toLowerCase().startsWith(m.name.toLowerCase().slice(0, 12)));
    if (match) {
      const merged = { ...match, quantity: Math.max(0, match.quantity - 1) };
      merged.status = deriveMedicineStatus(merged);
      db.medicines[db.medicines.indexOf(match)] = merged;
    }
  }
  db.prescriptions[idx] = { ...db.prescriptions[idx], status: 'dispensed', id: req.params.id };
  res.json(db.prescriptions[idx]);
});

export default router;
