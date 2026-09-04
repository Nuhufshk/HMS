import { medicalRecords as medicalRecordsTable } from '../../db/schema';
import { dateTimeFromToday } from '../../utils/date';
import {
  findAllMedicalRecords,
  findPatientsWithRecords,
  generateRecordId,
  insertMedicalRecord,
  enrichRecords,
  findPatientName,
} from './medical-records.repository';
import type { MedicalRecordInput } from '../../types';

export async function listMedicalRecords(patientId?: string) {
  const rows = await findAllMedicalRecords(patientId);
  return enrichRecords(rows);
}

export async function listPatientsWithRecords() {
  const rows = await findPatientsWithRecords();
  const result = await Promise.all(
    rows.map(async (r) => ({
      patientId: r.patientId,
      patientName: await findPatientName(r.patientId),
    })),
  );
  return result.sort((a, b) => a.patientName.localeCompare(b.patientName));
}

export async function createMedicalRecord(body: MedicalRecordInput) {
  if (!body.patientId || !body.doctorId || !body.title || !body.description) {
    return { record: undefined, error: 'Patient, doctor, title and description are required.' };
  }

  const id = await generateRecordId();

  const values: typeof medicalRecordsTable.$inferInsert = {
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

  const inserted = await insertMedicalRecord(values);
  return { record: inserted, error: undefined };
}
