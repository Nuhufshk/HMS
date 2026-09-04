import type { Nurse } from '../../types';

export function validateCreateInput(body: unknown): Partial<Nurse> {
  return (body ?? {}) as Partial<Nurse>;
}
