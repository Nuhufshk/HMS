import { eq, like, or, sql } from 'drizzle-orm';
import { db } from '../../db';
import { patients, doctors, departments } from '../../db/schema';

export async function searchPatients(q: string) {
  return db.select().from(patients).where(
    or(
      like(sql`lower(${patients.id})`, `%${q}%`),
      like(sql`lower(${patients.firstName} || ' ' || ${patients.lastName})`, `%${q}%`),
      like(sql`replace(${patients.phone}, ' ', '')`, `%${q.replace(/\s/g, '')}%`),
    )!
  ).limit(5);
}

export async function searchDoctors(q: string) {
  return db.select().from(doctors).where(
    or(
      like(sql`lower(${doctors.name})`, `%${q}%`),
      like(sql`lower(${doctors.specialization})`, `%${q}%`),
      like(sql`lower(${doctors.id})`, `%${q}%`),
    )!
  ).limit(5);
}

export async function enrichDoctors(docRows: Awaited<ReturnType<typeof searchDoctors>>) {
  return Promise.all(
    docRows.map(async (d) => {
      const deptRows = d.departmentId ? await db.select({ name: departments.name })
        .from(departments).where(eq(departments.id, d.departmentId)).limit(1) : [];
      return {
        id: d.id,
        name: d.name,
        specialization: d.specialization,
        departmentName: deptRows[0]?.name ?? '—',
      };
    }),
  );
}
