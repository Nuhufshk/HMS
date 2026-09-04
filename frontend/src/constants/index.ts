import type { UserRole } from '@/types';

/* ------------------------------- App --------------------------------- */

export const APP_NAME = 'Adom Medical Centre';

export const HOSPITAL = {
  name: APP_NAME,
  tagline: 'Care you can trust',
  address: '12 Ring Road Central, Accra',
  phone: '+233 30 276 1234',
  emergencyPhone: '+233 30 276 1999',
  email: 'info@adommedicalcentre.gh',
  website: 'www.adommedicalcentre.gh',
  registration: 'HMIS/2021/1187',
  nhisProviderCode: 'NHIS-AMC-042',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  pharmacist: 'Pharmacist',
  lab_technician: 'Laboratory Technician',
  accountant: 'Accountant',
};

export const ALL_ROLES: UserRole[] = [
  'admin',
  'doctor',
  'nurse',
  'receptionist',
  'pharmacist',
  'lab_technician',
  'accountant',
];

/* ------------------------- Chart color palette ---------------------- */
/* Shared by every chart so series colors stay consistent.               */
export const CHART_COLORS = {
  teal: '#10B878',
  blue: '#3B82F6',
  violet: '#8B5CF6',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#EF4444',
} as const;

export const CHART_SERIES = [
  CHART_COLORS.teal,
  CHART_COLORS.blue,
  CHART_COLORS.violet,
  CHART_COLORS.green,
  CHART_COLORS.amber,
] as const;
