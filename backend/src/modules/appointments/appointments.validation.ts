import type { Appointment, AppointmentStatus } from '../../types';

export function validateCreateInput(body: unknown): Partial<Appointment> {
  return (body ?? {}) as Partial<Appointment>;
}

export function validateRequiredFields(body: Partial<Appointment>): string | null {
  if (!body.patientId || !body.doctorId || !body.date || !body.time) {
    return 'Patient, doctor, date and time are required.';
  }
  return null;
}

export function validateStatusInput(body: unknown): { status?: string; notes?: string } {
  const { status, notes } = (body ?? {}) as { status?: string; notes?: string };
  return { status, notes };
}
