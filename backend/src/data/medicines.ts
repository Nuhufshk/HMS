import type { Medicine } from '../types';
import { dateFromToday, daysUntil } from '../utils/date';

const D = (offset: number) => dateFromToday(offset);

function statusOf(quantity: number, reorderLevel: number, expiryDate: string): Medicine['status'] {
  if (daysUntil(expiryDate) <= 0) return 'expired';
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= reorderLevel) return 'low_stock';
  return 'in_stock';
}

interface MedicineSeed extends Omit<Medicine, 'status'> {}

const SEED: MedicineSeed[] = [
  { id: 'MED-7001', name: 'Coartem (Artemether/Lumefantrine 80/480mg)', category: 'Antimalarial', quantity: 340, reorderLevel: 100, unitPrice: 45.5, expiryDate: D(240), supplier: 'Tobinco Pharmaceuticals', batch: 'BT-2041' },
  { id: 'MED-7002', name: 'Paracetamol 500mg', category: 'Analgesic', quantity: 1250, reorderLevel: 300, unitPrice: 8.0, expiryDate: D(400), supplier: 'Ernest Chemists', batch: 'PC-8852' },
  { id: 'MED-7003', name: 'Amoxicillin 500mg', category: 'Antibiotic', quantity: 480, reorderLevel: 150, unitPrice: 18.5, expiryDate: D(210), supplier: 'Kinapharma', batch: 'AM-3340' },
  { id: 'MED-7004', name: 'Metformin 500mg', category: 'Antidiabetic', quantity: 900, reorderLevel: 200, unitPrice: 14.0, expiryDate: D(365), supplier: 'PharmaVision', batch: 'MF-2217' },
  { id: 'MED-7005', name: 'Amlodipine 5mg', category: 'Antihypertensive', quantity: 520, reorderLevel: 150, unitPrice: 16.5, expiryDate: D(300), supplier: 'M&G Pharmaceuticals', batch: 'AM-9081' },
  { id: 'MED-7006', name: 'Atorvastatin 20mg', category: 'Cardiovascular', quantity: 60, reorderLevel: 120, unitPrice: 38.0, expiryDate: D(280), supplier: 'Tobinco Pharmaceuticals', batch: 'AT-1102' },
  { id: 'MED-7007', name: 'Omeprazole 20mg', category: 'Gastrointestinal', quantity: 640, reorderLevel: 150, unitPrice: 21.0, expiryDate: D(330), supplier: 'Danadams Pharmacy', batch: 'OM-5544' },
  { id: 'MED-7008', name: 'Ibuprofen 400mg', category: 'Analgesic', quantity: 0, reorderLevel: 120, unitPrice: 12.0, expiryDate: D(180), supplier: 'Ernest Chemists', batch: 'IB-7731' },
  { id: 'MED-7009', name: 'Metronidazole 400mg', category: 'Antibiotic', quantity: 410, reorderLevel: 120, unitPrice: 15.0, expiryDate: D(220), supplier: 'Kinapharma', batch: 'MT-6670' },
  { id: 'MED-7010', name: 'Ciprofloxacin 500mg', category: 'Antibiotic', quantity: 230, reorderLevel: 100, unitPrice: 24.0, expiryDate: D(190), supplier: 'PharmaVision', batch: 'CP-3388' },
  { id: 'MED-7011', name: 'Salbutamol inhaler 100mcg', category: 'Respiratory', quantity: 85, reorderLevel: 60, unitPrice: 42.0, expiryDate: D(260), supplier: 'M&G Pharmaceuticals', batch: 'SB-4450' },
  { id: 'MED-7012', name: 'Losartan 50mg', category: 'Antihypertensive', quantity: 150, reorderLevel: 120, unitPrice: 19.5, expiryDate: D(320), supplier: 'Danadams Pharmacy', batch: 'LS-5561' },
  { id: 'MED-7013', name: 'Furosemide 40mg', category: 'Cardiovascular', quantity: 320, reorderLevel: 100, unitPrice: 11.0, expiryDate: D(240), supplier: 'Tobinco Pharmaceuticals', batch: 'FS-8890' },
  { id: 'MED-7014', name: 'Ceftriaxone 1g injection', category: 'Antibiotic', quantity: 90, reorderLevel: 60, unitPrice: 55.0, expiryDate: D(150), supplier: 'Kinapharma', batch: 'CF-1129' },
  { id: 'MED-7015', name: 'Oral Rehydration Salts (ORS)', category: 'Fluids & Electrolytes', quantity: 780, reorderLevel: 200, unitPrice: 5.5, expiryDate: D(500), supplier: 'Ernest Chemists', batch: 'OR-9920' },
  { id: 'MED-7016', name: 'Zinc sulfate 20mg', category: 'Vitamins & Supplements', quantity: 45, reorderLevel: 80, unitPrice: 9.0, expiryDate: D(210), supplier: 'PharmaVision', batch: 'ZN-3345' },
  { id: 'MED-7017', name: 'Multivitamin tablets', category: 'Vitamins & Supplements', quantity: 620, reorderLevel: 150, unitPrice: 17.0, expiryDate: D(420), supplier: 'Danadams Pharmacy', batch: 'MV-7788' },
  { id: 'MED-7018', name: 'Diclofenac 50mg', category: 'Analgesic', quantity: 0, reorderLevel: 100, unitPrice: 13.5, expiryDate: D(160), supplier: 'M&G Pharmaceuticals', batch: 'DC-5560' },
  { id: 'MED-7019', name: 'Tramadol 50mg', category: 'Analgesic', quantity: 110, reorderLevel: 60, unitPrice: 28.0, expiryDate: D(260), supplier: 'Kinapharma', batch: 'TD-2211' },
  { id: 'MED-7020', name: 'Glibenclamide 5mg', category: 'Antidiabetic', quantity: 260, reorderLevel: 100, unitPrice: 13.0, expiryDate: D(300), supplier: 'PharmaVision', batch: 'GB-8877' },
  { id: 'MED-7021', name: 'Insulin Glargine 100IU/ml pen', category: 'Antidiabetic', quantity: 38, reorderLevel: 40, unitPrice: 95.0, expiryDate: D(180), supplier: 'Tobinco Pharmaceuticals', batch: 'IG-0092' },
  { id: 'MED-7022', name: 'Aspirin 75mg', category: 'Cardiovascular', quantity: 540, reorderLevel: 150, unitPrice: 7.5, expiryDate: D(380), supplier: 'Ernest Chemists', batch: 'AS-4410' },
  { id: 'MED-7023', name: 'Cetirizine 10mg', category: 'Respiratory', quantity: 150, reorderLevel: 80, unitPrice: 10.5, expiryDate: D(200), supplier: 'Danadams Pharmacy', batch: 'CT-6681' },
  { id: 'MED-7024', name: 'Ferrous sulfate 200mg', category: 'Vitamins & Supplements', quantity: 88, reorderLevel: 100, unitPrice: 9.5, expiryDate: D(-4), supplier: 'M&G Pharmaceuticals', batch: 'FS-1120' },
  { id: 'MED-7025', name: 'Prednisolone 10mg', category: 'Respiratory', quantity: 200, reorderLevel: 80, unitPrice: 12.0, expiryDate: D(220), supplier: 'Kinapharma', batch: 'PD-3307' },
  { id: 'MED-7026', name: 'Propranolol 40mg', category: 'Cardiovascular', quantity: 130, reorderLevel: 60, unitPrice: 18.0, expiryDate: D(300), supplier: 'PharmaVision', batch: 'PP-1194' },
];

export const MOCK_MEDICINES: Medicine[] = SEED.map((m) => ({
  ...m,
  status: statusOf(m.quantity, m.reorderLevel, m.expiryDate),
}));
