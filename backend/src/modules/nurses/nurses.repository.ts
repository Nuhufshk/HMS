import { eq } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { nurses, departments } from '../../db/schema';
import type { Nurse } from '../../types';

export async function findAllNurses() {
  return db.select().from(nurses);
}

export async function generateNurseId(): Promise<string> {
  const existing = await db.select({ id: nurses.id }).from(nurses);
  return nextId('NS-', existing);
}

export async function insertNurse(data: typeof nurses.$inferInsert) {
  const inserted = await db.insert(nurses).values(data).returning();
  return inserted[0];
}

export async function updateNurse(id: string, data: Record<string, unknown>) {
  const updated = await db.update(nurses)
    .set(data)
    .where(eq(nurses.id, id))
    .returning();
  return updated[0];
}

export async function getDepartmentName(departmentId: string | null): Promise<string> {
  if (!departmentId) return '—';
  const rows = await db.select({ name: departments.name })
    .from(departments).where(eq(departments.id, departmentId)).limit(1);
  return rows[0]?.name ?? '—';
}

export async function enrichNurse(n: typeof nurses.$inferSelect) {
  const departmentName = await getDepartmentName(n.departmentId);
  return { ...n, departmentName };
}
