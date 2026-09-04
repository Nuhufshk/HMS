import { nurses as nursesTable } from '../../db/schema';
import { todayISO } from '../../utils/date';
import { findAllNurses, generateNurseId, insertNurse, updateNurse, enrichNurse } from './nurses.repository';
import type { Nurse, NurseStatus } from '../../types';
import type { NurseCreateInput } from './nurses.types';

export async function listNurses() {
  const rows = await findAllNurses();
  return Promise.all(rows.map(enrichNurse));
}

export async function createNurseRecord(body: NurseCreateInput) {
  if (!body.name || !body.departmentId || !body.phone || !body.ward) {
    return { nurse: undefined, error: 'Name, department, phone and ward are required.' };
  }

  const id = await generateNurseId();

  const values: typeof nursesTable.$inferInsert = {
    id,
    name: body.name,
    departmentId: body.departmentId,
    phone: body.phone,
    email: body.email ?? '',
    shift: (body.shift as Nurse['shift']) ?? 'Morning',
    ward: body.ward,
    status: (body.status as NurseStatus) ?? 'active',
    joinedDate: body.joinedDate ?? todayISO(),
  };

  const inserted = await insertNurse(values);
  return { nurse: inserted as Nurse, error: undefined };
}

const NURSE_ALLOWED_KEYS = ['name', 'departmentId', 'phone', 'email', 'shift', 'ward', 'status', 'joinedDate'];

export async function updateNurseRecord(id: string, body: Partial<Nurse>) {
  const { id: _id, ...patchFields } = body;
  const updateData: Record<string, unknown> = {};
  for (const key of NURSE_ALLOWED_KEYS) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  const updated = await updateNurse(id, updateData);
  if (!updated) return undefined;
  return updated as Nurse;
}
