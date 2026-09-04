import { apiClient } from './apiClient';

export interface GlobalSearchResults {
  patients: Array<{ id: string; firstName: string; lastName: string; phone: string }>;
  doctors: Array<{ id: string; name: string; specialization: string; departmentName: string }>;
}

/** Global search across patients and doctors (used by the navbar search). */
export const searchService = {
  async searchAll(query: string): Promise<GlobalSearchResults> {
    const q = query.trim();
    if (!q) return { patients: [], doctors: [] };
    return apiClient.get<GlobalSearchResults>(`/search?q=${encodeURIComponent(q)}`);
  },
};
