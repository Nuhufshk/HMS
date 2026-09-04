import type { Ward } from '../types';

export const MOCK_WARDS: Ward[] = [
  { id: 'W-GEN', name: 'General Ward 1C', location: 'Ground Floor, Block A', departmentId: 'GEN' },
  { id: 'W-MAT', name: 'Maternity Ward 2A', location: 'First Floor, Block A', departmentId: 'MAT' },
  { id: 'W-POST', name: 'Postnatal Ward 2B', location: 'First Floor, Block A', departmentId: 'MAT' },
  { id: 'W-PED', name: 'Paediatric Ward 1B', location: 'First Floor, Block B', departmentId: 'PED' },
  { id: 'W-SUR', name: 'Surgical Ward 3B', location: 'Third Floor, Block A', departmentId: 'SUR' },
  { id: 'W-EMER', name: 'Emergency Bay', location: 'Ground Floor, Main Entrance', departmentId: 'EME' },
  { id: 'W-CAR', name: 'Cardiology Unit', location: 'Second Floor, Block A', departmentId: 'CAR' },
  { id: 'W-ICU', name: 'Intensive Care Unit', location: 'Second Floor, Block B', departmentId: 'SUR' },
  { id: 'W-NEU', name: 'Neurology Ward', location: 'Second Floor, Block B', departmentId: 'NEU' },
  { id: 'W-PRI', name: 'Private Wing', location: 'Fourth Floor, Block A', departmentId: 'GEN' },
];
