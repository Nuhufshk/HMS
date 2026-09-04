import { eq, desc, and, sql } from 'drizzle-orm';
import { db, nextId } from '../../db';
import { appointments, patients, doctors, departments } from '../../db/schema';
import type { Appointment } from '../../types';
import type { AppointmentListQuery } from './appointments.types';

export async function findAllAppointments(query: AppointmentListQuery) {
  const conditions = [];
  if (query.patientId) conditions.push(eq(appointments.patientId, query.patientId));
  if (query.doctorId) conditions.push(eq(appointments.doctorId, query.doctorId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db.select().from(appointments)
    .where(whereClause)
    .orderBy(desc(sql`${appointments.date} || ${appointments.time}`));

  return enrichAppointments(rows);
}

export async function findAppointmentsByDate(date: string): Promise<Appointment[]> {
  const rows = await db.select().from(appointments).where(eq(appointments.date, date));
  return rows as Appointment[];
}

export async function findAppointmentById(id: string): Promise<Appointment | undefined> {
  const rows = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return rows[0] as Appointment | undefined;
}

export async function generateAppointmentId(): Promise<string> {
  const existing = await db.select({ id: appointments.id }).from(appointments);
  return nextId('APT-', existing);
}

export async function insertAppointment(data: typeof appointments.$inferInsert) {
  const inserted = await db.insert(appointments).values(data).returning();
  return inserted[0];
}

export async function updateAppointment(id: string, data: Record<string, unknown>) {
  const updated = await db.update(appointments)
    .set(data)
    .where(eq(appointments.id, id))
    .returning();
  return updated[0];
}

export async function enrichAppointments(rows: typeof appointments.$inferSelect[]) {
  return Promise.all(
    rows.map(async (a) => {
      const patientRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
        .from(patients).where(eq(patients.id, a.patientId)).limit(1);
      const doctorRows = await db.select({ name: doctors.name })
        .from(doctors).where(eq(doctors.id, a.doctorId)).limit(1);
      const deptRows = await db.select({ name: departments.name })
        .from(departments).where(eq(departments.id, a.departmentId)).limit(1);
      return {
        ...a,
        patientName: patientRows[0] ? `${patientRows[0].firstName} ${patientRows[0].lastName}` : 'Unknown patient',
        doctorName: doctorRows[0]?.name ?? 'Unassigned',
        departmentName: deptRows[0]?.name ?? '—',
      };
    }),
  );
}
