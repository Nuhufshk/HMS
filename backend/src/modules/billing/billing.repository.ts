import { eq, desc } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { invoices, patients } from '../../db/schema';

export async function findAllInvoices(patientId?: string) {
  const whereClause = patientId ? eq(invoices.patientId, patientId) : undefined;
  return db.select().from(invoices).where(whereClause).orderBy(desc(invoices.date));
}

export async function findInvoiceById(id: string) {
  const rows = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return rows[0];
}

export async function generateInvoiceId(): Promise<string> {
  const existing = await db.select({ id: invoices.id }).from(invoices);
  return nextId('INV-', existing);
}

export async function insertInvoice(data: typeof invoices.$inferInsert) {
  const inserted = await db.insert(invoices).values(data).returning();
  return inserted[0];
}

export async function updateInvoice(id: string, data: Record<string, unknown>) {
  const updated = await db.update(invoices)
    .set(data)
    .where(eq(invoices.id, id))
    .returning();
  return updated[0];
}

export async function findPatientName(patientId: string) {
  const rows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
    .from(patients).where(eq(patients.id, patientId)).limit(1);
  return rows[0] ? `${rows[0].firstName} ${rows[0].lastName}` : 'Unknown patient';
}
