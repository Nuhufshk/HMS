import { Router } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db, nextId } from '../db';
import { doctors, nurses, departments, staff } from '../db/schema';
import { todayISO } from '../utils/date';
import type { Nurse, NurseStatus, Staff, StaffStatus } from '../types';

const router = Router();

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
