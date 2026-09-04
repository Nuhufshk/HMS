import { Router } from 'express';
import { db } from '../store';
import { MOCK_ACTIVITY } from '../data/activity';

const router = Router();

/** GET /api/notifications */
router.get('/notifications', (_req, res) => {
  res.json([...db.notifications].sort((a, b) => b.time.localeCompare(a.time)));
});

/** POST /api/notifications/:id/read */
router.post('/notifications/:id/read', (req, res) => {
  const idx = db.notifications.findIndex((n) => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Notification not found' });
    return;
  }
  db.notifications[idx] = { ...db.notifications[idx], read: true };
  res.json(db.notifications[idx]);
});

/** POST /api/notifications/read-all */
router.post('/notifications/read-all', (_req, res) => {
  db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
  res.status(204).end();
});

/** GET /api/activity?limit= */
router.get('/activity', (req, res) => {
  const limit = Number(req.query.limit) || 10;
  res.json([...MOCK_ACTIVITY].sort((a, b) => b.time.localeCompare(a.time)).slice(0, limit));
});

/** GET /api/search?q= — patients + doctors */
router.get('/search', (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  if (!q) {
    res.json({ patients: [], doctors: [] });
    return;
  }
  const patients = db.patients
    .filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')),
    )
    .slice(0, 5)
    .map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone }));

  const doctors = db.doctors
    .filter((d) => d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q) || d.id.toLowerCase().includes(q))
    .slice(0, 5)
    .map((d) => ({
      id: d.id,
      name: d.name,
      specialization: d.specialization,
      departmentName: db.departments.find((x) => x.id === d.departmentId)?.name ?? '—',
    }));

  res.json({ patients, doctors });
});

export default router;
