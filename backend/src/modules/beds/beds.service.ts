import { beds as bedsTable, bedAssignments as bedAssignmentsTable } from '../../db/schema';
import { dateTimeFromToday } from '../../utils/date';
import {
  findBeds,
  findBedById,
  generateBedId,
  insertBed,
  updateBed,
  deleteBed as deleteBedFromDb,
  findActiveAssignment,
  findPatientActiveAssignment,
  findBedNumber,
  generateAssignmentId,
  insertAssignment,
  releaseAssignment,
  setBedStatus,
  setPatientStatus,
  findPatientById,
  findBedAssignments,
  enrichBed,
  enrichAssignment,
} from './beds.repository';
import type { BedInput, BedStatus, BedType } from '../../types';
import type { BedListQuery, AssignInput, TransferInput } from './beds.types';

export async function listBeds(query: BedListQuery) {
  const rows = await findBeds(query);
  return Promise.all(rows.map(enrichBed));
}

export async function getBed(id: string) {
  const bed = await findBedById(id);
  if (!bed) return undefined;
  return enrichBed(bed);
}

export async function createBedRecord(body: BedInput) {
  if (!body.number || !body.wardId) {
    return { bed: undefined, error: 'Bed number and ward are required.' };
  }

  const id = await generateBedId();
  const values: typeof bedsTable.$inferInsert = {
    id,
    number: body.number.trim(),
    wardId: body.wardId,
    type: (body.type as BedType) ?? 'General',
    status: (body.status as BedStatus) ?? 'available',
    ratePerDay: Number(body.ratePerDay) || 0,
  };

  const inserted = await insertBed(values);
  return { bed: await enrichBed(inserted), error: undefined };
}

export async function toggleMaintenance(id: string, maintenance: boolean) {
  const bed = await findBedById(id);
  if (!bed) return { bed: undefined, error: 'Bed not found' };
  if (maintenance && bed.status === 'occupied') {
    return { bed: undefined, error: 'An occupied bed cannot be taken out of service. Discharge the patient first.' };
  }

  await setBedStatus(id, maintenance ? 'maintenance' : 'available');
  const updated = await findBedById(id);
  return { bed: await enrichBed(updated!), error: undefined };
}

export async function updateBedRecord(id: string, body: Partial<BedInput>) {
  const existing = await findBedById(id);
  if (!existing) return { bed: undefined, error: 'Bed not found' };

  const updateData: Record<string, unknown> = {};
  if ('number' in body) updateData.number = body.number;
  if ('wardId' in body) updateData.wardId = body.wardId;
  if ('type' in body) updateData.type = body.type;
  if ('ratePerDay' in body) updateData.ratePerDay = Number(body.ratePerDay) || 0;
  if ('status' in body && body.status !== 'occupied' && existing.status === 'occupied') {
    updateData.status = 'occupied';
  } else if ('status' in body) {
    updateData.status = body.status;
  }

  await updateBed(id, updateData);
  const updated = await findBedById(id);
  return { bed: await enrichBed(updated!), error: undefined };
}

export async function deleteBedRecord(id: string) {
  const bed = await findBedById(id);
  if (!bed) return { error: 'Bed not found' };
  if (bed.status === 'occupied') return { error: 'Cannot delete an occupied bed. Discharge the patient first.' };

  await deleteBedFromDb(id);
  return { error: undefined };
}

export async function getBedHistory(id: string) {
  const bed = await findBedById(id);
  if (!bed) return { assignments: undefined, error: 'Bed not found' };

  const assigns = await findBedAssignments(id);
  return { assignments: await Promise.all(assigns.map(enrichAssignment)), error: undefined };
}

export async function assignPatientToBed(bedId: string, input: AssignInput) {
  const bed = await findBedById(bedId);
  if (!bed) return { bed: undefined, error: 'Bed not found' };

  if (!input.patientId) return { bed: undefined, error: 'A patient is required.' };

  const patient = await findPatientById(input.patientId);
  if (!patient) return { bed: undefined, error: 'Patient not found.' };

  if (bed.status === 'occupied') return { bed: undefined, error: 'This bed is already occupied.' };
  if (bed.status === 'maintenance') return { bed: undefined, error: 'A bed under maintenance cannot be assigned.' };

  const existingAssign = await findPatientActiveAssignment(input.patientId);
  if (existingAssign) {
    const otherBedNumber = await findBedNumber(existingAssign.bedId);
    return { bed: undefined, error: `${patient.firstName} ${patient.lastName} is already on ${otherBedNumber ?? 'a bed'}.` };
  }

  const now = dateTimeFromToday(0, new Date().getHours(), new Date().getMinutes());
  const assignmentId = await generateAssignmentId();

  await insertAssignment({
    id: assignmentId,
    bedId,
    patientId: input.patientId,
    assignedAt: now,
    releasedAt: null,
    notes: input.notes?.trim() || null,
  } as typeof bedAssignmentsTable.$inferInsert);

  await setBedStatus(bedId, 'occupied');
  await setPatientStatus(input.patientId, 'admitted');

  const updated = await findBedById(bedId);
  return { bed: await enrichBed(updated!), error: undefined };
}

export async function transferPatient(fromBedId: string, input: TransferInput) {
  const fromBed = await findBedById(fromBedId);
  if (!fromBed) return { bed: undefined, error: 'Bed not found' };

  if (fromBed.status !== 'occupied') return { bed: undefined, error: 'Only an occupied bed can be transferred.' };
  if (!input.toBedId || input.toBedId === fromBed.id) return { bed: undefined, error: 'Select a different target bed.' };

  const toBed = await findBedById(input.toBedId);
  if (!toBed) return { bed: undefined, error: 'Target bed not found.' };
  if (toBed.status !== 'available') return { bed: undefined, error: 'The target bed is not available.' };

  const activeAssignment = await findActiveAssignment(fromBedId);
  if (!activeAssignment) return { bed: undefined, error: 'No active patient found on the source bed.' };

  const patientId = activeAssignment.patientId;
  const now = dateTimeFromToday(0, new Date().getHours(), new Date().getMinutes());

  await releaseAssignment(activeAssignment.id, now);

  const assignmentId = await generateAssignmentId();
  await insertAssignment({
    id: assignmentId,
    bedId: input.toBedId,
    patientId,
    assignedAt: now,
    releasedAt: null,
    notes: input.notes?.trim() || 'Transferred from another ward.',
  } as typeof bedAssignmentsTable.$inferInsert);

  await setBedStatus(fromBedId, 'available');
  await setBedStatus(input.toBedId, 'occupied');

  const updated = await findBedById(input.toBedId);
  return { bed: await enrichBed(updated!), error: undefined };
}

export async function dischargePatient(bedId: string, notes?: string) {
  const bed = await findBedById(bedId);
  if (!bed) return { bed: undefined, error: 'Bed not found' };

  const activeAssignment = await findActiveAssignment(bedId);
  if (!activeAssignment) return { bed: undefined, error: 'This bed has no active patient to discharge.' };

  const now = dateTimeFromToday(0, new Date().getHours(), new Date().getMinutes());

  await releaseAssignment(activeAssignment.id, now);
  await setBedStatus(bedId, 'available');

  const patient = await findPatientById(activeAssignment.patientId);
  if (patient && patient.status === 'admitted') {
    await setPatientStatus(activeAssignment.patientId, 'discharged');
  }

  const updated = await findBedById(bedId);
  return { bed: await enrichBed(updated!), error: undefined };
}
