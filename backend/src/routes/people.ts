import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db, nextId } from '../db';
import { doctors, nurses, departments, staff, patients } from '../db/schema';
import { todayISO } from '../utils/date';
import type { Doctor, DoctorAvailability, DoctorStatus, Nurse, NurseStatus, Staff, StaffStatus } from '../types';

const router = Router();

/* -------------------------------- Doctors -------------------------------- */

/** GET /api/doctors?availability=&departmentId= */
router.get('/doctors', async (req, res) => {
  const availability = String(req.query.availability ?? '');
  const departmentId = String(req.query.departmentId ?? '');

  let rows = await db.select().from(doctors);

  if (availability) {
    rows = rows.filter((d) => d.status === 'active' && d.availability === availability);
  }
  if (departmentId) {
    rows = rows.filter((d) => d.departmentId === departmentId);
  }

  // Enrich with department name and patient count
  const enriched = await Promise.all(
    rows.map(async (d) => {
      const deptRows = d.departmentId ? await db.select({ name: departments.name })
        .from(departments).where(eq(departments.id, d.departmentId)).limit(1) : [];
      const patCount = await db.select({ count: sql<number>`count(*)::int` })
        .from(patients).where(eq(patients.assignedDoctorId, d.id));
      return {
        ...d,
        departmentName: deptRows[0]?.name ?? '—',
        patientsCount: patCount[0]?.count ?? 0,
      };
    }),
  );

  res.json(enriched);
});

/** GET /api/doctors/:id */
router.get('/doctors/:id', async (req, res) => {
  const rows = await db.select().from(doctors).where(eq(doctors.id, req.params.id)).limit(1);
  if (!rows.length) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }
  const d = rows[0];
  const deptRows = d.departmentId ? await db.select({ name: departments.name })
    .from(departments).where(eq(departments.id, d.departmentId)).limit(1) : [];
  const patCount = await db.select({ count: sql<number>`count(*)::int` })
    .from(patients).where(eq(patients.assignedDoctorId, d.id));
  res.json({
    ...d,
    departmentName: deptRows[0]?.name ?? '—',
    patientsCount: patCount[0]?.count ?? 0,
  });
});

/** POST /api/doctors */
router.post('/doctors', async (req, res) => {
  const body = (req.body ?? {}) as Partial<Doctor>;
  if (!body.name || !body.specialization || !body.departmentId || !body.phone) {
    res.status(400).json({ message: 'Name, specialisation, department and phone are required.' });
    return;
  }

  const existing = await db.select({ id: doctors.id }).from(doctors);
  const id = nextId('DR-', existing);

  const values = {
    id,
    name: body.name,
    specialization: body.specialization,
    departmentId: body.departmentId,
    phone: body.phone,
    email: body.email ?? '',
    status: (body.status as DoctorStatus) ?? 'active',
    availability: (body.availability as DoctorAvailability) ?? 'available',
    joinedDate: body.joinedDate ?? todayISO(),
    schedule: body.schedule ?? [
      { day: 'Monday', hours: '08:00 – 16:00' },
      { day: 'Tuesday', hours: '08:00 – 16:00' },
      { day: 'Wednesday', hours: '08:00 – 16:00' },
      { day: 'Thursday', hours: '08:00 – 16:00' },
      { day: 'Friday', hours: '08:00 – 16:00' },
    ],
    about: body.about ?? 'Newly added doctor.',
  };

  const inserted = await db.insert(doctors).values(values).returning();
  res.status(201).json(inserted[0]);
});

/** PATCH /api/doctors/:id */
router.patch('/doctors/:id', async (req, res) => {
  const { id: _id, ...patchFields } = (req.body ?? {}) as Partial<Doctor>;
  const updateData: Record<string, unknown> = {};
  const allowedKeys = ['name', 'specialization', 'departmentId', 'phone', 'email', 'status', 'availability', 'joinedDate', 'schedule', 'about'];
  for (const key of allowedKeys) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  const updated = await db.update(doctors)
    .set(updateData)
    .where(eq(doctors.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }
  res.json(updated[0]);
});

/* --------------------------------- Nurses --------------------------------- */

/** GET /api/nurses */
router.get('/nurses', async (_req, res) => {
  const rows = await db.select().from(nurses);
  const enriched = await Promise.all(
    rows.map(async (n) => {
      const deptRows = n.departmentId ? await db.select({ name: departments.name })
        .from(departments).where(eq(departments.id, n.departmentId)).limit(1) : [];
      return { ...n, departmentName: deptRows[0]?.name ?? '—' };
    }),
  );
  res.json(enriched);
});

/** POST /api/nurses */
router.post('/nurses', async (req, res) => {
  const body = (req.body ?? {}) as Partial<Nurse>;
  if (!body.name || !body.departmentId || !body.phone || !body.ward) {
    res.status(400).json({ message: 'Name, department, phone and ward are required.' });
    return;
  }

  const existing = await db.select({ id: nurses.id }).from(nurses);
  const id = nextId('NS-', existing);

  const values = {
    id,
    name: body.name,
    departmentId: body.departmentId,
    phone: body.phone,
    email: body.email ?? '',
    shift: (body.shift as Nurse['shift']) ?? 'Morning',
    ward: body.ward,
    status: (body.status as NurseStatus) ?? 'active',
    joinedDate: body.joinedDate ?? todayISO(),
  };

  const inserted = await db.insert(nurses).values(values).returning();
  res.status(201).json(inserted[0]);
});

/** PATCH /api/nurses/:id */
router.patch('/nurses/:id', async (req, res) => {
  const { id: _id, ...patchFields } = (req.body ?? {}) as Partial<Nurse>;
  const updateData: Record<string, unknown> = {};
  const allowedKeys = ['name', 'departmentId', 'phone', 'email', 'shift', 'ward', 'status', 'joinedDate'];
  for (const key of allowedKeys) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  const updated = await db.update(nurses)
    .set(updateData)
    .where(eq(nurses.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Nurse not found' });
    return;
  }
  res.json(updated[0]);
});

/* ------------------------------- Departments ------------------------------ */

/** GET /api/departments */
router.get('/departments', async (_req, res) => {
  res.json(await db.select().from(departments));
});

/** GET /api/departments/:id */
router.get('/departments/:id', async (req, res) => {
  const rows = await db.select().from(departments).where(eq(departments.id, req.params.id)).limit(1);
  res.json(rows[0] ?? null);
});

/** GET /api/departments/:id/staff */
router.get('/departments/:id/staff', async (req, res) => {
  const deptDoctors = await db.select({ name: doctors.name })
    .from(doctors).where(eq(doctors.departmentId, req.params.id));
  const deptNurses = await db.select({ name: nurses.name })
    .from(nurses).where(eq(nurses.departmentId, req.params.id));
  res.json({
    doctors: deptDoctors.map((d) => d.name),
    nurses: deptNurses.map((n) => n.name),
  });
});

/* ---------------------------------- Staff --------------------------------- */

/** GET /api/staff */
router.get('/staff', async (_req, res) => {
  const rows = await db.select().from(staff).orderBy(staff.name);
  res.json(rows);
});

/** POST /api/staff */
router.post('/staff', async (req, res) => {
  const body = (req.body ?? {}) as Partial<Staff>;
  if (!body.name || !body.role || !body.phone) {
    res.status(400).json({ message: 'Name, role and phone are required.' });
    return;
  }

  const existing = await db.select({ id: staff.id }).from(staff);
  const id = nextId('STF-', existing);

  const values = {
    id,
    name: body.name,
    role: body.role,
    department: body.department ?? '',
    phone: body.phone,
    email: body.email ?? '',
    status: (body.status as StaffStatus) ?? 'active',
    joinedDate: body.joinedDate ?? todayISO(),
  };

  const inserted = await db.insert(staff).values(values).returning();
  res.status(201).json(inserted[0]);
});

/** PATCH /api/staff/:id */
router.patch('/staff/:id', async (req, res) => {
  const { id: _id, ...patchFields } = (req.body ?? {}) as Partial<Staff>;
  const updateData: Record<string, unknown> = {};
  const allowedKeys = ['name', 'role', 'department', 'phone', 'email', 'status', 'joinedDate'];
  for (const key of allowedKeys) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  const updated = await db.update(staff)
    .set(updateData)
    .where(eq(staff.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Staff member not found' });
    return;
  }
  res.json(updated[0]);
});

/** PATCH /api/staff/:id/status { status } */
router.patch('/staff/:id/status', async (req, res) => {
  const status = (req.body ?? {}).status;
  if (status !== 'active' && status !== 'inactive') {
    res.status(400).json({ message: 'Status must be "active" or "inactive".' });
    return;
  }

  const updated = await db.update(staff)
    .set({ status })
    .where(eq(staff.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Staff member not found' });
    return;
  }
  res.json(updated[0]);
});

export default router;
