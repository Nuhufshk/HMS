import { eq, desc } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { labTests, patients, doctors } from '../../db/schema';

export async function findAllLabTests(patientId?: string) {
  const whereClause = patientId ? eq(labTests.patientId, patientId) : undefined;
  return db.select().from(labTests).where(whereClause).orderBy(desc(labTests.orderedDate));
}

export async function findLabTestById(id: string) {
  const rows = await db.select().from(labTests).where(eq(labTests.id, id)).limit(1);
  return rows[0];
}

export async function generateLabTestId(): Promise<string> {
  const existing = await db.select({ id: labTests.id }).from(labTests);
  return nextId('LAB-', existing);
}

export async function insertLabTest(data: typeof labTests.$inferInsert) {
  const inserted = await db.insert(labTests).values(data).returning();
  return inserted[0];
}

export async function updateLabTest(id: string, data: Record<string, unknown>) {
  const updated = await db.update(labTests)
    .set(data)
    .where(eq(labTests.id, id))
    .returning();
  return updated[0];
}

export async function enrichLabTests(rows: typeof labTests.$inferSelect[]) {
  return Promise.all(
    rows.map(async (t) => {
      const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
        .from(patients).where(eq(patients.id, t.patientId)).limit(1);
      const docRows = await db.select({ name: doctors.name })
        .from(doctors).where(eq(doctors.id, t.doctorId)).limit(1);
      return {
        ...t,
        patientName: patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : 'Unknown patient',
        doctorName: docRows[0]?.name ?? 'Unknown doctor',
      };
    }),
  );
}
