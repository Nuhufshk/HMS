import type { BedAssignment } from '../types';
import { dateTimeFromToday } from '../utils/date';

/** Assignment ledger (audit/history). Active rows have releasedAt === null. */
export const MOCK_BED_ASSIGNMENTS: BedAssignment[] = [
  /* Active admissions */
  { id: 'BA-9001', bedId: 'BD-001', patientId: 'PT-1013', assignedAt: dateTimeFromToday(-6, 14, 20), releasedAt: null, notes: 'Admitted for hypertension monitoring.' },
  { id: 'BA-9002', bedId: 'BD-002', patientId: 'PT-1025', assignedAt: dateTimeFromToday(-3, 10, 5), releasedAt: null, notes: 'Post-observation, diabetic care.' },
  { id: 'BA-9003', bedId: 'BD-006', patientId: 'PT-1004', assignedAt: dateTimeFromToday(-2, 18, 40), releasedAt: null },
  { id: 'BA-9004', bedId: 'BD-009', patientId: 'PT-1002', assignedAt: dateTimeFromToday(-1, 9, 15), releasedAt: null, notes: 'Postnatal care.' },
  { id: 'BA-9005', bedId: 'BD-011', patientId: 'PT-1014', assignedAt: dateTimeFromToday(-4, 16, 55), releasedAt: null },
  { id: 'BA-9006', bedId: 'BD-012', patientId: 'PT-1005', assignedAt: dateTimeFromToday(-5, 11, 30), releasedAt: null, notes: 'Awaiting discharge review.' },
  { id: 'BA-9007', bedId: 'BD-017', patientId: 'PT-1001', assignedAt: dateTimeFromToday(-2, 21, 10), releasedAt: null, notes: 'Chest pain observation.' },
  { id: 'BA-9008', bedId: 'BD-019', patientId: 'PT-1003', assignedAt: dateTimeFromToday(0, 7, 45), releasedAt: null, notes: 'ICU — intensive monitoring.' },

  /* Historical (released) admissions */
  { id: 'BA-8080', bedId: 'BD-003', patientId: 'PT-1006', assignedAt: dateTimeFromToday(-12, 8, 0), releasedAt: dateTimeFromToday(-8, 16, 0), notes: 'Discharged in stable condition.' },
  { id: 'BA-8081', bedId: 'BD-007', patientId: 'PT-1007', assignedAt: dateTimeFromToday(-9, 13, 20), releasedAt: dateTimeFromToday(-6, 10, 35) },
  { id: 'BA-8082', bedId: 'BD-013', patientId: 'PT-1008', assignedAt: dateTimeFromToday(-15, 9, 10), releasedAt: dateTimeFromToday(-10, 12, 45), notes: 'Post-surgical recovery complete.' },
];
