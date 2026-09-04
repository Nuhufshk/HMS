import { labTests as labTestsTable } from '../../db/schema';
import { dateTimeFromToday, todayISO } from '../../utils/date';
import {
  findAllLabTests,
  findLabTestById,
  generateLabTestId,
  insertLabTest,
  updateLabTest,
  enrichLabTests,
} from './laboratory.repository';
import type { LabResultInput, LabStatus } from '../../types';
import { VALID_STATUSES } from './laboratory.types';

export async function listLabTests(patientId?: string) {
  const rows = await findAllLabTests(patientId);
  return enrichLabTests(rows);
}

export async function getLabTest(id: string) {
  const row = await findLabTestById(id);
  if (!row) return undefined;
  const enriched = await enrichLabTests([row]);
  return enriched[0];
}

export async function createLabTestRecord(body: Record<string, unknown>) {
  if (!body.patientId || !body.doctorId || !body.testName || !body.sampleType) {
    return { labTest: undefined, error: 'Patient, doctor, test name and sample type are required.' };
  }

  const id = await generateLabTestId();

  const values: typeof labTestsTable.$inferInsert = {
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

  const inserted = await insertLabTest(values);
  return { labTest: inserted, error: undefined };
}

export async function updateLabTestStatus(id: string, status: string) {
  if (!VALID_STATUSES.includes(status as LabStatus)) {
    return { labTest: undefined, error: `Status must be one of: ${VALID_STATUSES.join(', ')}` };
  }

  const now = dateTimeFromToday(0);
  const updateData: Record<string, unknown> = { status };

  if (status === 'collected' || status === 'completed') {
    const existing = await findLabTestById(id);
    if (!existing) return { labTest: undefined, error: 'Lab test not found' };
    if (status === 'collected' && !existing.collectedAt) {
      updateData.collectedAt = now;
    }
    if (status === 'completed' && !existing.completedAt) {
      updateData.completedAt = now;
    }
  }

  const updated = await updateLabTest(id, updateData);
  if (!updated) return { labTest: undefined, error: 'Lab test not found' };
  return { labTest: updated, error: undefined };
}

export async function submitLabResult(id: string, body: LabResultInput) {
  if (!body.result || typeof body.result !== 'string' || !body.result.trim()) {
    return { labTest: undefined, error: 'A result value is required.' };
  }

  const existing = await findLabTestById(id);
  if (!existing) return { labTest: undefined, error: 'Lab test not found' };

  const updated = await updateLabTest(id, {
    result: body.result.trim(),
    unit: body.unit?.trim() || null,
    referenceRange: body.referenceRange?.trim() || null,
    notes: body.notes?.trim() || null,
    abnormal: body.abnormal ?? false,
    status: 'completed',
    completedAt: existing.completedAt ?? dateTimeFromToday(0),
  });

  return { labTest: updated, error: undefined };
}
