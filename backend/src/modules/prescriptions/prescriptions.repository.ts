import { eq, desc, like, sql } from 'drizzle-orm';
import { db, nextId, deriveMedicineStatus } from '../../db';
import { prescriptions, patients, doctors, medicines } from '../../db/schema';

export async function findAllPrescriptions(patientId?: string) {
  const whereClause = patientId ? eq(prescriptions.patientId, patientId) : undefined;
  return db.select().from(prescriptions).where(whereClause).orderBy(desc(prescriptions.date));
}

export async function findPrescriptionById(id: string) {
  const rows = await db.select().from(prescriptions).where(eq(prescriptions.id, id)).limit(1);
  return rows[0];
}

export async function generatePrescriptionId(): Promise<string> {
  const existing = await db.select({ id: prescriptions.id }).from(prescriptions);
  return nextId('RX-', existing);
}

export async function insertPrescription(data: typeof prescriptions.$inferInsert) {
  const inserted = await db.insert(prescriptions).values(data).returning();
  return inserted[0];
}

export async function updatePrescription(id: string, data: Record<string, unknown>) {
  const updated = await db.update(prescriptions)
    .set(data)
    .where(eq(prescriptions.id, id))
    .returning();
  return updated[0];
}

export async function enrichPrescriptions(rows: typeof prescriptions.$inferSelect[]) {
  return Promise.all(
    rows.map(async (p) => {
      const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
        .from(patients).where(eq(patients.id, p.patientId)).limit(1);
      const docRows = await db.select({ name: doctors.name })
        .from(doctors).where(eq(doctors.id, p.doctorId)).limit(1);
      return {
        ...p,
        patientName: patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : 'Unknown patient',
        doctorName: docRows[0]?.name ?? 'Unknown doctor',
      };
    }),
  );
}

export async function findMedicineByNameFragment(nameFragment: string) {
  const matchRows = await db.select().from(medicines)
    .where(like(sql`lower(${medicines.name})`, `${nameFragment.toLowerCase().slice(0, 12)}%`))
    .limit(1);
  return matchRows[0];
}

export async function decrementMedicineStock(medicineId: string, newQty: number, reorderLevel: number, expiryDate: string) {
  await db.update(medicines)
    .set({
      quantity: newQty,
      status: deriveMedicineStatus({ quantity: newQty, reorderLevel, expiryDate }),
    })
    .where(eq(medicines.id, medicineId));
}
