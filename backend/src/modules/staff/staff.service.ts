import { staff as staffTable } from '../../db/schema';
import { todayISO } from '../../utils/date';
import { findAllStaff, generateStaffId, insertStaff, updateStaff } from './staff.repository';
import type { Staff, StaffStatus } from '../../types';
import type { StaffCreateInput } from './staff.types';

export async function listStaff() {
  return findAllStaff();
}

export async function createStaffRecord(body: StaffCreateInput) {
  if (!body.name || !body.role || !body.phone) {
    return { staff: undefined, error: 'Name, role and phone are required.' };
  }

  const id = await generateStaffId();

  const values: typeof staffTable.$inferInsert = {
    id,
    name: body.name,
    role: body.role,
    department: body.department ?? '',
    phone: body.phone,
    email: body.email ?? '',
    status: (body.status as StaffStatus) ?? 'active',
    joinedDate: body.joinedDate ?? todayISO(),
  };

  const inserted = await insertStaff(values);
  return { staff: inserted as Staff, error: undefined };
}

const STAFF_ALLOWED_KEYS = ['name', 'role', 'department', 'phone', 'email', 'status', 'joinedDate'];

export async function updateStaffRecord(id: string, body: Partial<Staff>) {
  const { id: _id, ...patchFields } = body;
  const updateData: Record<string, unknown> = {};
  for (const key of STAFF_ALLOWED_KEYS) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  const updated = await updateStaff(id, updateData);
  if (!updated) return undefined;
  return updated as Staff;
}

export async function updateStaffStatus(id: string, status: string) {
  if (status !== 'active' && status !== 'inactive') {
    return { staff: undefined, error: 'Status must be "active" or "inactive".' };
  }

  const updated = await updateStaff(id, { status });
  if (!updated) return { staff: undefined, error: 'Staff member not found.' };
  return { staff: updated as Staff, error: undefined };
}
