import { Router } from 'express';
import { db, enrichLabTests, nextId } from '../store';
import { dateTimeFromToday, todayISO } from '../utils/date';
import type { LabResultInput, LabStatus, LabTest } from '../types';

const VALID_STATUSES: LabStatus[] = ['requested', 'collected', 'processing', 'completed'];

const router = Router();

/** GET /api/lab-tests?patientId= */
router.get('/lab-tests', (req, res) => {
  let list = [...db.labTests];
  const patientId = String(req.query.patientId ?? '');
  if (patientId) list = list.filter((t) => t.patientId === patientId);
  res.json(enrichLabTests(list));
});

/** GET /api/lab-tests/:id */
router.get('/lab-tests/:id', (req, res) => {
  const found = db.labTests.find((t) => t.id === req.params.id);
  if (!found) {
    res.status(404).json({ message: 'Lab test not found' });
    return;
  }
  res.json(enrichLabTests([found])[0]);
});

/** POST /api/lab-tests */
router.post('/lab-tests', (req, res) => {
  const body = (req.body ?? {}) as Omit<LabTest, 'id' | 'status'>;
  if (!body.patientId || !body.doctorId || !body.testName || !body.sampleType) {
    res.status(400).json({ message: 'Patient, doctor, test name and sample type are required.' });
    return;
  }
  const test: LabTest = {
    ...body,
    id: nextId('LAB-', db.labTests),
    status: 'requested',
    orderedDate: body.orderedDate ?? todayISO(),
    priority: body.priority ?? 'routine',
  };
  db.labTests.unshift(test);
  res.status(201).json(test);
});

/** PATCH /api/lab-tests/:id/status { status } */
router.patch('/lab-tests/:id/status', (req, res) => {
  const idx = db.labTests.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Lab test not found' });
    return;
  }
  const status = (req.body ?? {}).status;
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    return;
  }
  const now = dateTimeFromToday(0);
  db.labTests[idx] = {
    ...db.labTests[idx],
    status,
    collectedAt: status === 'collected' ? db.labTests[idx].collectedAt ?? now : db.labTests[idx].collectedAt,
    completedAt: status === 'completed' ? db.labTests[idx].completedAt ?? now : db.labTests[idx].completedAt,
    id: req.params.id,
  };
  res.json(db.labTests[idx]);
});

/** PATCH /api/lab-tests/:id/result { result, unit?, referenceRange?, notes?, abnormal? } */
router.patch('/lab-tests/:id/result', (req, res) => {
  const idx = db.labTests.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Lab test not found' });
    return;
  }
  const body = (req.body ?? {}) as LabResultInput;
  if (!body.result || typeof body.result !== 'string' || !body.result.trim()) {
    res.status(400).json({ message: 'A result value is required.' });
    return;
  }
  db.labTests[idx] = {
    ...db.labTests[idx],
    result: body.result.trim(),
    unit: body.unit?.trim() || undefined,
    referenceRange: body.referenceRange?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
    abnormal: body.abnormal ?? false,
    status: 'completed',
    completedAt: db.labTests[idx].completedAt ?? dateTimeFromToday(0),
    id: req.params.id,
  };
  res.json(db.labTests[idx]);
});

export default router;
