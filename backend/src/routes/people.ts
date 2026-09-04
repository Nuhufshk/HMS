import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, nextId } from '../db';
import { staff } from '../db/schema';
import { todayISO } from '../utils/date';
import type { Staff, StaffStatus } from '../types';

const router = Router();

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
