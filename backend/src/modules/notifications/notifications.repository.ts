import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import { notifications } from '../../db/schema';

export async function findAllNotifications() {
  return db.select().from(notifications).orderBy(desc(notifications.time));
}

export async function markAsRead(id: string) {
  const updated = await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, id))
    .returning();
  return updated[0];
}

export async function markAllAsRead() {
  await db.update(notifications).set({ read: true });
}
