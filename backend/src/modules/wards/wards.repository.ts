import { eq } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { wards, beds } from '../../db/schema';

export async function findAllWards() {
  return db.select().from(wards);
}

export async function generateWardId(): Promise<string> {
  const existing = await db.select({ id: wards.id }).from(wards);
  return nextId('W-', existing);
}

export async function insertWard(data: typeof wards.$inferInsert) {
  const inserted = await db.insert(wards).values(data).returning();
  return inserted[0];
}

export async function findBedsByWardId(wardId: string) {
  return db.select().from(beds).where(eq(beds.wardId, wardId));
}

export async function generateBedId(): Promise<string> {
  const existing = await db.select({ id: beds.id }).from(beds);
  return nextId('BD-', existing);
}

export async function insertBed(data: typeof beds.$inferInsert) {
  return db.insert(beds).values(data);
}

export async function findAllBeds() {
  return db.select({ id: beds.id }).from(beds);
}
