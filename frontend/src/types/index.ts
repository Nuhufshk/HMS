/* ------------------------------------------------------------------ */
/* Core domain models for the Hospital Management System.              */
/* All statuses are strongly-typed unions — never arbitrary strings.   */
/* ------------------------------------------------------------------ */

export type UserRole =
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'pharmacist'
  | 'lab_technician'
  | 'accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  /** Demo only — replace with server-side auth in production. */
  password: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  phone: string;
  title?: string;
}

/* ------------------------------- Patients -------------------------- */

export type Gender = 'Male' | 'Female';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Genotype = 'AA' | 'AS' | 'SS' | 'AC';

export type PatientStatus = 'active' | 'inactive' | 'admitted' | 'discharged';
export type PatientType = 'new' | 'returning';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Insurance {
  provider: string;
  number: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  city: string;
  nationality: string;
  bloodGroup: BloodGroup;
  genotype: Genotype;
  allergies: string[];
  conditions: string[];
  emergencyContact: EmergencyContact;
  insurance: Insurance | null;
  registrationDate: string; // ISO date
  assignedDoctorId: string | null;
  status: PatientStatus;
  type: PatientType;
}

export type PatientInput = Omit<Patient, 'id' | 'status' | 'type'> & {
  status?: PatientStatus;
  type?: PatientType;
};

/* ------------------------------- Doctors --------------------------- */

export type DoctorStatus = 'active' | 'inactive' | 'on_leave';
export type DoctorAvailability = 'available' | 'busy' | 'away';

export interface DoctorScheduleDay {
  day: string;
  hours: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  departmentId: string;
  phone: string;
  email: string;
  status: DoctorStatus;
  availability: DoctorAvailability;
  joinedDate: string; // ISO date
  schedule: DoctorScheduleDay[];
  about: string;
}

export type DoctorInput = Omit<Doctor, 'id'>;

/* ------------------------------- Nurses ---------------------------- */

export type NurseStatus = 'active' | 'inactive';
export type Shift = 'Morning' | 'Afternoon' | 'Night' | 'Rotating';

export interface Nurse {
  id: string;
  name: string;
  departmentId: string;
  phone: string;
  email: string;
  shift: Shift;
  ward: string;
  status: NurseStatus;
  joinedDate: string; // ISO date
}

export type NurseInput = Omit<Nurse, 'id'>;

/* ---------------------------- Departments -------------------------- */

export interface Department {
  id: string;
  name: string;
  code: string;
  headName: string;
  headId: string;
  doctors: number;
  nurses: number;
  patients: number;
  status: 'active' | 'inactive';
  location: string;
  phone: string;
  description: string;
}

/* ---------------------------- Appointments ------------------------- */

export type AppointmentStatus =
  | 'scheduled'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type AppointmentType =
  | 'Consultation'
  | 'Follow-up'
  | 'Check-up'
  | 'Emergency'
  | 'Procedure'
  | 'Maternity'
  | 'Physiotherapy'
  | 'Review';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
}

export type AppointmentInput = Omit<Appointment, 'id'>;

export interface EnrichedAppointment extends Appointment {
  patientName: string;
  doctorName: string;
  departmentName: string;
}

/* ---------------------------- Prescriptions ------------------------ */

export type PrescriptionStatus = 'active' | 'dispensed' | 'completed' | 'cancelled';

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  diagnosis: string;
  medications: PrescriptionMedication[];
  status: PrescriptionStatus;
  notes?: string;
}

export type PrescriptionInput = Omit<Prescription, 'id' | 'status'> & {
  status?: PrescriptionStatus;
};

export interface EnrichedPrescription extends Prescription {
  patientName: string;
  doctorName: string;
}

/* ------------------------------ Pharmacy --------------------------- */

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';

export interface Medicine {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number; // GHS
  expiryDate: string; // YYYY-MM-DD
  supplier: string;
  status: StockStatus;
  batch: string;
}

export type MedicineInput = Omit<Medicine, 'id' | 'status'>;

export interface StockAlertSummary {
  outOfStock: Medicine[];
  lowStock: Medicine[];
  expiringSoon: Medicine[];
  expired: Medicine[];
}

/* ----------------------------- Laboratory -------------------------- */

export type LabStatus = 'requested' | 'collected' | 'processing' | 'completed';
export type LabPriority = 'routine' | 'urgent' | 'stat';

export interface LabTest {
  id: string;
  patientId: string;
  doctorId: string;
  testName: string;
  orderedDate: string; // ISO date
  sampleType: string;
  priority: LabPriority;
  status: LabStatus;
  result?: string;
  unit?: string;
  referenceRange?: string;
  notes?: string;
  abnormal?: boolean;
  collectedAt?: string;
  completedAt?: string;
}

export interface LabResultInput {
  result: string;
  unit?: string;
  referenceRange?: string;
  notes?: string;
  abnormal?: boolean;
}

export interface EnrichedLabTest extends LabTest {
  patientName: string;
  doctorName: string;
}

/* --------------------------- Medical records ----------------------- */

export type RecordType = 'diagnosis' | 'vitals' | 'treatment' | 'note' | 'history';

export interface VitalSigns {
  bloodPressure: string; // e.g. "120/80"
  heartRate: number; // bpm
  temperature: number; // °C
  respiratoryRate: number; // breaths/min
  oxygenSaturation: number; // %
  weight: number; // kg
  height: number; // cm
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // ISO datetime
  type: RecordType;
  title: string;
  description: string;
  diagnosis?: string;
  symptoms?: string[];
  treatmentPlan?: string;
  vitals?: VitalSigns;
  notes?: string;
}

export type MedicalRecordInput = Omit<MedicalRecord, 'id'>;

export interface EnrichedMedicalRecord extends MedicalRecord {
  doctorName: string;
}

/* ---------------------------- Bed management ----------------------- */

export type BedStatus = 'available' | 'occupied' | 'maintenance';
export type BedType = 'General' | 'Private' | 'ICU' | 'Maternity' | 'Surgical' | 'Paediatric' | 'Emergency';

export interface Ward {
  id: string;
  name: string;
  location: string;
  departmentId: string;
}

export interface WardInput {
  name: string;
  location: string;
  departmentId: string;
  totalBeds: number;
}

export interface WardStats extends Ward {
  totalBeds: number;
  occupied: number;
  occupancyRate: number; // 0–100
}

export interface Bed {
  id: string;
  number: string;
  wardId: string;
  type: BedType;
  status: BedStatus;
  ratePerDay: number; // GHS / night
}

export type BedInput = Omit<Bed, 'id'>;

export interface BedAssignment {
  id: string;
  bedId: string;
  patientId: string;
  assignedAt: string;
  releasedAt: string | null;
  notes?: string;
}

export interface EnrichedBed extends Bed {
  wardName: string;
  patientId: string | null;
  patientName: string | null;
  occupiedSince: string | null;
}

export interface EnrichedBedAssignment extends BedAssignment {
  bedNumber: string;
  wardName: string;
  patientName: string;
}

/* ------------------------------ Billing ---------------------------- */

export type InvoiceStatus = 'paid' | 'pending' | 'partial' | 'overdue';
export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Card' | 'Bank Transfer' | 'Insurance';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  date: string; // ISO date
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  date: string; // ISO date
  dueDate: string; // ISO date
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  insuranceCoverage: number;
  total: number;
  status: InvoiceStatus;
  payments: Payment[];
  issuedBy: string;
}

export interface InvoiceInput {
  patientId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  discount: number;
  insuranceCoverage: number;
}

export interface PaymentInput {
  amount: number;
  method: PaymentMethod;
  date?: string;
  reference?: string;
}

export interface EnrichedInvoice extends Invoice {
  patientName: string;
  paidAmount: number;
  balance: number;
}

/* ------------------------------- Staff ----------------------------- */

export type StaffStatus = 'active' | 'inactive';

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  status: StaffStatus;
  joinedDate: string; // ISO date
}

export type StaffInput = Omit<Staff, 'id'>;

/* --------------------------- Notifications ------------------------- */

export type NotificationType =
  | 'appointment'
  | 'lab'
  | 'pharmacy'
  | 'billing'
  | 'patient'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string; // ISO datetime
  read: boolean;
  link?: string;
}

/* ------------------------------ Activity --------------------------- */

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string; // ISO datetime
  user: string;
}
