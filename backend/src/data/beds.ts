import type { Bed } from '../types';

/** Beds grouped by ward. `status` is the live state; occupied beds also
 *  have an active assignment in db.bedAssignments (see store.ts). */
export const MOCK_BEDS: Bed[] = [
  /* General Ward 1C */
  { id: 'BD-001', number: 'G-101', wardId: 'W-GEN', type: 'General', status: 'occupied', ratePerDay: 220 },
  { id: 'BD-002', number: 'G-102', wardId: 'W-GEN', type: 'General', status: 'occupied', ratePerDay: 220 },
  { id: 'BD-003', number: 'G-103', wardId: 'W-GEN', type: 'General', status: 'available', ratePerDay: 220 },
  { id: 'BD-004', number: 'G-104', wardId: 'W-GEN', type: 'General', status: 'available', ratePerDay: 220 },
  { id: 'BD-005', number: 'G-105', wardId: 'W-GEN', type: 'General', status: 'maintenance', ratePerDay: 220 },

  /* Maternity Ward 2A */
  { id: 'BD-006', number: 'M-201', wardId: 'W-MAT', type: 'Maternity', status: 'occupied', ratePerDay: 260 },
  { id: 'BD-007', number: 'M-202', wardId: 'W-MAT', type: 'Maternity', status: 'available', ratePerDay: 260 },
  { id: 'BD-008', number: 'M-203', wardId: 'W-MAT', type: 'Maternity', status: 'available', ratePerDay: 260 },

  /* Postnatal Ward 2B */
  { id: 'BD-009', number: 'M-204', wardId: 'W-POST', type: 'Maternity', status: 'occupied', ratePerDay: 240 },

  /* Paediatric Ward 1B */
  { id: 'BD-010', number: 'P-112', wardId: 'W-PED', type: 'Paediatric', status: 'available', ratePerDay: 200 },
  { id: 'BD-011', number: 'P-113', wardId: 'W-PED', type: 'Paediatric', status: 'occupied', ratePerDay: 200 },

  /* Surgical Ward 3B */
  { id: 'BD-012', number: 'S-301', wardId: 'W-SUR', type: 'Surgical', status: 'occupied', ratePerDay: 280 },
  { id: 'BD-013', number: 'S-302', wardId: 'W-SUR', type: 'Surgical', status: 'available', ratePerDay: 280 },
  { id: 'BD-014', number: 'S-303', wardId: 'W-SUR', type: 'Surgical', status: 'maintenance', ratePerDay: 280 },

  /* Emergency Bay */
  { id: 'BD-015', number: 'E-01', wardId: 'W-EMER', type: 'Emergency', status: 'available', ratePerDay: 300 },
  { id: 'BD-016', number: 'E-02', wardId: 'W-EMER', type: 'Emergency', status: 'available', ratePerDay: 300 },

  /* Cardiology Unit */
  { id: 'BD-017', number: 'C-401', wardId: 'W-CAR', type: 'General', status: 'occupied', ratePerDay: 320 },
  { id: 'BD-018', number: 'C-402', wardId: 'W-CAR', type: 'General', status: 'available', ratePerDay: 320 },

  /* Intensive Care Unit */
  { id: 'BD-019', number: 'ICU-1', wardId: 'W-ICU', type: 'ICU', status: 'occupied', ratePerDay: 600 },
  { id: 'BD-020', number: 'ICU-2', wardId: 'W-ICU', type: 'ICU', status: 'available', ratePerDay: 600 },

  /* Neurology Ward */
  { id: 'BD-021', number: 'N-501', wardId: 'W-NEU', type: 'General', status: 'available', ratePerDay: 240 },
  { id: 'BD-022', number: 'N-502', wardId: 'W-NEU', type: 'General', status: 'maintenance', ratePerDay: 240 },

  /* Private Wing */
  { id: 'BD-023', number: 'PR-601', wardId: 'W-PRI', type: 'Private', status: 'available', ratePerDay: 500 },
  { id: 'BD-024', number: 'PR-602', wardId: 'W-PRI', type: 'Private', status: 'available', ratePerDay: 500 },
];
