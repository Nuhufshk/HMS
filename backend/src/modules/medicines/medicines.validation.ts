import type { MedicineInput } from '../../types';

export function validateCreateInput(body: unknown): MedicineInput {
  return (body ?? {}) as MedicineInput;
}
