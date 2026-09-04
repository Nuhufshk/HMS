import { apiClient } from './apiClient';
import type { Staff, StaffInput, StaffStatus } from '@/types';

export const staffService = {
  async getStaff(): Promise<Staff[]> {
    return apiClient.get<Staff[]>('/staff');
  },

  async createStaff(input: StaffInput): Promise<Staff> {
    return apiClient.post<Staff>('/staff', input);
  },

  async updateStaff(id: string, patch: Partial<StaffInput>): Promise<Staff> {
    return apiClient.patch<Staff>(`/staff/${id}`, patch);
  },

  async setStatus(id: string, status: StaffStatus): Promise<Staff> {
    return apiClient.patch<Staff>(`/staff/${id}/status`, { status });
  },
};
