import type { Patient } from '../../types';

export function validateCreateInput(body: unknown): Partial<Patient> {
  return (body ?? {}) as Partial<Patient>;
}

export function validateRequiredFields(body: Partial<Patient>): string | null {
  if (!body.firstName || !body.lastName || !body.dateOfBirth || !body.gender || !body.phone) {
    return 'First name, last name, date of birth, gender and phone are required.';
  }
  return null;
}
