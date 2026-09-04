import { apiClient } from './apiClient';
import type { Prescription, PrescriptionInput, EnrichedPrescription } from '@/types';

export const prescriptionService = {
  async getPrescriptions(): Promise<EnrichedPrescription[]> {
    return apiClient.get<EnrichedPrescription[]>('/prescriptions');
  },

  async getPrescriptionsByPatient(patientId: string): Promise<EnrichedPrescription[]> {
    return apiClient.get<EnrichedPrescription[]>(`/prescriptions?patientId=${patientId}`);
  },

  async getPrescriptionById(id: string): Promise<EnrichedPrescription> {
    return apiClient.get<EnrichedPrescription>(`/prescriptions/${id}`);
  },

  async createPrescription(input: PrescriptionInput): Promise<Prescription> {
    return apiClient.post<Prescription>('/prescriptions', input);
  },

  async setStatus(id: string, status: Prescription['status']): Promise<Prescription> {
    return apiClient.patch<Prescription>(`/prescriptions/${id}/status`, { status });
  },

  async cancelPrescription(id: string, reason?: string): Promise<Prescription> {
    return apiClient.patch<Prescription>(`/prescriptions/${id}/status`, { status: 'cancelled', notes: reason });
  },

  /**
   * Pharmacy workflow: dispense a prescription.
   * The backend decrements medicine stock so inventory and dispensing stay in sync.
   */
  async dispensePrescription(id: string): Promise<Prescription> {
    return apiClient.post<Prescription>(`/prescriptions/${id}/dispense`);
  },
};
