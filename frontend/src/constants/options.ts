import type { AppointmentType, PaymentMethod, Shift } from '@/types';

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 7; h <= 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h !== 18) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();

export const APPOINTMENT_TYPES: AppointmentType[] = [
  'Consultation',
  'Follow-up',
  'Check-up',
  'Emergency',
  'Procedure',
  'Maternity',
  'Physiotherapy',
  'Review',
];

export const FREQUENCIES: string[] = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'At bedtime',
  'Before meals',
  'After meals',
  'As needed',
];

export const MEDICINE_CATEGORIES: string[] = [
  'Antimalarial',
  'Antibiotic',
  'Analgesic',
  'Antihypertensive',
  'Antidiabetic',
  'Gastrointestinal',
  'Respiratory',
  'Cardiovascular',
  'Vitamins & Supplements',
  'Fluids & Electrolytes',
  'Other',
];

export const SHIFTS: Shift[] = ['Morning', 'Afternoon', 'Night', 'Rotating'];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Mobile Money',
  'Card',
  'Bank Transfer',
  'Insurance',
];

/** Billing service catalogue with typical Ghanaian hospital prices (GHS). */
export interface ServiceItem {
  name: string;
  price: number;
}

export const SERVICE_CATALOG: ServiceItem[] = [
  { name: 'General Consultation', price: 150 },
  { name: 'Specialist Consultation', price: 250 },
  { name: 'Laboratory – Full Blood Count', price: 120 },
  { name: 'Laboratory – Malaria Test', price: 80 },
  { name: 'Laboratory – Blood Sugar (Fasting)', price: 60 },
  { name: 'Laboratory – Urinalysis', price: 50 },
  { name: 'X-Ray (Chest)', price: 180 },
  { name: 'Ultrasound Scan', price: 250 },
  { name: 'ECG', price: 90 },
  { name: 'Physiotherapy Session', price: 120 },
  { name: 'Pharmacy – Dispensed Medication', price: 180 },
  { name: 'Admission (per day)', price: 400 },
  { name: 'Ward Nursing Care (per day)', price: 200 },
  { name: 'Delivery (Normal)', price: 1500 },
  { name: 'Caesarean Section', price: 6500 },
  { name: 'Minor Surgery', price: 1200 },
  { name: 'Blood Transfusion', price: 450 },
  { name: 'Vaccination', price: 60 },
  { name: 'Ambulance Service', price: 300 },
  { name: 'Optical Examination', price: 150 },
];

export const INSURANCE_COVERAGE_OPTIONS = [
  { value: 0, label: 'None (self-pay)' },
  { value: 30, label: 'NHIS – 30%' },
  { value: 50, label: 'NHIS – 50%' },
  { value: 70, label: 'Private insurance – 70%' },
];

export const ALLERGY_QUICK_OPTIONS = ['Penicillin', 'Sulfonamides', 'Peanuts', 'Latex', 'Codeine'];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const GENOTYPES = ['AA', 'AS', 'SS', 'AC'] as const;
