import { CHART_COLORS } from '@/constants';
import { dateFromToday } from '@/utils/date';

/* Monthly series used by the Reports module. Values are plausible
   operating figures for a mid-size Ghanaian hospital. */

const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const YEAR_MONTHS = [
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
];

export interface MonthlyPoint {
  month: string;
  [key: string]: string | number;
}

export const PATIENT_REGISTRATIONS_MONTHLY: MonthlyPoint[] = [
  { month: 'Mar', new: 62, returning: 118 },
  { month: 'Apr', new: 58, returning: 124 },
  { month: 'May', new: 71, returning: 131 },
  { month: 'Jun', new: 66, returning: 142 },
  { month: 'Jul', new: 79, returning: 156 },
  { month: 'Aug', new: 84, returning: 169 },
];

export const REVENUE_MONTHLY: MonthlyPoint[] = [
  { month: 'Mar', revenue: 286400, expenses: 198200 },
  { month: 'Apr', revenue: 301750, expenses: 205400 },
  { month: 'May', revenue: 318900, expenses: 211600 },
  { month: 'Jun', revenue: 297300, expenses: 209800 },
  { month: 'Jul', revenue: 342600, expenses: 217300 },
  { month: 'Aug', revenue: 365200, expenses: 224100 },
];

export const APPOINTMENTS_MONTHLY: MonthlyPoint[] = [
  { month: 'Mar', completed: 612, cancelled: 41 },
  { month: 'Apr', completed: 638, cancelled: 47 },
  { month: 'May', completed: 665, cancelled: 52 },
  { month: 'Jun', completed: 649, cancelled: 39 },
  { month: 'Jul', completed: 702, cancelled: 46 },
  { month: 'Aug', completed: 731, cancelled: 44 },
];

export const DEPARTMENT_PERFORMANCE = [
  { department: 'General Medicine', patients: 284, appointments: 312, revenue: 38400 },
  { department: 'Pediatrics', patients: 198, appointments: 246, revenue: 27100 },
  { department: 'Emergency', patients: 412, appointments: 430, revenue: 61200 },
  { department: 'Cardiology', patients: 132, appointments: 158, revenue: 34200 },
  { department: 'Maternity', patients: 167, appointments: 198, revenue: 52400 },
  { department: 'Surgery', patients: 121, appointments: 96, revenue: 46800 },
  { department: 'Neurology', patients: 96, appointments: 112, revenue: 21800 },
  { department: 'Radiology', patients: 88, appointments: 134, revenue: 19500 },
];

export const PHARMACY_SALES = [
  { category: 'Antimalarial', sales: 41200 },
  { category: 'Antibiotic', sales: 38600 },
  { category: 'Analgesic', sales: 24100 },
  { category: 'Antihypertensive', sales: 28700 },
  { category: 'Antidiabetic', sales: 31200 },
  { category: 'Vitamins & Supplements', sales: 16300 },
  { category: 'Cardiovascular', sales: 19800 },
  { category: 'Respiratory', sales: 14200 },
  { category: 'Gastrointestinal', sales: 12800 },
  { category: 'Other', sales: 9400 },
];

export const LAB_TESTS_MONTHLY: MonthlyPoint[] = [
  { month: 'Mar', requested: 284, completed: 256 },
  { month: 'Apr', requested: 302, completed: 278 },
  { month: 'May', requested: 318, completed: 291 },
  { month: 'Jun', requested: 296, completed: 268 },
  { month: 'Jul', requested: 335, completed: 305 },
  { month: 'Aug', requested: 352, completed: 322 },
];

/* ------------------------- Period-scoped report data ------------------------ */

export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface ReportDataset {
  period: ReportPeriod;
  label: string;
  kpis: {
    newPatients: number;
    appointments: number;
    revenue: number;
    testsCompleted: number;
    avgWaitMinutes: number;
    bedOccupancy: number;
  };
  patientRegistrations: MonthlyPoint[];
  appointments: MonthlyPoint[];
  revenue: MonthlyPoint[];
  departmentPerformance: typeof DEPARTMENT_PERFORMANCE;
  pharmacySales: typeof PHARMACY_SALES;
  labTests: MonthlyPoint[];
}

const round = (n: number) => Math.max(1, Math.round(n));

function scaledPoints(points: MonthlyPoint[], keys: string[], scale: number): MonthlyPoint[] {
  return points.map((p) => {
    const next: MonthlyPoint = { month: p.month };
    for (const k of keys) next[k] = round(Number(p[k]) * scale);
    return next;
  });
}

const monthName = (offset: number) =>
  new Date(dateFromToday(offset)).toLocaleDateString('en-GB', { month: 'short' });

export function getReportData(period: ReportPeriod, customStart?: string, customEnd?: string): ReportDataset {
  const label =
    period === 'today'
      ? 'Today'
      : period === 'week'
        ? 'This week'
        : period === 'month'
          ? 'This month'
          : period === 'year'
            ? 'This year'
            : 'Custom range';

  /* Scale factors relative to a "typical month" */
  const scale =
    period === 'today' ? 1 / 22 : period === 'week' ? 1 / 4.3 : period === 'month' ? 1 : period === 'year' ? 12 : 1;

  let customScale = scale;
  if (period === 'custom' && customStart && customEnd) {
    const days = Math.max(1, (new Date(customEnd).getTime() - new Date(customStart).getTime()) / 86400000);
    customScale = days / 30;
  }
  const s = period === 'custom' ? customScale : scale;

  const patientRegistrations = scaledPoints(PATIENT_REGISTRATIONS_MONTHLY, ['new', 'returning'], s);
  const appointments = scaledPoints(APPOINTMENTS_MONTHLY, ['completed', 'cancelled'], s);
  const revenue = scaledPoints(REVENUE_MONTHLY, ['revenue', 'expenses'], s);
  const labTests = scaledPoints(LAB_TESTS_MONTHLY, ['requested', 'completed'], s);

  const deptScale = period === 'year' ? 12 : s;
  const departmentPerformance = DEPARTMENT_PERFORMANCE.map((d) => ({
    ...d,
    patients: round(d.patients * deptScale),
    appointments: round(d.appointments * deptScale),
    revenue: round(d.revenue * deptScale),
  }));
  const pharmacySales = PHARMACY_SALES.map((d) => ({
    ...d,
    sales: round(d.sales * (period === 'year' ? 12 : s)),
  }));

  const monthlyScale = period === 'year' ? 1 : s;
  const regs = PATIENT_REGISTRATIONS_MONTHLY.reduce((a, p) => a + Number(p.new) + Number(p.returning), 0) * monthlyScale;

  return {
    period,
    label,
    kpis: {
      newPatients: round(regs * 0.34),
      appointments: round(APPOINTMENTS_MONTHLY.reduce((a, p) => a + Number(p.completed), 0) * monthlyScale),
      revenue: round(REVENUE_MONTHLY.reduce((a, p) => a + Number(p.revenue), 0) * monthlyScale),
      testsCompleted: round(LAB_TESTS_MONTHLY.reduce((a, p) => a + Number(p.completed), 0) * monthlyScale),
      avgWaitMinutes: 18 + Math.round(10 * Math.random()),
      bedOccupancy: 74 + Math.round(8 * Math.random()),
    },
    patientRegistrations,
    appointments,
    revenue,
    departmentPerformance,
    pharmacySales,
    labTests,
  };
}

/** Chart palette entry per series name — keeps tooltips/legends in sync. */
export function seriesColor(key: string): string {
  switch (key) {
    case 'new':
    case 'completed':
    case 'revenue':
    case 'sales':
    case 'patients':
      return CHART_COLORS.teal;
    case 'returning':
    case 'cancelled':
    case 'requested':
    case 'expenses':
    case 'appointments':
      return CHART_COLORS.blue;
    default:
      return CHART_COLORS.violet;
  }
}

export { MONTHS, YEAR_MONTHS, monthName };
