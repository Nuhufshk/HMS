import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarDays,
  ClipboardPlus,
  FileText,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  Pill,
  Receipt,
  Settings,
  Stethoscope,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

const ALL: UserRole[] = [
  'admin',
  'doctor',
  'nurse',
  'receptionist',
  'pharmacist',
  'lab_technician',
  'accountant',
];

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ALL }],
  },
  {
    label: 'Clinical',
    items: [
      {
        label: 'Patients',
        path: '/patients',
        icon: Users,
        roles: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician'],
      },
      {
        label: 'Appointments',
        path: '/appointments',
        icon: CalendarDays,
        roles: ['admin', 'doctor', 'nurse', 'receptionist'],
      },
      {
        label: 'Doctors',
        path: '/doctors',
        icon: Stethoscope,
        roles: ['admin'],
      },
      {
        label: 'Nurses',
        path: '/nurses',
        icon: HeartPulse,
        roles: ['admin'],
      },
      {
        label: 'Departments',
        path: '/departments',
        icon: Building2,
        roles: ['admin'],
      },
      {
        label: 'Medical Records',
        path: '/medical-records',
        icon: FileText,
        roles: ['admin', 'doctor', 'nurse'],
      },
      {
        label: 'Prescriptions',
        path: '/prescriptions',
        icon: ClipboardPlus,
        roles: ['admin', 'doctor', 'pharmacist'],
      },
      {
        label: 'Laboratory',
        path: '/laboratory',
        icon: FlaskConical,
        roles: ['admin', 'doctor', 'lab_technician'],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Pharmacy',
        path: '/pharmacy',
        icon: Pill,
        roles: ['admin', 'pharmacist'],
      },
      {
        label: 'Billing',
        path: '/billing',
        icon: Receipt,
        roles: ['admin', 'receptionist', 'accountant'],
      },
      {
        label: 'Bed Management',
        path: '/bed-management',
        icon: BedDouble,
        roles: ['admin', 'doctor', 'nurse', 'receptionist'],
      },
      {
        label: 'Reports',
        path: '/reports',
        icon: BarChart3,
        roles: ['admin', 'doctor', 'accountant'],
      },
      {
        label: 'Staff',
        path: '/staff',
        icon: UserCog,
        roles: ['admin'],
      },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Profile', path: '/profile', icon: UserRound, roles: ALL },
      { label: 'Settings', path: '/settings', icon: Settings, roles: ALL },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export const DEFAULT_ROLE: UserRole = 'admin';

/** Roles allowed to access a given pathname (detail routes inherit their list route). */
export function rolesForPath(pathname: string): UserRole[] {
  const exact = ALL_NAV_ITEMS.find((i) => i.path === pathname);
  if (exact) return exact.roles;
  const parent = ALL_NAV_ITEMS.find((i) => pathname.startsWith(`${i.path}/`));
  return parent ? parent.roles : ALL;
}

export function canAccess(role: UserRole, pathname: string): boolean {
  return rolesForPath(pathname).includes(role);
}

/** Navigation items visible to a given role. */
export function navItemsForRole(role: UserRole): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((i) => i.roles.includes(role)),
  })).filter((s) => s.items.length > 0);
}
