import { apiClient } from './apiClient';
import type { Department } from '@/types';

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    return apiClient.get<Department[]>('/departments');
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    return apiClient.get<Department | null>(`/departments/${id}`);
  },

  async getDepartmentStaff(departmentId: string): Promise<{ doctors: string[]; nurses: string[] }> {
    return apiClient.get<{ doctors: string[]; nurses: string[] }>(`/departments/${departmentId}/staff`);
  },
};
