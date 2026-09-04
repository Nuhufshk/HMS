import type { Doctor } from '../../types';

export function validateCreateInput(body: unknown): Partial<Doctor> {
  return (body ?? {}) as Partial<Doctor>;
}
