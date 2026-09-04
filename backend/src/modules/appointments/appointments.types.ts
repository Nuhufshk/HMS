import type { Appointment, AppointmentStatus } from '../../types';

export const VALID_STATUSES: AppointmentStatus[] = ['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled'];

export interface AppointmentListQuery {
  patientId?: string;
  doctorId?: string;
}

export type AppointmentCreateInput = Partial<Appointment>;

export interface AppointmentStatusInput {
  status?: string;
  notes?: string;
}
