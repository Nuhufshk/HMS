import type { PrescriptionInput, PrescriptionStatus } from '../../types';

export type PrescriptionCreateInput = PrescriptionInput;

export const VALID_STATUSES = ['active', 'dispensed', 'completed', 'cancelled'] as const;
