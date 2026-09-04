import { apiClient } from './apiClient';
import type { Nurse, NurseInput } from '@/types';

export interface NurseWithDept extends Nurse {
  departmentName: string;
}

export const nurseService = {
  async getNurses(): Promise<NurseWithDept[]> {
    return apiClient.get<NurseWithDept[]>('/nurses');
  },

  async createNurse(input: NurseInput): Promise<Nurse> {
    return apiClient.post<Nurse>('/nurses', input);
  },

  async updateNurse(id: string, patch: Partial<NurseInput>): Promise<Nurse> {
    return apiClient.patch<Nurse>(`/nurses/${id}`, patch);
  },
};
