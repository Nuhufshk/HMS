import { apiClient } from './apiClient';
import type { Patient, PatientInput } from '@/types';

export const patientService = {
  async getPatients(): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients');
  },

  async getPatientById(id: string): Promise<Patient> {
    return apiClient.get<Patient>(`/patients/${id}`);
  },

  async createPatient(input: PatientInput): Promise<Patient> {
    return apiClient.post<Patient>('/patients', input);
  },

  async updatePatient(id: string, patch: Partial<PatientInput>): Promise<Patient> {
    return apiClient.patch<Patient>(`/patients/${id}`, patch);
  },

  /** Free-text search used by the global search bar. */
  async searchPatients(query: string, limit = 6): Promise<Patient[]> {
    const q = query.trim();
    if (!q) return [];
    return apiClient.get<Patient[]>(`/patients?q=${encodeURIComponent(q)}&limit=${limit}`);
  },
};
