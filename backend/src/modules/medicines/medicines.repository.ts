import { eq } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { medicines } from '../../db/schema';

export async function findAllMedicines() {
  return db.select().from(medicines).orderBy(medicines.name);
}

export async function findMedicineById(id: string) {
  const rows = await db.select().from(medicines).where(eq(medicines.id, id)).limit(1);
  return rows[0];
}

export async function generateMedicineId(): Promise<string> {
  const existing = await db.select({ id: medicines.id }).from(medicines);
  return nextId('MED-', existing);
}

export async function insertMedicine(data: typeof medicines.$inferInsert) {
  const inserted = await db.insert(medicines).values(data).returning();
  return inserted[0];
}

export async function updateMedicine(id: string, data: Record<string, unknown>) {
  const updated = await db.update(medicines)
    .set(data)
    .where(eq(medicines.id, id))
    .returning();
  return updated[0];
}
