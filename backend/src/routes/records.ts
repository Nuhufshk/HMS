import { Router } from 'express';
import { db, enrichRecords, nextId } from '../store';
import { dateTimeFromToday } from '../utils/date';
import type { MedicalRecord, MedicalRecordInput } from '../types';

const router = Router();

/** GET /api/medical-records?patientId= */
router.get('/medical-records', (req, res) => {
  let list = [...db.medicalRecords];
  const patientId = String(req.query.patientId ?? '');
  if (patientId) list = list.filter((r) => r.patientId === patientId);
  res.json(enrichRecords(list));
});

/** GET /api/medical-records/patients — patients that have records */
router.get('/medical-records/patients', (_req, res) => {
  const ids = [...new Set(db.medicalRecords.map((r) => r.patientId))];
  res.json(
    ids
      .map((id) => {
        const patient = db.patients.find((p) => p.id === id);
        return {
          patientId: id,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : id,
        };
      })
      .sort((a, b) => a.patientName.localeCompare(b.patientName)),
  );
});

/** POST /api/medical-records */
router.post('/medical-records', (req, res) => {
  const body = (req.body ?? {}) as MedicalRecordInput;
  if (!body.patientId || !body.doctorId || !body.title || !body.description) {
    res.status(400).json({ message: 'Patient, doctor, title and description are required.' });
    return;
  }
  const record: MedicalRecord = {
    ...body,
    id: nextId('REC-', db.medicalRecords),
    date: body.date ?? dateTimeFromToday(0),
    type: body.type ?? 'note',
  };
  db.medicalRecords.unshift(record);
  res.status(201).json(record);
});

export default router;
