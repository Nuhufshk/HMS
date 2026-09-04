import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export { pool };

/** Generate the next sequential ID for a table (e.g. nextId('PT-', rows)). */
export function nextId(prefix: string, rows: Array<{ id: string }>): string {
  const max = rows.reduce((acc, item) => {
    const n = parseInt(item.id.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `${prefix}${max + 1}`;
}

/** Derive medicine stock status from quantity, reorder level, and expiry. */
export function deriveMedicineStatus(m: { quantity: number; reorderLevel: number; expiryDate: string }): 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' {
  const target = new Date(`${m.expiryDate}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((target - today.getTime()) / 86_400_000);
  if (daysLeft <= 0) return 'expired';
  if (m.quantity <= 0) return 'out_of_stock';
  if (m.quantity <= m.reorderLevel) return 'low_stock';
  return 'in_stock';
}
