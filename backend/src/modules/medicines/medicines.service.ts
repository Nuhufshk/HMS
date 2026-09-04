import { medicines as medicinesTable } from '../../db/schema';
import { deriveMedicineStatus } from '../../db';
import { findAllMedicines, findMedicineById, generateMedicineId, insertMedicine, updateMedicine } from './medicines.repository';
import type { MedicineInput } from '../../types';
import type { MedicineCreateInput, MedicineUpdateInput } from './medicines.types';

function addDaysToExpiry(m: { expiryDate: string }) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(`${m.expiryDate}T00:00:00`).getTime();
  const daysToExpiry = Math.round((target - now.getTime()) / 86_400_000);
  return daysToExpiry;
}

export async function listMedicines() {
  const rows = await findAllMedicines();
  return rows.map((m) => ({ ...m, daysToExpiry: addDaysToExpiry(m) }));
}

export async function createMedicineRecord(body: MedicineCreateInput) {
  if (!body.name || !body.category || !body.expiryDate || !body.supplier) {
    return { medicine: undefined, error: 'Name, category, expiry date and supplier are required.' };
  }

  const id = await generateMedicineId();
  const quantity = Number(body.quantity) || 0;
  const reorderLevel = Number(body.reorderLevel) || 0;

  const values: typeof medicinesTable.$inferInsert = {
    id,
    name: body.name,
    category: body.category,
    quantity,
    reorderLevel,
    unitPrice: Number(body.unitPrice) || 0,
    expiryDate: body.expiryDate,
    supplier: body.supplier,
    batch: body.batch?.trim() || `BT-${Math.floor(1000 + Math.random() * 9000)}`,
    status: deriveMedicineStatus({ quantity, reorderLevel, expiryDate: body.expiryDate }),
  };

  const inserted = await insertMedicine(values);
  return { medicine: inserted, error: undefined };
}

const MEDICINE_ALLOWED_KEYS = ['name', 'category', 'quantity', 'reorderLevel', 'unitPrice', 'expiryDate', 'supplier', 'batch'];

export async function updateMedicineRecord(id: string, body: MedicineUpdateInput) {
  const { id: _id, ...patchFields } = body;
  const updateData: Record<string, unknown> = {};
  for (const key of MEDICINE_ALLOWED_KEYS) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  const existing = await findMedicineById(id);
  if (!existing) return { medicine: undefined, error: 'Medicine not found' };

  const merged = { ...existing, ...updateData };
  updateData.status = deriveMedicineStatus({ quantity: merged.quantity, reorderLevel: merged.reorderLevel, expiryDate: merged.expiryDate });

  const updated = await updateMedicine(id, updateData);
  return { medicine: { ...updated, daysToExpiry: addDaysToExpiry(updated) }, error: undefined };
}

export async function adjustStock(id: string, delta: number) {
  const existing = await findMedicineById(id);
  if (!existing) return { medicine: undefined, error: 'Medicine not found' };

  const newQty = Math.max(0, existing.quantity + delta);
  const updated = await updateMedicine(id, {
    quantity: newQty,
    status: deriveMedicineStatus({ quantity: newQty, reorderLevel: existing.reorderLevel, expiryDate: existing.expiryDate }),
  });

  return { medicine: { ...updated, daysToExpiry: addDaysToExpiry(updated) }, error: undefined };
}
