import { dateFromToday, weekdayShort, monthShort } from '../../utils/date';
import {
  findAllAppointments,
  findAppointmentsByDate,
  findAppointmentById,
  generateAppointmentId,
  insertAppointment,
  updateAppointment,
} from './appointments.repository';
import type { Appointment, AppointmentStatus } from '../../types';
import type { AppointmentCreateInput, AppointmentListQuery, AppointmentStatusInput } from './appointments.types';
import { VALID_STATUSES } from './appointments.types';
import { appointments } from '../../db/schema';

export async function listAppointments(query: AppointmentListQuery) {
  return findAllAppointments(query);
}

export async function getAppointmentTrend() {
  const days: Array<{ day: string; label: string; scheduled: number; completed: number; cancelled: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const date = dateFromToday(-i);
    const rows = await findAppointmentsByDate(date);
    days.push({
      day: date,
      label: `${weekdayShort(date)} ${monthShort(date).replace('.', '')}`,
      scheduled: rows.filter((a) => a.status === 'scheduled' || a.status === 'waiting' || a.status === 'in_progress').length,
      completed: rows.filter((a) => a.status === 'completed').length,
      cancelled: rows.filter((a) => a.status === 'cancelled').length,
    });
  }
  return days;
}

export async function createAppointmentRecord(body: AppointmentCreateInput): Promise<Appointment> {
  const id = await generateAppointmentId();

  const values: typeof appointments.$inferInsert = {
    id,
    patientId: body.patientId!,
    doctorId: body.doctorId!,
    departmentId: body.departmentId ?? '',
    date: body.date!,
    time: body.time!,
    reason: body.reason ?? '',
    type: (body.type as Appointment['type']) ?? 'Consultation',
    status: (body.status as AppointmentStatus) ?? 'scheduled',
    notes: body.notes ?? null,
  };

  return (await insertAppointment(values)) as Appointment;
}

export async function updateAppointmentStatus(
  id: string,
  input: AppointmentStatusInput,
): Promise<{ appointment: Appointment | undefined; error?: string }> {
  if (!input.status || !VALID_STATUSES.includes(input.status as AppointmentStatus)) {
    return { appointment: undefined, error: `Status must be one of: ${VALID_STATUSES.join(', ')}` };
  }

  const updateData: Record<string, unknown> = { status: input.status };
  if (input.notes !== undefined) updateData.notes = input.notes;

  const updated = await updateAppointment(id, updateData);
  return { appointment: updated as Appointment | undefined };
}

const APPOINTMENT_ALLOWED_KEYS = ['patientId', 'doctorId', 'departmentId', 'date', 'time', 'reason', 'type', 'status', 'notes'];

export async function updateAppointmentRecord(
  id: string,
  body: Partial<Appointment>,
): Promise<Appointment | undefined> {
  const { id: _id, ...patchFields } = body;
  const updateData: Record<string, unknown> = {};
  for (const key of APPOINTMENT_ALLOWED_KEYS) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  const updated = await updateAppointment(id, updateData);
  return updated as Appointment | undefined;
}
