import { pgTable, text, integer, real, boolean, timestamp, jsonb, varchar, pgEnum } from 'drizzle-orm/pg-core';

/* ────────────────────── Enums ────────────────────── */

export const userRoleEnum = pgEnum('user_role', [
  'admin', 'doctor', 'nurse', 'receptionist',
  'pharmacist', 'lab_technician', 'accountant',
]);

export const genderEnum = pgEnum('gender', ['Male', 'Female']);
export const bloodGroupEnum = pgEnum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
export const genotypeEnum = pgEnum('genotype', ['AA', 'AS', 'SS', 'AC']);
export const patientStatusEnum = pgEnum('patient_status', ['active', 'inactive', 'admitted', 'discharged']);
export const patientTypeEnum = pgEnum('patient_type', ['new', 'returning']);

export const doctorStatusEnum = pgEnum('doctor_status', ['active', 'inactive', 'on_leave']);
export const doctorAvailabilityEnum = pgEnum('doctor_availability', ['available', 'busy', 'away']);

export const nurseStatusEnum = pgEnum('nurse_status', ['active', 'inactive']);
export const shiftEnum = pgEnum('shift', ['Morning', 'Afternoon', 'Night', 'Rotating']);

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled', 'waiting', 'in_progress', 'completed', 'cancelled',
]);
export const appointmentTypeEnum = pgEnum('appointment_type', [
  'Consultation', 'Follow-up', 'Check-up', 'Emergency',
  'Procedure', 'Maternity', 'Physiotherapy', 'Review',
]);

export const prescriptionStatusEnum = pgEnum('prescription_status', ['active', 'dispensed', 'completed', 'cancelled']);
export const stockStatusEnum = pgEnum('stock_status', ['in_stock', 'low_stock', 'out_of_stock', 'expired']);
export const labStatusEnum = pgEnum('lab_status', ['requested', 'collected', 'processing', 'completed']);
export const labPriorityEnum = pgEnum('lab_priority', ['routine', 'urgent', 'stat']);
export const recordTypeEnum = pgEnum('record_type', ['diagnosis', 'vitals', 'treatment', 'note', 'history']);
export const bedStatusEnum = pgEnum('bed_status', ['available', 'occupied', 'maintenance']);
export const bedTypeEnum = pgEnum('bed_type', ['General', 'Private', 'ICU', 'Maternity', 'Surgical', 'Paediatric', 'Emergency']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['paid', 'pending', 'partial', 'overdue']);
export const paymentMethodEnum = pgEnum('payment_method', ['Cash', 'Mobile Money', 'Card', 'Bank Transfer', 'Insurance']);
export const notificationTypeEnum = pgEnum('notification_type', ['appointment', 'lab', 'pharmacy', 'billing', 'patient', 'system']);

/* ────────────────────── Tables ────────────────────── */

export const users = pgTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull(),
  roleLabel: text('role_label').notNull(),
  department: text('department').notNull(),
  phone: text('phone').notNull(),
  title: text('title'),
});

export const departments = pgTable('departments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  headName: text('head_name').notNull(),
  headId: text('head_id').notNull(),
  doctors: integer('doctors').notNull().default(0),
  nurses: integer('nurses').notNull().default(0),
  patients: integer('patients').notNull().default(0),
  status: text('status').notNull().default('active'),
  location: text('location').notNull(),
  phone: text('phone').notNull(),
  description: text('description').notNull(),
});

export const doctors = pgTable('doctors', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  specialization: text('specialization').notNull(),
  departmentId: varchar('department_id', { length: 50 }).references(() => departments.id),
  phone: text('phone').notNull(),
  email: text('email').notNull().unique(),
  status: doctorStatusEnum('status').notNull().default('active'),
  availability: doctorAvailabilityEnum('availability').notNull().default('available'),
  joinedDate: text('joined_date').notNull(),
  schedule: jsonb('schedule').$type<Array<{ day: string; hours: string }>>().notNull().default([]),
  about: text('about').notNull().default(''),
});

export const nurses = pgTable('nurses', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  departmentId: varchar('department_id', { length: 50 }).references(() => departments.id),
  phone: text('phone').notNull(),
  email: text('email').notNull().unique(),
  shift: shiftEnum('shift').notNull().default('Morning'),
  ward: text('ward').notNull(),
  status: nurseStatusEnum('status').notNull().default('active'),
  joinedDate: text('joined_date').notNull(),
});

export const patients = pgTable('patients', {
  id: varchar('id', { length: 50 }).primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  gender: genderEnum('gender').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  nationality: text('nationality').notNull(),
  bloodGroup: bloodGroupEnum('blood_group').notNull(),
  genotype: genotypeEnum('genotype').notNull(),
  allergies: jsonb('allergies').$type<string[]>().notNull().default([]),
  conditions: jsonb('conditions').$type<string[]>().notNull().default([]),
  emergencyContact: jsonb('emergency_contact').$type<{ name: string; relationship: string; phone: string }>().notNull(),
  insurance: jsonb('insurance').$type<{ provider: string; number: string } | null>(),
  registrationDate: text('registration_date').notNull(),
  assignedDoctorId: varchar('assigned_doctor_id', { length: 50 }).references(() => doctors.id),
  status: patientStatusEnum('status').notNull().default('active'),
  type: patientTypeEnum('type').notNull().default('new'),
});

export const appointments = pgTable('appointments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  patientId: varchar('patient_id', { length: 50 }).references(() => patients.id).notNull(),
  doctorId: varchar('doctor_id', { length: 50 }).references(() => doctors.id).notNull(),
  departmentId: varchar('department_id', { length: 50 }).references(() => departments.id).notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  reason: text('reason').notNull(),
  type: appointmentTypeEnum('type').notNull(),
  status: appointmentStatusEnum('status').notNull().default('scheduled'),
  notes: text('notes'),
});

export const medicines = pgTable('medicines', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  quantity: integer('quantity').notNull(),
  reorderLevel: integer('reorder_level').notNull(),
  unitPrice: real('unit_price').notNull(),
  expiryDate: text('expiry_date').notNull(),
  supplier: text('supplier').notNull(),
  status: stockStatusEnum('status').notNull().default('in_stock'),
  batch: text('batch').notNull(),
});

export const prescriptions = pgTable('prescriptions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  patientId: varchar('patient_id', { length: 50 }).references(() => patients.id).notNull(),
  doctorId: varchar('doctor_id', { length: 50 }).references(() => doctors.id).notNull(),
  date: text('date').notNull(),
  diagnosis: text('diagnosis').notNull(),
  medications: jsonb('medications').$type<Array<{
    name: string; dosage: string; frequency: string;
    duration: string; instructions: string;
  }>>().notNull().default([]),
  status: prescriptionStatusEnum('status').notNull().default('active'),
  notes: text('notes'),
});

export const labTests = pgTable('lab_tests', {
  id: varchar('id', { length: 50 }).primaryKey(),
  patientId: varchar('patient_id', { length: 50 }).references(() => patients.id).notNull(),
  doctorId: varchar('doctor_id', { length: 50 }).references(() => doctors.id).notNull(),
  testName: text('test_name').notNull(),
  orderedDate: text('ordered_date').notNull(),
  sampleType: text('sample_type').notNull(),
  priority: labPriorityEnum('priority').notNull().default('routine'),
  status: labStatusEnum('status').notNull().default('requested'),
  result: text('result'),
  unit: text('unit'),
  referenceRange: text('reference_range'),
  notes: text('notes'),
  abnormal: boolean('abnormal'),
  collectedAt: text('collected_at'),
  completedAt: text('completed_at'),
});

export const medicalRecords = pgTable('medical_records', {
  id: varchar('id', { length: 50 }).primaryKey(),
  patientId: varchar('patient_id', { length: 50 }).references(() => patients.id).notNull(),
  doctorId: varchar('doctor_id', { length: 50 }).references(() => doctors.id).notNull(),
  date: text('date').notNull(),
  type: recordTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  diagnosis: text('diagnosis'),
  symptoms: jsonb('symptoms').$type<string[]>(),
  treatmentPlan: text('treatment_plan'),
  vitals: jsonb('vitals').$type<{
    bloodPressure: string; heartRate: number; temperature: number;
    respiratoryRate: number; oxygenSaturation: number; weight: number; height: number;
  }>(),
  notes: text('notes'),
});

export const wards = pgTable('wards', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  departmentId: varchar('department_id', { length: 50 }).references(() => departments.id).notNull(),
});

export const beds = pgTable('beds', {
  id: varchar('id', { length: 50 }).primaryKey(),
  number: text('number').notNull(),
  wardId: varchar('ward_id', { length: 50 }).references(() => wards.id).notNull(),
  type: bedTypeEnum('type').notNull(),
  status: bedStatusEnum('status').notNull().default('available'),
  ratePerDay: real('rate_per_day').notNull(),
});

export const bedAssignments = pgTable('bed_assignments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  bedId: varchar('bed_id', { length: 50 }).references(() => beds.id).notNull(),
  patientId: varchar('patient_id', { length: 50 }).references(() => patients.id).notNull(),
  assignedAt: text('assigned_at').notNull(),
  releasedAt: text('released_at'),
  notes: text('notes'),
});

export const invoices = pgTable('invoices', {
  id: varchar('id', { length: 50 }).primaryKey(),
  patientId: varchar('patient_id', { length: 50 }).references(() => patients.id).notNull(),
  date: text('date').notNull(),
  dueDate: text('due_date').notNull(),
  items: jsonb('items').$type<Array<{
    description: string; quantity: number; unitPrice: number;
  }>>().notNull().default([]),
  subtotal: real('subtotal').notNull(),
  discount: real('discount').notNull().default(0),
  insuranceCoverage: real('insurance_coverage').notNull().default(0),
  total: real('total').notNull(),
  status: invoiceStatusEnum('status').notNull().default('pending'),
  payments: jsonb('payments').$type<Array<{
    id: string; date: string; amount: number;
    method: string; reference?: string;
  }>>().notNull().default([]),
  issuedBy: text('issued_by').notNull(),
});

export const staff = pgTable('staff', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  department: text('department').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull().unique(),
  status: text('status').notNull().default('active'),
  joinedDate: text('joined_date').notNull(),
});

export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 50 }).primaryKey(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  time: text('time').notNull(),
  read: boolean('read').notNull().default(false),
  link: text('link'),
});
