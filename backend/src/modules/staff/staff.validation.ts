import type { Staff } from '../../types';

export function validateCreateInput(body: unknown): Partial<Staff> {
  return (body ?? {}) as Partial<Staff>;
}
