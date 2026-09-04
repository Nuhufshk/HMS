import { doctors } from '../../db/schema';
import { todayISO } from '../../utils/date';
import {
  findAllDoctors,
  findDoctorById,
  generateDoctorId,
  insertDoctor,
  updateDoctor,
  enrichDoctor,
} from './doctors.repository';
import type { Doctor, DoctorAvailability, DoctorStatus } from '../../types';
import type { DoctorCreateInput, DoctorListQuery } from './doctors.types';

export async function listDoctors(query: DoctorListQuery) {
  let rows = await findAllDoctors();

  if (query.availability) {
    rows = rows.filter((d) => d.status === 'active' && d.availability === query.availability);
  }
  if (query.departmentId) {
    rows = rows.filter((d) => d.departmentId === query.departmentId);
  }

  return Promise.all(rows.map(enrichDoctor));
}

export async function getDoctor(id: string) {
  const d = await findDoctorById(id);
  if (!d) return undefined;
  return enrichDoctor(d as typeof doctors.$inferSelect);
}

export async function createDoctorRecord(body: DoctorCreateInput) {
  if (!body.name || !body.specialization || !body.departmentId || !body.phone) {
    return { doctor: undefined, error: 'Name, specialisation, department and phone are required.' };
  }

  const id = await generateDoctorId();

  const values: typeof doctors.$inferInsert = {
    id,
    name: body.name,
    specialization: body.specialization,
    departmentId: body.departmentId,
    phone: body.phone,
    email: body.email ?? '',
    status: (body.status as DoctorStatus) ?? 'active',
    availability: (body.availability as DoctorAvailability) ?? 'available',
    joinedDate: body.joinedDate ?? todayISO(),
    schedule: body.schedule ?? [
      { day: 'Monday', hours: '08:00 – 16:00' },
      { day: 'Tuesday', hours: '08:00 – 16:00' },
      { day: 'Wednesday', hours: '08:00 – 16:00' },
      { day: 'Thursday', hours: '08:00 – 16:00' },
      { day: 'Friday', hours: '08:00 – 16:00' },
    ],
    about: body.about ?? 'Newly added doctor.',
  };

  const inserted = await insertDoctor(values);
  return { doctor: inserted as Doctor, error: undefined };
}

const DOCTOR_ALLOWED_KEYS = ['name', 'specialization', 'departmentId', 'phone', 'email', 'status', 'availability', 'joinedDate', 'schedule', 'about'];

export async function updateDoctorRecord(id: string, body: Partial<Doctor>) {
  const { id: _id, ...patchFields } = body;
  const updateData: Record<string, unknown> = {};
  for (const key of DOCTOR_ALLOWED_KEYS) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  const updated = await updateDoctor(id, updateData);
  if (!updated) return undefined;
  return updated as Doctor;
}
