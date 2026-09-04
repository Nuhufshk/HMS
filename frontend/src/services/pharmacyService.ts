import { apiClient } from './apiClient';
import type { Medicine, MedicineInput, StockAlertSummary } from '@/types';

export interface MedicineDetail extends Medicine {
  daysToExpiry: number;
}

export const pharmacyService = {
  async getMedicines(): Promise<MedicineDetail[]> {
    return apiClient.get<MedicineDetail[]>('/medicines');
  },

  async getMedicineById(id: string): Promise<MedicineDetail> {
    return apiClient.get<MedicineDetail>(`/medicines/${id}`);
  },

  async createMedicine(input: MedicineInput): Promise<Medicine> {
    return apiClient.post<Medicine>('/medicines', input);
  },

  async updateMedicine(id: string, patch: Partial<MedicineInput>): Promise<Medicine> {
    return apiClient.patch<Medicine>(`/medicines/${id}`, patch);
  },

  /** Restock or deplete a medicine (used when dispensing). */
  async adjustStock(id: string, delta: number): Promise<Medicine> {
    return apiClient.patch<Medicine>(`/medicines/${id}/stock`, { delta });
  },

  async getStockAlerts(): Promise<StockAlertSummary> {
    const medicines = await this.getMedicines();
    return {
      outOfStock: medicines.filter((m) => m.status === 'out_of_stock'),
      lowStock: medicines.filter((m) => m.status === 'low_stock'),
      expiringSoon: medicines.filter((m) => m.daysToExpiry > 0 && m.daysToExpiry <= 60),
      expired: medicines.filter((m) => m.status === 'expired'),
    };
  },

  getCategories(): string[] {
    // Kept for interface parity — categories come from the catalogue constant.
    return [];
  },
};
