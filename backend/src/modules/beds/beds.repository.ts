import { eq, and, desc, sql } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { beds, wards, bedAssignments, patients } from '../../db/schema';
import type { BedStatus, BedType } from '../../types';
import { VALID_STATUSES } from './beds.types';
import type { BedListQuery } from './beds.types';

export async function findBeds(query: BedListQuery) {
  const conditions = [];
  if (query.status && VALID_STATUSES.includes(query.status as BedStatus)) conditions.push(eq(beds.status, query.status as BedStatus));
  if (query.wardId) conditions.push(eq(beds.wardId, query.wardId));
  if (query.type) conditions.push(eq(beds.type, query.type as BedType));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(beds).where(whereClause);
}

export async function findBedById(id: string) {
  const rows = await db.select().from(beds).where(eq(beds.id, id)).limit(1);
  return rows[0];
}

export async function generateBedId(): Promise<string> {
  const existing = await db.select({ id: beds.id }).from(beds);
  return nextId('BD-', existing);
}

export async function insertBed(data: typeof beds.$inferInsert) {
  const inserted = await db.insert(beds).values(data).returning();
  return inserted[0];
}

export async function updateBed(id: string, data: Record<string, unknown>) {
  const updated = await db.update(beds)
    .set(data)
    .where(eq(beds.id, id))
    .returning();
  return updated[0];
}

export async function deleteBed(id: string) {
  await db.delete(bedAssignments).where(eq(bedAssignments.bedId, id));
  await db.delete(beds).where(eq(beds.id, id));
}

export async function findActiveAssignment(bedId: string) {
  const rows = await db.select().from(bedAssignments)
    .where(and(eq(bedAssignments.bedId, bedId), eq(bedAssignments.releasedAt, sql`null`)))
    .limit(1);
  return rows[0];
}

export async function findPatientActiveAssignment(patientId: string) {
  const rows = await db.select().from(bedAssignments)
    .where(and(eq(bedAssignments.patientId, patientId), eq(bedAssignments.releasedAt, sql`null`)))
    .limit(1);
  return rows[0];
}

export async function findBedNumber(id: string) {
  const rows = await db.select({ number: beds.number }).from(beds).where(eq(beds.id, id)).limit(1);
  return rows[0]?.number;
}

export async function generateAssignmentId(): Promise<string> {
  const existing = await db.select({ id: bedAssignments.id }).from(bedAssignments);
  return nextId('BA-', existing);
}

export async function insertAssignment(data: typeof bedAssignments.$inferInsert) {
  return db.insert(bedAssignments).values(data);
}

export async function releaseAssignment(id: string, releasedAt: string) {
  await db.update(bedAssignments)
    .set({ releasedAt })
    .where(eq(bedAssignments.id, id));
}

export async function setBedStatus(id: string, status: BedStatus) {
  await db.update(beds).set({ status }).where(eq(beds.id, id));
}

export async function setPatientStatus(patientId: string, status: typeof patients.$inferInsert['status']) {
  await db.update(patients).set({ status }).where(eq(patients.id, patientId));
}

export async function findPatientById(id: string) {
  const rows = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  return rows[0];
}

export async function findBedAssignments(bedId: string) {
  return db.select().from(bedAssignments)
    .where(eq(bedAssignments.bedId, bedId))
    .orderBy(desc(bedAssignments.assignedAt));
}

export async function enrichBed(bed: typeof beds.$inferSelect) {
  const wardRows = await db.select({ name: wards.name }).from(wards).where(eq(wards.id, bed.wardId)).limit(1);
  const activeAssignment = await findActiveAssignment(bed.id);
  let patientName: string | null = null;
  let assignedPatientId: string | null = null;
  let occupiedSince: string | null = null;
  if (activeAssignment) {
    assignedPatientId = activeAssignment.patientId;
    occupiedSince = activeAssignment.assignedAt;
    const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
      .from(patients).where(eq(patients.id, assignedPatientId)).limit(1);
    patientName = patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : null;
  }
  return {
    ...bed,
    wardName: wardRows[0]?.name ?? '—',
    patientId: assignedPatientId,
    patientName,
    occupiedSince,
  };
}

export async function enrichAssignment(a: typeof bedAssignments.$inferSelect) {
  const bedRows = await db.select({ number: beds.number, wardId: beds.wardId }).from(beds).where(eq(beds.id, a.bedId)).limit(1);
  let wardName = '—';
  if (bedRows[0]) {
    const wRows = await db.select({ name: wards.name }).from(wards).where(eq(wards.id, bedRows[0].wardId)).limit(1);
    wardName = wRows[0]?.name ?? '—';
  }
  const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
    .from(patients).where(eq(patients.id, a.patientId)).limit(1);
  return {
    ...a,
    bedNumber: bedRows[0]?.number ?? '—',
    wardName,
    patientName: patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : 'Unknown patient',
  };
}
