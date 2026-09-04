import type { LoginInput } from './auth.types';

export function validateLoginInput(body: unknown): LoginInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = String(b.email ?? '').trim().toLowerCase();
  const password = String(b.password ?? '');
  return { email, password };
}
