import type { LabResultInput, LabStatus } from '../../types';

export type LabCreateInput = Record<string, unknown>;
export type LabResultUpdateInput = LabResultInput;

export const VALID_STATUSES: LabStatus[] = ['requested', 'collected', 'processing', 'completed'];
