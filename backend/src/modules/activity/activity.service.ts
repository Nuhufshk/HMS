import { MOCK_ACTIVITY } from '../../data/activity';

export async function listActivity(limit: number) {
  return [...MOCK_ACTIVITY]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, limit);
}
