import { apiClient } from './apiClient';
import type { LabTest, LabResultInput, LabStatus, EnrichedLabTest } from '@/types';

export const laboratoryService = {
  async getLabTests(): Promise<EnrichedLabTest[]> {
    return apiClient.get<EnrichedLabTest[]>('/lab-tests');
  },

  async getLabTestById(id: string): Promise<EnrichedLabTest> {
    return apiClient.get<EnrichedLabTest>(`/lab-tests/${id}`);
  },

  async getLabTestsByPatient(patientId: string): Promise<EnrichedLabTest[]> {
    return apiClient.get<EnrichedLabTest[]>(`/lab-tests?patientId=${patientId}`);
  },

  async createLabTest(input: Omit<LabTest, 'id' | 'status'>): Promise<LabTest> {
    return apiClient.post<LabTest>('/lab-tests', input);
  },

  async setStatus(id: string, status: LabStatus): Promise<LabTest> {
    return apiClient.patch<LabTest>(`/lab-tests/${id}/status`, { status });
  },

  async updateLabResult(id: string, input: LabResultInput): Promise<LabTest> {
    return apiClient.patch<LabTest>(`/lab-tests/${id}/result`, input);
  },
};
