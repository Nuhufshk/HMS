import { wards as wardsTable, beds as bedsTable } from '../../db/schema';
import { findAllWards, generateWardId, insertWard, findBedsByWardId, generateBedId, insertBed, findAllBeds } from './wards.repository';
import type { WardInput } from '../../types';

export async function listWardsWithStats() {
  const allWards = await findAllWards();
  return Promise.all(
    allWards.map(async (ward) => {
      const wardBeds = await findBedsByWardId(ward.id);
      const occupied = wardBeds.filter((b) => b.status === 'occupied').length;
      return {
        ...ward,
        totalBeds: wardBeds.length,
        occupied,
        occupancyRate: wardBeds.length ? Math.round((occupied / wardBeds.length) * 100) : 0,
      };
    }),
  );
}

export async function createWardWithBeds(body: WardInput) {
  if (!body.name || !body.departmentId) {
    return { ward: undefined, error: 'Ward name and department are required.' };
  }

  const wardId = await generateWardId();
  const count = Math.max(1, Math.floor(Number(body.totalBeds) || 1));

  await insertWard({
    id: wardId,
    name: body.name.trim(),
    location: body.location?.trim() || 'Not specified',
    departmentId: body.departmentId,
  } as typeof wardsTable.$inferInsert);

  const existingBeds = await findAllBeds();
  const start = existingBeds.length + 1;
  const prefix = body.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 2) || 'BD';

  for (let i = 0; i < count; i++) {
    await insertBed({
      id: await generateBedId(),
      number: `${prefix}-${String(start + i).padStart(2, '0')}`,
      wardId,
      type: 'General',
      status: 'available',
      ratePerDay: 200,
    } as typeof bedsTable.$inferInsert);
  }

  const stats = (await listWardsWithStats()).find((w) => w.id === wardId);
  return { ward: stats, error: undefined };
}
