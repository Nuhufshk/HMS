import { apiClient } from './apiClient';
import type { Doctor, DoctorInput, Patient } from '@/types';

export interface DoctorWithStats extends Doctor {
  patientsCount: number;
  departmentName: string;
}

export const doctorService = {
  async getDoctors(): Promise<DoctorWithStats[]> {
    return apiClient.get<DoctorWithStats[]>('/doctors');
  },

  async getDoctorById(id: string): Promise<DoctorWithStats> {
    return apiClient.get<DoctorWithStats>(`/doctors/${id}`);
  },

  async getAvailableDoctors(): Promise<DoctorWithStats[]> {
    return apiClient.get<DoctorWithStats[]>('/doctors?availability=available');
  },

  async getDoctorsByDepartment(departmentId: string): Promise<DoctorWithStats[]> {
    return apiClient.get<DoctorWithStats[]>(`/doctors?departmentId=${departmentId}`);
  },

  async createDoctor(input: DoctorInput): Promise<Doctor> {
    return apiClient.post<Doctor>('/doctors', input);
  },

  async updateDoctor(id: string, patch: Partial<DoctorInput>): Promise<Doctor> {
    return apiClient.patch<Doctor>(`/doctors/${id}`, patch);
  },

  async getAssignedPatients(doctorId: string): Promise<Patient[]> {
    return apiClient.get<Patient[]>(`/patients?doctorId=${doctorId}`);
  },
};
