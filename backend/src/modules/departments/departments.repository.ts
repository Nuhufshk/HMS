import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { departments, doctors, nurses } from '../../db/schema';

export async function findAllDepartments() {
  return db.select().from(departments);
}

export async function findDepartmentById(id: string) {
  const rows = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getDepartmentStaff(departmentId: string) {
  const deptDoctors = await db.select({ name: doctors.name })
    .from(doctors).where(eq(doctors.departmentId, departmentId));
  const deptNurses = await db.select({ name: nurses.name })
    .from(nurses).where(eq(nurses.departmentId, departmentId));
  return {
    doctors: deptDoctors.map((d) => d.name),
    nurses: deptNurses.map((n) => n.name),
  };
}
