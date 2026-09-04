import { eq, sql } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { doctors, departments, patients } from '../../db/schema';
import type { Doctor } from '../../types';

export async function findAllDoctors() {
  return db.select().from(doctors);
}

export async function findDoctorById(id: string): Promise<Doctor | undefined> {
  const rows = await db.select().from(doctors).where(eq(doctors.id, id)).limit(1);
  return rows[0] as Doctor | undefined;
}

export async function generateDoctorId(): Promise<string> {
  const existing = await db.select({ id: doctors.id }).from(doctors);
  return nextId('DR-', existing);
}

export async function insertDoctor(data: typeof doctors.$inferInsert) {
  const inserted = await db.insert(doctors).values(data).returning();
  return inserted[0];
}

export async function updateDoctor(id: string, data: Record<string, unknown>) {
  const updated = await db.update(doctors)
    .set(data)
    .where(eq(doctors.id, id))
    .returning();
  return updated[0];
}

export async function getDepartmentName(departmentId: string | null): Promise<string> {
  if (!departmentId) return '—';
  const rows = await db.select({ name: departments.name })
    .from(departments).where(eq(departments.id, departmentId)).limit(1);
  return rows[0]?.name ?? '—';
}

export async function getPatientCount(doctorId: string): Promise<number> {
  const rows = await db.select({ count: sql<number>`count(*)::int` })
    .from(patients).where(eq(patients.assignedDoctorId, doctorId));
  return rows[0]?.count ?? 0;
}

export async function enrichDoctor(d: typeof doctors.$inferSelect) {
  const [departmentName, patientsCount] = await Promise.all([
    getDepartmentName(d.departmentId),
    getPatientCount(d.id),
  ]);
  return { ...d, departmentName, patientsCount };
}
