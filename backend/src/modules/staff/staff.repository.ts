import { eq } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { staff } from '../../db/schema';
import type { Staff } from '../../types';

export async function findAllStaff() {
  return db.select().from(staff).orderBy(staff.name);
}

export async function generateStaffId(): Promise<string> {
  const existing = await db.select({ id: staff.id }).from(staff);
  return nextId('STF-', existing);
}

export async function insertStaff(data: typeof staff.$inferInsert) {
  const inserted = await db.insert(staff).values(data).returning();
  return inserted[0];
}

export async function updateStaff(id: string, data: Record<string, unknown>) {
  const updated = await db.update(staff)
    .set(data)
    .where(eq(staff.id, id))
    .returning();
  return updated[0];
}
