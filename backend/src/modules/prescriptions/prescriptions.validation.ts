import type { PrescriptionInput } from '../../types';

export function validateCreateInput(body: unknown): PrescriptionInput {
  return (body ?? {}) as PrescriptionInput;
}
