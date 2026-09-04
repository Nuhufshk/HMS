import { prescriptions as prescriptionsTable } from '../../db/schema';
import { todayISO } from '../../utils/date';
import {
  findAllPrescriptions,
  findPrescriptionById,
  generatePrescriptionId,
  insertPrescription,
  updatePrescription,
  enrichPrescriptions,
  findMedicineByNameFragment,
  decrementMedicineStock,
} from './prescriptions.repository';
import type { PrescriptionInput, PrescriptionStatus } from '../../types';

export async function listPrescriptions(patientId?: string) {
  const rows = await findAllPrescriptions(patientId);
  return enrichPrescriptions(rows);
}

export async function getPrescription(id: string) {
  const row = await findPrescriptionById(id);
  if (!row) return undefined;
  const enriched = await enrichPrescriptions([row]);
  return enriched[0];
}

export async function createPrescriptionRecord(body: PrescriptionInput) {
  if (!body.patientId || !body.doctorId || !body.diagnosis) {
    return { prescription: undefined, error: 'Patient, doctor and diagnosis are required.' };
  }
  if (!body.medications || body.medications.length === 0) {
    return { prescription: undefined, error: 'A prescription must contain at least one medication' };
  }

  const id = await generatePrescriptionId();

  const values: typeof prescriptionsTable.$inferInsert = {
    id,
    patientId: body.patientId,
    doctorId: body.doctorId,
    date: body.date ?? todayISO(),
    diagnosis: body.diagnosis,
    medications: body.medications,
    status: (body.status as PrescriptionStatus) ?? 'active',
    notes: body.notes ?? null,
  };

  const inserted = await insertPrescription(values);
  return { prescription: inserted, error: undefined };
}

export async function updatePrescriptionStatus(id: string, status: string) {
  if (!['active', 'dispensed', 'completed', 'cancelled'].includes(status)) {
    return { prescription: undefined, error: 'Status must be active, dispensed, completed or cancelled.' };
  }

  const updated = await updatePrescription(id, { status });
  if (!updated) return { prescription: undefined, error: 'Prescription not found' };
  return { prescription: updated, error: undefined };
}

export async function dispensePrescription(id: string) {
  const rx = await findPrescriptionById(id);
  if (!rx) return { prescription: undefined, error: 'Prescription not found' };
  if (rx.status === 'dispensed') return { prescription: undefined, error: 'Prescription already dispensed' };

  for (const med of rx.medications) {
    const match = await findMedicineByNameFragment(med.name);
    if (match) {
      const newQty = Math.max(0, match.quantity - 1);
      await decrementMedicineStock(match.id, newQty, match.reorderLevel, match.expiryDate);
    }
  }

  const updated = await updatePrescription(id, { status: 'dispensed' });
  return { prescription: updated, error: undefined };
}
