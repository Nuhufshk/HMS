import { eq, desc, like, or, sql, and } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { patients } from '../../db/schema';
import type { Patient } from '../../types';
import type { PatientListQuery } from './patients.types';

export async function findAllPatients(query: PatientListQuery): Promise<Patient[]> {
  const q = String(query.q ?? '').trim().toLowerCase();
  const doctorId = String(query.doctorId ?? '');
  const limit = Number(query.limit);

  const conditions = [];
  if (q) {
    conditions.push(
      or(
        like(sql`lower(${patients.id})`, `%${q}%`),
        like(sql`lower(${patients.firstName} || ' ' || ${patients.lastName})`, `%${q}%`),
        like(sql`replace(${patients.phone}, ' ', '')`, `%${q.replace(/\s/g, '')}%`),
      )!
    );
  }
  if (doctorId) {
    conditions.push(eq(patients.assignedDoctorId, doctorId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const queryBuilder = db.select().from(patients).where(whereClause).orderBy(desc(patients.registrationDate));

  const result = Number.isFinite(limit) && limit > 0
    ? await queryBuilder.limit(Math.floor(limit))
    : await queryBuilder;

  return result as Patient[];
}

export async function findPatientById(id: string): Promise<Patient | undefined> {
  const rows = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  return rows[0] as Patient | undefined;
}

export async function generatePatientId(): Promise<string> {
  const existing = await db.select({ id: patients.id }).from(patients);
  return nextId('PT-', existing);
}

export async function createPatient(data: typeof patients.$inferInsert): Promise<Patient> {
  const inserted = await db.insert(patients).values(data).returning();
  return inserted[0] as Patient;
}

export async function updatePatient(id: string, data: Record<string, unknown>): Promise<Patient | undefined> {
  const updated = await db.update(patients)
    .set(data as typeof patients.$inferInsert)
    .where(eq(patients.id, id))
    .returning();
  return updated[0] as Patient | undefined;
}
