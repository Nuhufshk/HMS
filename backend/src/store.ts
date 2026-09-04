import { MOCK_PATIENTS } from './data/patients';
import { MOCK_DOCTORS } from './data/doctors';
import { MOCK_NURSES } from './data/nurses';
import { MOCK_DEPARTMENTS } from './data/departments';
import { MOCK_APPOINTMENTS } from './data/appointments';
import { MOCK_PRESCRIPTIONS } from './data/prescriptions';
import { MOCK_MEDICINES } from './data/medicines';
import { MOCK_LAB_TESTS } from './data/labTests';
import { MOCK_MEDICAL_RECORDS } from './data/medicalRecords';
import { MOCK_INVOICES } from './data/invoices';
import { MOCK_STAFF } from './data/staff';
import { MOCK_NOTIFICATIONS } from './data/notifications';
import { MOCK_USERS } from './data/users';
import { MOCK_BEDS } from './data/beds';
import { MOCK_BED_ASSIGNMENTS } from './data/bedAssignments';
import { MOCK_WARDS } from './data/wards';
import { daysUntil, dateFromToday, weekdayShort, monthShort } from './utils/date';
import type {
  Appointment,
  Bed,
  BedAssignment,
  Doctor,
  EnrichedAppointment,
  EnrichedBed,
  EnrichedBedAssignment,
  EnrichedInvoice,
  EnrichedLabTest,
  EnrichedMedicalRecord,
  EnrichedPrescription,
  Invoice,
  LabTest,
  MedicalRecord,
  Medicine,
  Nurse,
  Patient,
  Prescription,
  Staff,
  User,
  Ward,
  WardStats,
} from './types';

/**
 * In-memory database, seeded from the demo datasets.
 * Replace with a real database (PostgreSQL/Prisma, MongoDB, …) behind the same routes.
 */
export const db = {
  users: [...MOCK_USERS] as User[],
  patients: [...MOCK_PATIENTS] as Patient[],
  doctors: [...MOCK_DOCTORS] as Doctor[],
  nurses: [...MOCK_NURSES] as Nurse[],
  departments: [...MOCK_DEPARTMENTS],
  appointments: [...MOCK_APPOINTMENTS] as Appointment[],
  prescriptions: [...MOCK_PRESCRIPTIONS] as Prescription[],
  medicines: [...MOCK_MEDICINES] as Medicine[],
  labTests: [...MOCK_LAB_TESTS] as LabTest[],
  medicalRecords: [...MOCK_MEDICAL_RECORDS] as MedicalRecord[],
  invoices: [...MOCK_INVOICES] as Invoice[],
  staff: [...MOCK_STAFF] as Staff[],
  notifications: [...MOCK_NOTIFICATIONS],
  beds: [...MOCK_BEDS] as Bed[],
  bedAssignments: [...MOCK_BED_ASSIGNMENTS] as BedAssignment[],
  wards: [...MOCK_WARDS] as Ward[],
};

/** Next sequential ID for a store (e.g. nextId('PT-', db.patients)). */
export function nextId(prefix: string, list: Array<{ id: string }>): string {
  const max = list.reduce((acc, item) => {
    const n = parseInt(item.id.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `${prefix}${max + 1}`;
}

/* ------------------------------ Enrichment ------------------------------ */

export function enrichAppointments(list: Appointment[]): EnrichedAppointment[] {
  return list
    .map((a) => {
      const patient = db.patients.find((p) => p.id === a.patientId);
      const doctor = db.doctors.find((d) => d.id === a.doctorId);
      const dept = db.departments.find((d) => d.id === a.departmentId);
      return {
        ...a,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown patient',
        doctorName: doctor?.name ?? 'Unassigned',
        departmentName: dept?.name ?? '—',
      };
    })
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

export function enrichPrescriptions(list: Prescription[]): EnrichedPrescription[] {
  return list
    .map((p) => ({
      ...p,
      patientName: db.patients.find((x) => x.id === p.patientId)
        ? `${db.patients.find((x) => x.id === p.patientId)!.firstName} ${db.patients.find((x) => x.id === p.patientId)!.lastName}`
        : 'Unknown patient',
      doctorName: db.doctors.find((d) => d.id === p.doctorId)?.name ?? 'Unknown doctor',
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function enrichLabTests(list: LabTest[]): EnrichedLabTest[] {
  return list
    .map((t) => ({
      ...t,
      patientName: db.patients.find((p) => p.id === t.patientId)
        ? `${db.patients.find((p) => p.id === t.patientId)!.firstName} ${db.patients.find((p) => p.id === t.patientId)!.lastName}`
        : 'Unknown patient',
      doctorName: db.doctors.find((d) => d.id === t.doctorId)?.name ?? 'Unknown doctor',
    }))
    .sort((a, b) => b.orderedDate.localeCompare(a.orderedDate));
}

export function enrichRecords(list: MedicalRecord[]): EnrichedMedicalRecord[] {
  return list
    .map((r) => ({
      ...r,
      doctorName: db.doctors.find((d) => d.id === r.doctorId)?.name ?? 'Unknown doctor',
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function enrichBeds(list: Bed[]): EnrichedBed[] {
  return list.map((bed) => {
    const active = db.bedAssignments.find((a) => a.bedId === bed.id && a.releasedAt === null);
    const patient = active ? db.patients.find((p) => p.id === active.patientId) : null;
    return {
      ...bed,
      wardName: db.wards.find((w) => w.id === bed.wardId)?.name ?? '—',
      patientId: active ? active.patientId : null,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : null,
      occupiedSince: active ? active.assignedAt : null,
    };
  });
}

export function enrichBedAssignments(list: BedAssignment[]): EnrichedBedAssignment[] {
  return list
    .map((a) => {
      const bed = db.beds.find((b) => b.id === a.bedId);
      const patient = db.patients.find((p) => p.id === a.patientId);
      return {
        ...a,
        bedNumber: bed?.number ?? '—',
        wardName: bed ? (db.wards.find((w) => w.id === bed.wardId)?.name ?? '—') : '—',
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown patient',
      };
    })
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
}

export function wardStats(list: Ward[]): WardStats[] {
  return list.map((ward) => {
    const beds = db.beds.filter((b) => b.wardId === ward.id);
    const occupied = beds.filter((b) => b.status === 'occupied').length;
    return {
      ...ward,
      totalBeds: beds.length,
      occupied,
      occupancyRate: beds.length ? Math.round((occupied / beds.length) * 100) : 0,
    };
  });
}

export function withDoctorStats(doctor: Doctor) {
  const dept = db.departments.find((d) => d.id === doctor.departmentId);
  return {
    ...doctor,
    departmentName: dept?.name ?? '—',
    patientsCount: db.patients.filter((p) => p.assignedDoctorId === doctor.id).length,
  };
}

export function withNurseDept(nurse: Nurse) {
  return {
    ...nurse,
    departmentName: db.departments.find((d) => d.id === nurse.departmentId)?.name ?? '—',
  };
}

export function medicineDetail(m: Medicine) {
  return { ...m, daysToExpiry: daysUntil(m.expiryDate) };
}

export function deriveMedicineStatus(m: Pick<Medicine, 'quantity' | 'reorderLevel' | 'expiryDate'>): Medicine['status'] {
  if (daysUntil(m.expiryDate) <= 0) return 'expired';
  if (m.quantity <= 0) return 'out_of_stock';
  if (m.quantity <= m.reorderLevel) return 'low_stock';
  return 'in_stock';
}

export function paidAmount(invoice: Invoice): number {
  return invoice.payments.reduce((sum, p) => sum + p.amount, 0);
}

function invoiceStatus(invoice: Invoice): Invoice['status'] {
  const paid = paidAmount(invoice);
  if (paid >= invoice.total - 0.005) return 'paid';
  if (paid > 0) return 'partial';
  if (daysUntil(invoice.dueDate) < 0) return 'overdue';
  return 'pending';
}

export function enrichInvoices(list: Invoice[]): EnrichedInvoice[] {
  return list
    .map((inv) => {
      const patient = db.patients.find((p) => p.id === inv.patientId);
      const paid = paidAmount(inv);
      return {
        ...inv,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown patient',
        paidAmount: paid,
        balance: Math.max(0, inv.total - paid),
        status: invoiceStatus(inv),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function computeInvoiceTotals(input: {
  items: Invoice['items'];
  discount: number;
  insuranceCoverage: number;
}): { subtotal: number; discount: number; insuranceCoverage: number; total: number } {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = Math.min(input.discount, subtotal);
  const afterDiscount = subtotal - discount;
  const insuranceCoverage = Math.min(input.insuranceCoverage, afterDiscount);
  const total = Math.max(0, afterDiscount - insuranceCoverage);
  return { subtotal, discount, insuranceCoverage, total };
}

/** 7-day appointment trend (used by the dashboard chart). */
export function appointmentTrend() {
  const days: Array<{ day: string; label: string; scheduled: number; completed: number; cancelled: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = dateFromToday(-i);
    const list = db.appointments.filter((a) => a.date === date);
    days.push({
      day: date,
      label: `${weekdayShort(date)} ${monthShort(date).replace('.', '')}`,
      scheduled: list.filter((a) => a.status === 'scheduled' || a.status === 'waiting' || a.status === 'in_progress').length,
      completed: list.filter((a) => a.status === 'completed').length,
      cancelled: list.filter((a) => a.status === 'cancelled').length,
    });
  }
  return days;
}
