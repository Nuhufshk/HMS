import type { Patient } from '../../types';

export type PatientCreateInput = Pick<Patient,
  'firstName' | 'lastName' | 'dateOfBirth' | 'gender' | 'phone'
> & Partial<Patient>;

export type PatientUpdateInput = Partial<Patient>;

export interface PatientListQuery {
  q?: string;
  doctorId?: string;
  limit?: number;
}
