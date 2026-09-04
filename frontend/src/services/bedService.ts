import { apiClient } from './apiClient';
import type { BedInput, EnrichedBed, EnrichedBedAssignment, WardInput, WardStats } from '@/types';

export const bedService = {
  async getBeds(): Promise<EnrichedBed[]> {
    return apiClient.get<EnrichedBed[]>('/beds');
  },

  async getBedById(id: string): Promise<EnrichedBed> {
    return apiClient.get<EnrichedBed>(`/beds/${id}`);
  },

  async getWards(): Promise<WardStats[]> {
    return apiClient.get<WardStats[]>('/beds/wards');
  },

  async getBedHistory(id: string): Promise<EnrichedBedAssignment[]> {
    return apiClient.get<EnrichedBedAssignment[]>(`/beds/${id}/history`);
  },

  async createWard(input: WardInput): Promise<WardStats> {
    return apiClient.post<WardStats>('/beds/wards', input);
  },

  async createBed(input: BedInput): Promise<EnrichedBed> {
    return apiClient.post<EnrichedBed>('/beds', input);
  },

  async updateBed(id: string, patch: Partial<BedInput>): Promise<EnrichedBed> {
    return apiClient.patch<EnrichedBed>(`/beds/${id}`, patch);
  },

  async deleteBed(id: string): Promise<void> {
    return apiClient.del<void>(`/beds/${id}`);
  },

  async assignBed(id: string, patientId: string, notes?: string): Promise<EnrichedBed> {
    return apiClient.post<EnrichedBed>(`/beds/${id}/assign`, { patientId, notes });
  },

  async dischargeBed(id: string, notes?: string): Promise<EnrichedBed> {
    return apiClient.post<EnrichedBed>(`/beds/${id}/discharge`, { notes });
  },

  async transferBed(id: string, toBedId: string, notes?: string): Promise<EnrichedBed> {
    return apiClient.post<EnrichedBed>(`/beds/${id}/transfer`, { toBedId, notes });
  },

  async setMaintenance(id: string, maintenance: boolean): Promise<EnrichedBed> {
    return apiClient.patch<EnrichedBed>(`/beds/${id}/maintenance`, { maintenance });
  },
};
