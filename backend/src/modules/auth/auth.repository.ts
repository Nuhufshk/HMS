import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
import type { User } from '../../types';

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] as User | undefined;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] as User | undefined;
}
