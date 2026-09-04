import { searchPatients, searchDoctors, enrichDoctors } from './search.repository';

export async function globalSearch(q: string) {
  if (!q) return { patients: [], doctors: [] };

  const patRows = await searchPatients(q);
  const docRows = await searchDoctors(q);
  const enrichedDocs = await enrichDoctors(docRows);

  return {
    patients: patRows.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone })),
    doctors: enrichedDocs,
  };
}
