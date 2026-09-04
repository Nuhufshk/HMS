import { apiClient } from './apiClient';
import type { Appointment, AppointmentInput, AppointmentStatus, EnrichedAppointment } from '@/types';
import { dateFromToday } from '@/utils/date';

export const appointmentService = {
  async getAppointments(): Promise<EnrichedAppointment[]> {
    return apiClient.get<EnrichedAppointment[]>('/appointments');
  },

  async getAppointmentsByPatient(patientId: string): Promise<EnrichedAppointment[]> {
    return apiClient.get<EnrichedAppointment[]>(`/appointments?patientId=${patientId}`);
  },

  async getAppointmentsByDoctor(doctorId: string): Promise<EnrichedAppointment[]> {
    return apiClient.get<EnrichedAppointment[]>(`/appointments?doctorId=${doctorId}`);
  },

  async getTodaysAppointments(doctorId?: string): Promise<EnrichedAppointment[]> {
    const all = await this.getAppointments();
    const today = dateFromToday(0);
    return all
      .filter((a) => a.date === today && (!doctorId || a.doctorId === doctorId))
      .sort((a, b) => a.time.localeCompare(b.time));
  },

  async createAppointment(input: AppointmentInput): Promise<Appointment> {
    return apiClient.post<Appointment>('/appointments', input);
  },

  async updateAppointment(id: string, patch: Partial<AppointmentInput>): Promise<Appointment> {
    return apiClient.patch<Appointment>(`/appointments/${id}`, patch);
  },

  async setStatus(id: string, status: AppointmentStatus, notes?: string): Promise<Appointment> {
    return apiClient.patch<Appointment>(`/appointments/${id}/status`, { status, notes });
  },

  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    return this.setStatus(id, 'cancelled', reason);
  },

  /** Last 7 days: counts of scheduled/completed/cancelled per day. */
  async getAppointmentTrend(): Promise<Array<{ day: string; label: string; scheduled: number; completed: number; cancelled: number }>> {
    return apiClient.get('/appointments/trend');
  },
};
