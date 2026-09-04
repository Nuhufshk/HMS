import { eq, desc } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { medicalRecords, patients, doctors } from '../../db/schema';

export async function findAllMedicalRecords(patientId?: string) {
  const whereClause = patientId ? eq(medicalRecords.patientId, patientId) : undefined;
  return db.select().from(medicalRecords).where(whereClause).orderBy(desc(medicalRecords.date));
}

export async function findPatientsWithRecords() {
  return db.selectDistinct({ patientId: medicalRecords.patientId }).from(medicalRecords);
}

export async function generateRecordId(): Promise<string> {
  const existing = await db.select({ id: medicalRecords.id }).from(medicalRecords);
  return nextId('REC-', existing);
}

export async function insertMedicalRecord(data: typeof medicalRecords.$inferInsert) {
  const inserted = await db.insert(medicalRecords).values(data).returning();
  return inserted[0];
}

export async function enrichRecords(rows: typeof medicalRecords.$inferSelect[]) {
  return Promise.all(
    rows.map(async (r) => {
      const docRows = await db.select({ name: doctors.name })
        .from(doctors).where(eq(doctors.id, r.doctorId)).limit(1);
      return { ...r, doctorName: docRows[0]?.name ?? 'Unknown doctor' };
    }),
  );
}

export async function findPatientName(patientId: string) {
  const rows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
    .from(patients).where(eq(patients.id, patientId)).limit(1);
  return rows[0] ? `${rows[0].firstName} ${rows[0].lastName}` : patientId;
}
