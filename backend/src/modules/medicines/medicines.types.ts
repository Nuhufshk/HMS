import type { MedicineInput } from '../../types';

export type MedicineCreateInput = MedicineInput;
export type MedicineUpdateInput = Partial<MedicineInput & { id: string }>;

export interface StockDeltaInput {
  delta: number;
}
