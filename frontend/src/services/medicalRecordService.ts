import { apiClient } from './apiClient';
import type { MedicalRecord, MedicalRecordInput, EnrichedMedicalRecord } from '@/types';

export const medicalRecordService = {
  async getMedicalRecords(): Promise<EnrichedMedicalRecord[]> {
    return apiClient.get<EnrichedMedicalRecord[]>('/medical-records');
  },

  async getMedicalRecordsByPatient(patientId: string): Promise<EnrichedMedicalRecord[]> {
    return apiClient.get<EnrichedMedicalRecord[]>(`/medical-records?patientId=${patientId}`);
  },

  async getPatientsWithRecords(): Promise<Array<{ patientId: string; patientName: string }>> {
    return apiClient.get('/medical-records/patients');
  },

  async createMedicalRecord(input: MedicalRecordInput): Promise<MedicalRecord> {
    return apiClient.post<MedicalRecord>('/medical-records', input);
  },
};
