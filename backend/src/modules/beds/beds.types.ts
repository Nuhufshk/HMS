import type { BedInput, BedStatus, BedType } from '../../types';

export type BedCreateInput = BedInput;
export type BedUpdateInput = Partial<BedInput>;

export const VALID_STATUSES: BedStatus[] = ['available', 'occupied', 'maintenance'];
export const VALID_TYPES: BedType[] = ['General', 'Private', 'ICU', 'Maternity', 'Surgical', 'Paediatric', 'Emergency'];

export interface BedListQuery {
  status?: string;
  wardId?: string;
  type?: string;
}

export interface AssignInput {
  patientId?: string;
  notes?: string;
}

export interface TransferInput {
  toBedId?: string;
  notes?: string;
}
