import { Router } from 'express';
import { eq, desc, like, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { notifications, patients, doctors, departments } from '../db/schema';
import { MOCK_ACTIVITY } from '../data/activity';

const router = Router();

/** GET /api/notifications */
router.get('/notifications', async (_req, res) => {
  const rows = await db.select().from(notifications).orderBy(desc(notifications.time));
  res.json(rows);
});

/** POST /api/notifications/:id/read */
router.post('/notifications/:id/read', async (req, res) => {
  const updated = await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, req.params.id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ message: 'Notification not found' });
    return;
  }
  res.json(updated[0]);
});

/** POST /api/notifications/read-all */
router.post('/notifications/read-all', async (_req, res) => {
  await db.update(notifications).set({ read: true });
  res.status(204).end();
});

/** GET /api/activity?limit= */
router.get('/activity', (req, res) => {
  const limit = Number(req.query.limit) || 10;
  res.json([...MOCK_ACTIVITY].sort((a, b) => b.time.localeCompare(a.time)).slice(0, limit));
});

/** GET /api/search?q= — patients + doctors */
router.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  if (!q) {
    res.json({ patients: [], doctors: [] });
    return;
  }

  const patRows = await db.select().from(patients).where(
    or(
      like(sql`lower(${patients.id})`, `%${q}%`),
      like(sql`lower(${patients.firstName} || ' ' || ${patients.lastName})`, `%${q}%`),
      like(sql`replace(${patients.phone}, ' ', '')`, `%${q.replace(/\s/g, '')}%`),
    )!
  ).limit(5);

  const docRows = await db.select().from(doctors).where(
    or(
      like(sql`lower(${doctors.name})`, `%${q}%`),
      like(sql`lower(${doctors.specialization})`, `%${q}%`),
      like(sql`lower(${doctors.id})`, `%${q}%`),
    )!
  ).limit(5);

  // Enrich doctors with department name
  const enrichedDocs = await Promise.all(
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

  res.json({
    patients: patRows.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone })),
    doctors: enrichedDocs,
  });
});

export default router;
